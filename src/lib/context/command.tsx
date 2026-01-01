/**
 * Command palette and keyboard shortcuts context.
 * Implements global command system like Mod+Shift+P.
 */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export interface Command {
  id: string
  name: string
  description?: string
  category?: string
  keybind?: string
  action: () => void
  /** Whether the command should appear in the palette */
  hidden?: boolean
}

interface CommandContextValue {
  commands: Command[]
  registerCommand: (command: Command) => void
  unregisterCommand: (id: string) => void
  executeCommand: (id: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  search: string
  setSearch: (search: string) => void
  filteredCommands: Command[]
}

const CommandContext = createContext<CommandContextValue | null>(null)

export function useCommands() {
  const context = useContext(CommandContext)
  if (!context) {
    throw new Error('useCommands must be used within a CommandProvider')
  }
  return context
}

interface CommandProviderProps {
  children: ReactNode
}

export function CommandProvider({ children }: CommandProviderProps) {
  const [commands, setCommands] = useState<Command[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const registerCommand = useCallback((command: Command) => {
    setCommands((prev) => {
      const existing = prev.find((c) => c.id === command.id)
      if (existing) {
        return prev.map((c) => (c.id === command.id ? command : c))
      }
      return [...prev, command]
    })
  }, [])

  const unregisterCommand = useCallback((id: string) => {
    setCommands((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const executeCommand = useCallback((id: string) => {
    const command = commands.find((c) => c.id === id)
    if (command) {
      command.action()
      setIsOpen(false)
      setSearch('')
    }
  }, [commands])

  const filteredCommands = commands
    .filter((c) => !c.hidden)
    .filter((c) => {
      if (!search) return true
      const searchLower = search.toLowerCase()
      return (
        c.name.toLowerCase().includes(searchLower) ||
        c.description?.toLowerCase().includes(searchLower) ||
        c.category?.toLowerCase().includes(searchLower)
      )
    })

  // Global keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey

      // Mod+Shift+P - Open command palette
      if (isMod && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        setIsOpen(true)
        return
      }

      // Check registered command keybinds
      for (const command of commands) {
        if (!command.keybind) continue
        
        const parts = command.keybind.toLowerCase().split('+')
        const key = parts.at(-1)
        const needsMod = parts.includes('mod')
        const needsShift = parts.includes('shift')
        const needsAlt = parts.includes('alt')

        if (
          e.key.toLowerCase() === key &&
          (needsMod ? isMod : !isMod) &&
          (needsShift ? e.shiftKey : !e.shiftKey) &&
          (needsAlt ? e.altKey : !e.altKey)
        ) {
          e.preventDefault()
          command.action()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commands])

  return (
    <CommandContext.Provider
      value={{
        commands,
        registerCommand,
        unregisterCommand,
        executeCommand,
        isOpen,
        setIsOpen,
        search,
        setSearch,
        filteredCommands,
      }}
    >
      {children}
    </CommandContext.Provider>
  )
}

/** Format keybind for display */
export function formatKeybind(keybind: string): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac')
  
  return keybind
    .replace(/mod/gi, isMac ? '⌘' : 'Ctrl')
    .replace(/shift/gi, isMac ? '⇧' : 'Shift')
    .replace(/alt/gi, isMac ? '⌥' : 'Alt')
    .replace(/\+/g, '')
    .replace(/arrowup/gi, '↑')
    .replace(/arrowdown/gi, '↓')
    .replace(/arrowleft/gi, '←')
    .replace(/arrowright/gi, '→')
    .replace(/backspace/gi, '⌫')
    .replace(/enter/gi, '↵')
    .replace(/escape/gi, 'Esc')
}
