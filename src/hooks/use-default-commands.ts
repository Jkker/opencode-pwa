/**
 * Hook for registering default application commands.
 * These are available globally throughout the app.
 */
import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'

import { useCommands } from '@/lib/context/command'
import { useTheme } from '@/hooks/use-theme'
import { useLayoutStore } from '@/lib/opencode/layout-store'
import { usePermissionStore } from '@/lib/opencode/permission-store'
import { useSidebar } from '@/components/ui/sidebar'

export function useDefaultCommands() {
  const { registerCommand, unregisterCommand } = useCommands()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const { toggleSidebar, toggleTerminal, toggleReview } = useLayoutStore()
  const { toggleAutoAcceptEdits, autoAcceptEdits } = usePermissionStore()
  const { toggleSidebar: toggleSidebarUI } = useSidebar()

  useEffect(() => {
    const commands = [
      // Navigation
      {
        id: 'home',
        name: 'Go to Home',
        category: 'Navigation',
        keybind: 'mod+h',
        action: () => void navigate({ to: '/' }),
      },
      {
        id: 'new-session',
        name: 'New Session',
        description: 'Start a new coding session',
        category: 'Session',
        keybind: 'mod+shift+s',
        action: () => void navigate({ to: '/' }),
      },

      // Layout
      {
        id: 'toggle-sidebar',
        name: 'Toggle Sidebar',
        category: 'Layout',
        keybind: 'mod+b',
        action: () => {
          toggleSidebar()
          toggleSidebarUI()
        },
      },
      {
        id: 'toggle-terminal',
        name: 'Toggle Terminal',
        category: 'Layout',
        keybind: 'ctrl+`',
        action: toggleTerminal,
      },
      {
        id: 'toggle-review',
        name: 'Toggle Review Panel',
        category: 'Layout',
        keybind: 'mod+shift+r',
        action: toggleReview,
      },

      // Theme
      {
        id: 'theme-light',
        name: 'Switch to Light Theme',
        category: 'Theme',
        action: () => setTheme('light'),
      },
      {
        id: 'theme-dark',
        name: 'Switch to Dark Theme',
        category: 'Theme',
        action: () => setTheme('dark'),
      },
      {
        id: 'theme-system',
        name: 'Use System Theme',
        category: 'Theme',
        action: () => setTheme('system'),
      },
      {
        id: 'cycle-theme',
        name: 'Cycle Theme',
        category: 'Theme',
        keybind: 'mod+shift+t',
        action: () => {
          const themes = ['light', 'dark', 'system'] as const
          const currentIndex = themes.indexOf(theme)
          const nextIndex = (currentIndex + 1) % themes.length
          setTheme(themes[nextIndex])
        },
      },

      // Permissions
      {
        id: 'toggle-auto-accept',
        name: autoAcceptEdits ? 'Disable Auto-Accept Edits' : 'Enable Auto-Accept Edits',
        category: 'Permissions',
        keybind: 'mod+shift+a',
        action: toggleAutoAcceptEdits,
      },
    ]

    // Register all commands
    for (const command of commands) {
      registerCommand(command)
    }

    // Cleanup on unmount
    return () => {
      for (const command of commands) {
        unregisterCommand(command.id)
      }
    }
  }, [
    registerCommand,
    unregisterCommand,
    navigate,
    theme,
    setTheme,
    toggleSidebar,
    toggleSidebarUI,
    toggleTerminal,
    toggleReview,
    toggleAutoAcceptEdits,
    autoAcceptEdits,
  ])
}
