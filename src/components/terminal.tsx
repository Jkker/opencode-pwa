import { FitAddon, Ghostty, Terminal as GhosttyTerminal } from 'ghostty-web'
import { useEffect, useRef, useState } from 'react'

import { useTheme } from '@/hooks/use-theme'
import { useClient } from '@/lib/opencode/client'
import { SerializeAddon } from '@/lib/terminal/serialize-addon'
import { cn } from '@/lib/utils'
import { terminalStore, type LocalPTY } from '@/stores/terminal-store'

export interface TerminalProps {
  pty: LocalPTY
  directory?: string
  onSubmit?: () => void
  onCleanup?: (pty: LocalPTY) => void
  onConnectError?: (error: unknown) => void
  className?: string
}

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

export const Terminal = ({
  pty,
  directory,
  onSubmit,
  onCleanup,
  onConnectError,
  className,
}: TerminalProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const termRef = useRef<GhosttyTerminal | null>(null)
  const ghosttyRef = useRef<Ghostty | null>(null)
  const serializeAddonRef = useRef<SerializeAddon | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)

  const { resolvedTheme } = useTheme()
  const client = useClient(directory)

  const [terminalColors, setTerminalColors] = useState<TerminalColors>(
    DEFAULT_TERMINAL_COLORS[resolvedTheme] ?? DEFAULT_TERMINAL_COLORS.dark,
  )

  useEffect(() => {
    setTerminalColors(DEFAULT_TERMINAL_COLORS[resolvedTheme] ?? DEFAULT_TERMINAL_COLORS.dark)
  }, [resolvedTheme])

  useEffect(() => {
    const term = termRef.current
    if (!term) return

    const setOption = (
      term as unknown as { setOption?: (key: string, value: TerminalColors) => void }
    ).setOption
    if (setOption && typeof setOption === 'function') {
      setOption('theme', terminalColors)
    }
  }, [terminalColors])

  const copySelection = () => {
    const term = termRef.current
    if (!term || !term.hasSelection()) return false

    const selection = term.getSelection()
    if (!selection) return false

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(selection).catch(() => {})
      return true
    }

    const textarea = document.createElement('textarea')
    textarea.value = selection
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(textarea)
    return copied
  }

  const focusTerminal = () => {
    termRef.current?.focus()
  }

  const handlePointerDown = () => {
    const activeElement = document.activeElement
    if (activeElement instanceof HTMLElement && activeElement !== containerRef.current) {
      activeElement.blur()
    }
    focusTerminal()
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let cleanup: (() => void) | undefined

    const initTerminal = async () => {
      const ghostty = await Ghostty.load()
      ghosttyRef.current = ghostty

      const serverURL = import.meta.env.VITE_OPENCODE_SERVER_URL ?? 'http://localhost:4096'
      const ws = new WebSocket(`${serverURL.replace(/^http/, 'ws')}/pty/${pty.id}/connect`)
      wsRef.current = ws

      const term = new GhosttyTerminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'monospace',
        allowTransparency: true,
        theme: terminalColors,
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

      const fitAddon = new FitAddon()
      fitAddonRef.current = fitAddon
      const serializeAddon = new SerializeAddon()
      serializeAddonRef.current = serializeAddon

      term.loadAddon(serializeAddon)
      term.loadAddon(fitAddon)

      term.open(container)
      container.addEventListener('pointerdown', handlePointerDown)
      focusTerminal()

      if (pty.buffer) {
        if (pty.rows && pty.cols) {
          term.resize(pty.cols, pty.rows)
        }
        term.reset()
        term.write(pty.buffer)
        if (pty.scrollY !== undefined) {
          term.scrollToLine(pty.scrollY)
        }
        fitAddon.fit()
      }

      fitAddon.observeResize()

      const handleResize = () => fitAddon.fit()
      window.addEventListener('resize', handleResize)

      term.onResize(({ cols, rows }) => {
        if (ws.readyState === WebSocket.OPEN) {
          client.pty
            .update({
              ptyID: pty.id,
              size: { cols, rows },
            })
            .catch(() => {})
        }
      })

      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data)
        }
      })

      term.onKey(({ key }) => {
        if (key === '\r') {
          onSubmit?.()
        }
      })

      ws.addEventListener('open', () => {
        console.log('[Terminal] WebSocket connected')
        client.pty
          .update({
            ptyID: pty.id,
            size: { cols: term.cols, rows: term.rows },
          })
          .catch(() => {})
      })

      ws.addEventListener('message', (event) => {
        term.write(event.data)
      })

      ws.addEventListener('error', (error) => {
        console.error('[Terminal] WebSocket error:', error)
        onConnectError?.(error)
      })

      ws.addEventListener('close', () => {
        console.log('[Terminal] WebSocket disconnected')
      })

      cleanup = () => {
        window.removeEventListener('resize', handleResize)
        container.removeEventListener('pointerdown', handlePointerDown)

        if (serializeAddon && onCleanup) {
          const buffer = serializeAddon.serialize()
          onCleanup({
            ...pty,
            buffer,
            rows: term.rows,
            cols: term.cols,
            scrollY: term.getViewportY(),
          })
        }

        ws.close()
        term.dispose()
      }
    }

    initTerminal().catch((error) => {
      console.error('[Terminal] Failed to initialize:', error)
      onConnectError?.(error)
    })

    return () => {
      cleanup?.()
    }
  }, [pty.id, directory])

  return (
    <div
      ref={containerRef}
      data-component="terminal"
      data-prevent-autofocus
      style={{ backgroundColor: terminalColors.background }}
      className={cn('size-full select-text px-6 py-3 font-mono', className)}
    />
  )
}
