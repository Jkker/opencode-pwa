// Terminal component with Ghostty WebAssembly terminal emulator.
// Provides real-time PTY communication via WebSocket.
// Uses TerminalController for React Strict Mode safe lifecycle management.
import { useRef, useEffect, useState } from 'react'

import type { LocalPTY } from '@/stores/terminal-store'

import { useTheme } from '@/hooks/use-theme'
import {
  TerminalController,
  type TerminalState,
  type TerminalColors,
} from '@/lib/terminal/terminal-controller'
import { cn } from '@/lib/utils'
import { settingStore } from '@/stores/setting-store'

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
  const controllerRef = useRef<TerminalController | null>(null)
  const [_terminalState, setTerminalState] = useState<TerminalState>({ status: 'idle' })
  const { resolvedTheme } = useTheme()
  const serverURL = settingStore.useValue('serverURL')

  const getTerminalColors = (): TerminalColors => {
    return DEFAULT_TERMINAL_COLORS[resolvedTheme]
  }

  // Store latest pty ref for cleanup callback
  const ptyRef = useRef(pty)
  ptyRef.current = pty

  // Store latest callbacks in refs to avoid recreating controller
  const onCleanupRef = useRef(onCleanup)
  const onConnectErrorRef = useRef(onConnectError)
  const onSubmitRef = useRef(onSubmit)
  onCleanupRef.current = onCleanup
  onConnectErrorRef.current = onConnectError
  onSubmitRef.current = onSubmit

  // Initialize terminal controller
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Create controller if not exists
    if (!controllerRef.current) {
      controllerRef.current = new TerminalController()
    }

    const controller = controllerRef.current

    // Initialize the controller
    void controller.initialize(
      container,
      {
        ptyId: pty.id,
        directory,
        serverURL,
        theme: getTerminalColors(),
        buffer: pty.buffer,
        rows: pty.rows,
        cols: pty.cols,
        scrollY: pty.scrollY,
      },
      {
        onStateChange: setTerminalState,
        onSubmit: () => onSubmitRef.current?.(),
        onConnectError: (error) => onConnectErrorRef.current?.(error),
      },
    )

    // Focus terminal after initialization
    controller.focus()

    return () => {
      // Get snapshot before disposing
      const snapshot = controller.getSnapshot()
      if (snapshot && onCleanupRef.current) {
        onCleanupRef.current({
          ...ptyRef.current,
          buffer: snapshot.buffer,
          rows: snapshot.rows,
          cols: snapshot.cols,
          scrollY: snapshot.scrollY,
        })
      }

      controller.dispose()
      controllerRef.current = null
    }
    // Only reinitialize when key identifiers change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pty.id, directory, serverURL])

  // Update theme when it changes
  useEffect(() => {
    controllerRef.current?.updateTheme(getTerminalColors())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTheme])

  return (
    <div
      ref={containerRef}
      data-component="terminal"
      data-testid="terminal-container"
      data-prevent-autofocus
      style={{ backgroundColor: getTerminalColors().background }}
      className={cn('size-full select-text px-6 py-3 font-mono', className)}
    />
  )
}
