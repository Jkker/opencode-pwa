// Terminal component with Ghostty WebAssembly terminal emulator.
// Provides real-time PTY communication via WebSocket.
import { Ghostty, Terminal as Term, FitAddon } from 'ghostty-web'
import { useRef, useEffect } from 'react'

import type { LocalPTY } from '@/stores/terminal-store'

import { useTheme } from '@/hooks/use-theme'
import { SerializeAddon } from '@/lib/terminal/serialize-addon'
import { cn } from '@/lib/utils'
import { settingStore } from '@/stores/setting-store'

interface TerminalColors {
  background: string
  foreground: string
  cursor: string
}

const DEFAULT_TERMINAL_COLORS: Record<'light' | 'dark', TerminalColors> = {
  light: {
    background: '#fcfcfc',
    foreground: '#211e1e',
    cursor: '#211e1e',
  },
  dark: {
    background: '#191515',
    foreground: '#d4d4d4',
    cursor: '#d4d4d4',
  },
}

export interface TerminalProps {
  pty: LocalPTY
  directory: string
  onCleanup?: (pty: LocalPTY) => void
  onConnectError?: (error: unknown) => void
  onSubmit?: () => void
  className?: string
}

export function Terminal({
  pty,
  directory,
  onCleanup,
  onConnectError,
  onSubmit,
  className,
}: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Term | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const serializeAddonRef = useRef<SerializeAddon | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const { resolvedTheme } = useTheme()
  const serverURL = settingStore.useValue('serverURL')

  const getTerminalColors = (): TerminalColors => {
    return DEFAULT_TERMINAL_COLORS[resolvedTheme]
  }

  const copySelection = () => {
    const term = termRef.current
    if (!term?.hasSelection()) return false
    const selection = term.getSelection()
    if (!selection) return false
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(selection).catch(() => {})
      return true
    }
    // Fallback for older browsers without Clipboard API support
    if (!document.body) return false
    const textarea = document.createElement('textarea')
    textarea.value = selection
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    // Fallback using deprecated execCommand for legacy browser support
    const copied = document.execCommand('copy')
    document.body.removeChild(textarea)
    return copied
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let term: Term
    let ws: WebSocket
    let serializeAddon: SerializeAddon
    let fitAddon: FitAddon
    let resizeHandler: () => void
    let pointerDownHandler: () => void

    const init = async () => {
      const ghostty = await Ghostty.load()

      const wsUrl = `${serverURL.replace(/^http/, 'ws')}/pty/${pty.id}/connect?directory=${encodeURIComponent(directory)}`
      ws = new WebSocket(wsUrl)
      wsRef.current = ws

      term = new Term({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'JetBrainsMonoNerdFont, monospace',
        allowTransparency: true,
        theme: getTerminalColors(),
        scrollback: 10_000,
        ghostty,
      })
      termRef.current = term

      term.attachCustomKeyEventHandler((event) => {
        const key = event.key.toLowerCase()
        if (key === 'c') {
          const macCopy = event.metaKey && !event.ctrlKey && !event.altKey
          const linuxCopy = event.ctrlKey && event.shiftKey && !event.metaKey
          if ((macCopy || linuxCopy) && copySelection()) {
            event.preventDefault()
            return true
          }
        }
        if (event.ctrlKey && key === '`') {
          event.preventDefault()
          return true
        }
        return false
      })

      fitAddon = new FitAddon()
      serializeAddon = new SerializeAddon()
      fitAddonRef.current = fitAddon
      serializeAddonRef.current = serializeAddon

      term.loadAddon(serializeAddon)
      term.loadAddon(fitAddon)

      term.open(container)
      term.focus()

      if (pty.buffer) {
        if (pty.rows && pty.cols) {
          term.resize(pty.cols, pty.rows)
        }
        term.reset()
        term.write(pty.buffer)
        if (pty.scrollY) {
          term.scrollToLine(pty.scrollY)
        }
        fitAddon.fit()
      }

      fitAddon.observeResize()
      resizeHandler = () => fitAddon.fit()
      window.addEventListener('resize', resizeHandler)

      term.onResize(async (size) => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            const updateUrl = `${serverURL}/pty/${pty.id}?directory=${encodeURIComponent(directory)}`
            await fetch(updateUrl, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ size: { cols: size.cols, rows: size.rows } }),
            })
          } catch {}
        }
      })

      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data)
        }
      })

      term.onKey(({ key }) => {
        if (key === 'Enter') {
          onSubmit?.()
        }
      })

      pointerDownHandler = () => {
        const activeElement = document.activeElement
        if (activeElement instanceof HTMLElement && activeElement !== container) {
          activeElement.blur()
        }
        term.focus()
      }
      container.addEventListener('pointerdown', pointerDownHandler)

      ws.addEventListener('open', async () => {
        try {
          const updateUrl = `${serverURL}/pty/${pty.id}?directory=${encodeURIComponent(directory)}`
          await fetch(updateUrl, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ size: { cols: term.cols, rows: term.rows } }),
          })
        } catch {}
      })

      ws.addEventListener('message', (event) => {
        term.write(event.data as string)
      })

      ws.addEventListener('error', (error) => {
        console.error('WebSocket error:', error)
        onConnectError?.(error)
      })

      ws.addEventListener('close', () => {
        console.log('WebSocket disconnected')
      })
    }

    void init()

    return () => {
      window.removeEventListener('resize', resizeHandler)
      container.removeEventListener('pointerdown', pointerDownHandler)

      if (serializeAddonRef.current && onCleanup && termRef.current) {
        const buffer = serializeAddonRef.current.serialize()
        onCleanup({
          ...pty,
          buffer,
          rows: termRef.current.rows,
          cols: termRef.current.cols,
          scrollY: termRef.current.getViewportY(),
        })
      }

      wsRef.current?.close()
      termRef.current?.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reconnect when pty.id, directory, or serverURL changes
  }, [pty.id, directory, serverURL])

  useEffect(() => {
    const term = termRef.current
    if (!term) return
    const colors = getTerminalColors()
    const setOption = (
      term as unknown as { setOption?: (key: string, value: TerminalColors) => void }
    ).setOption
    if (setOption) {
      setOption('theme', colors)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only update theme when resolvedTheme changes
  }, [resolvedTheme])

  return (
    <div
      ref={containerRef}
      data-component="terminal"
      data-prevent-autofocus
      style={{ backgroundColor: getTerminalColors().background }}
      className={cn('size-full select-text px-6 py-3 font-mono', className)}
    />
  )
}
