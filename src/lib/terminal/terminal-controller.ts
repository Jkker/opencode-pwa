/**
 * Terminal Controller - State machine for terminal lifecycle management.
 * Handles WebSocket connections, terminal instances, and side effects.
 * Designed to be React Strict Mode safe.
 */
import { Ghostty, Terminal as GhosttyTerminal, FitAddon } from 'ghostty-web'

import { SerializeAddon } from './serialize-addon'

// Terminal state machine states
export type TerminalState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'connected' }
  | { status: 'disconnected' }
  | { status: 'error'; error: unknown }
  | { status: 'disposed' }

export interface TerminalColors {
  background: string
  foreground: string
  cursor: string
}

export interface TerminalConfig {
  ptyId: string
  directory: string
  serverURL: string
  theme: TerminalColors
  buffer?: string
  rows?: number
  cols?: number
  scrollY?: number
}

export interface TerminalSnapshot {
  buffer: string
  rows: number
  cols: number
  scrollY: number
}

export interface TerminalControllerCallbacks {
  onStateChange?: (state: TerminalState) => void
  onSubmit?: () => void
  onConnectError?: (error: unknown) => void
}

/**
 * Terminal controller manages the terminal instance lifecycle.
 * It provides a clean separation between React and terminal side effects.
 */
export class TerminalController {
  private state: TerminalState = { status: 'idle' }
  private terminal: GhosttyTerminal | null = null
  private websocket: WebSocket | null = null
  private serializeAddon: SerializeAddon | null = null
  private fitAddon: FitAddon | null = null
  private container: HTMLElement | null = null
  private resizeHandler: (() => void) | null = null
  private pointerDownHandler: (() => void) | null = null
  private config: TerminalConfig | null = null
  private callbacks: TerminalControllerCallbacks = {}
  private disposed = false
  private initPromise: Promise<void> | null = null

  /**
   * Initialize the terminal with the given configuration.
   * Returns a promise that resolves when the terminal is ready.
   * Safe to call multiple times - will only initialize once.
   */
  async initialize(
    container: HTMLElement,
    config: TerminalConfig,
    callbacks: TerminalControllerCallbacks = {},
  ): Promise<void> {
    // Prevent double initialization (React Strict Mode safety)
    if (this.initPromise) {
      return this.initPromise
    }

    if (this.disposed) {
      throw new Error('Cannot initialize a disposed terminal controller')
    }

    this.container = container
    this.config = config
    this.callbacks = callbacks

    this.initPromise = this.doInitialize()
    return this.initPromise
  }

  private async doInitialize(): Promise<void> {
    if (!this.container || !this.config) return

    this.setState({ status: 'loading' })

    try {
      // Load Ghostty WASM
      const ghostty = await Ghostty.load()

      // Check if disposed during async load
      if (this.disposed) return

      // Create terminal instance
      this.terminal = new GhosttyTerminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'JetBrainsMonoNerdFont, monospace',
        allowTransparency: true,
        theme: this.config.theme,
        scrollback: 10_000,
        ghostty,
      })

      // Setup key handlers
      this.terminal.attachCustomKeyEventHandler((event) => {
        return this.handleKeyEvent(event)
      })

      // Create and attach addons
      this.fitAddon = new FitAddon()
      this.serializeAddon = new SerializeAddon()
      this.terminal.loadAddon(this.serializeAddon)
      this.terminal.loadAddon(this.fitAddon)

      // Open terminal in container
      this.terminal.open(this.container)

      // Restore buffer if available
      if (this.config.buffer) {
        if (this.config.rows && this.config.cols) {
          this.terminal.resize(this.config.cols, this.config.rows)
        }
        this.terminal.reset()
        this.terminal.write(this.config.buffer)
        if (this.config.scrollY) {
          this.terminal.scrollToLine(this.config.scrollY)
        }
        this.fitAddon.fit()
      }

      // Setup resize handling
      this.fitAddon.observeResize()
      this.resizeHandler = () => this.fitAddon?.fit()
      window.addEventListener('resize', this.resizeHandler)

      // Setup terminal event handlers
      this.terminal.onResize((size) => {
        void this.syncSize(size.cols, size.rows)
      })

      this.terminal.onData((data) => {
        this.sendData(data)
      })

      this.terminal.onKey(({ key }) => {
        if (key === 'Enter') {
          this.callbacks.onSubmit?.()
        }
      })

      // Setup pointer handler for focus
      this.pointerDownHandler = () => {
        const activeElement = document.activeElement
        if (activeElement instanceof HTMLElement && activeElement !== this.container) {
          activeElement.blur()
        }
        this.terminal?.focus()
      }
      this.container.addEventListener('pointerdown', this.pointerDownHandler)

      // Connect WebSocket
      await this.connect()
    } catch (error) {
      this.setState({ status: 'error', error })
      this.callbacks.onConnectError?.(error)
    }
  }

  private handleKeyEvent(event: KeyboardEvent): boolean {
    const key = event.key.toLowerCase()

    // Handle copy shortcuts
    if (key === 'c') {
      const macCopy = event.metaKey && !event.ctrlKey && !event.altKey
      const linuxCopy = event.ctrlKey && event.shiftKey && !event.metaKey
      if ((macCopy || linuxCopy) && this.copySelection()) {
        event.preventDefault()
        return true
      }
    }

    // Handle Ctrl+` passthrough
    if (event.ctrlKey && key === '`') {
      event.preventDefault()
      return true
    }

    return false
  }

  private copySelection(): boolean {
    if (!this.terminal?.hasSelection()) return false
    const selection = this.terminal.getSelection()
    if (!selection) return false

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(selection).catch(() => {})
      return true
    }

    // Fallback for older browsers without Clipboard API
    if (!document.body) return false
    const textarea = document.createElement('textarea')
    textarea.value = selection
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    // Using deprecated execCommand for legacy browser support (Safari < 13.1, older mobile browsers)
    const copied = document.execCommand('copy')
    document.body.removeChild(textarea)
    return copied
  }

  private async connect(): Promise<void> {
    if (!this.config || this.disposed) return

    const { serverURL, ptyId, directory } = this.config
    const wsUrl = `${serverURL.replace(/^http/, 'ws')}/pty/${ptyId}/connect?directory=${encodeURIComponent(directory)}`

    this.websocket = new WebSocket(wsUrl)

    return new Promise((resolve, reject) => {
      if (!this.websocket) {
        reject(new Error('WebSocket not created'))
        return
      }

      this.websocket.addEventListener('open', async () => {
        this.setState({ status: 'connected' })
        await this.syncSize(this.terminal?.cols ?? 80, this.terminal?.rows ?? 24)
        resolve()
      })

      this.websocket.addEventListener('message', (event) => {
        this.terminal?.write(event.data as string)
      })

      this.websocket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error)
        this.setState({ status: 'error', error })
        this.callbacks.onConnectError?.(error)
        reject(error)
      })

      this.websocket.addEventListener('close', () => {
        if (!this.disposed) {
          this.setState({ status: 'disconnected' })
        }
      })
    })
  }

  private async syncSize(cols: number, rows: number): Promise<void> {
    if (!this.config || !this.websocket || this.websocket.readyState !== WebSocket.OPEN) return

    try {
      const { serverURL, ptyId, directory } = this.config
      const updateUrl = `${serverURL}/pty/${ptyId}?directory=${encodeURIComponent(directory)}`
      await fetch(updateUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ size: { cols, rows } }),
      })
    } catch {
      // Ignore resize sync errors
    }
  }

  private sendData(data: string): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(data)
    }
  }

  private setState(state: TerminalState): void {
    if (this.disposed && state.status !== 'disposed') return
    this.state = state
    this.callbacks.onStateChange?.(state)
  }

  /**
   * Update the terminal theme
   */
  updateTheme(theme: TerminalColors): void {
    if (!this.terminal) return

    const setOption = (
      this.terminal as unknown as { setOption?: (key: string, value: TerminalColors) => void }
    ).setOption

    if (setOption) {
      setOption('theme', theme)
    }
  }

  /**
   * Focus the terminal
   */
  focus(): void {
    this.terminal?.focus()
  }

  /**
   * Get the current terminal state
   */
  getState(): TerminalState {
    return this.state
  }

  /**
   * Get a snapshot of the terminal state for persistence
   */
  getSnapshot(): TerminalSnapshot | null {
    if (!this.terminal || !this.serializeAddon) return null

    return {
      buffer: this.serializeAddon.serialize(),
      rows: this.terminal.rows,
      cols: this.terminal.cols,
      scrollY: this.terminal.getViewportY(),
    }
  }

  /**
   * Check if the controller has been disposed
   */
  isDisposed(): boolean {
    return this.disposed
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    if (this.disposed) return
    this.disposed = true

    // Remove event listeners
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
      this.resizeHandler = null
    }

    if (this.pointerDownHandler && this.container) {
      this.container.removeEventListener('pointerdown', this.pointerDownHandler)
      this.pointerDownHandler = null
    }

    // Close WebSocket
    if (this.websocket) {
      this.websocket.close()
      this.websocket = null
    }

    // Dispose terminal
    if (this.terminal) {
      this.terminal.dispose()
      this.terminal = null
    }

    this.serializeAddon = null
    this.fitAddon = null
    this.container = null
    this.initPromise = null

    this.setState({ status: 'disposed' })
  }
}
