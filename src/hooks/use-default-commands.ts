// Hook for registering default application commands.
// These are available globally throughout the app.
import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'

import { useSidebar } from '@/components/ui/sidebar'
import { useTheme } from '@/hooks/use-theme'
import { useCommands } from '@/lib/context/command'
import { layoutStore } from '@/stores/layout-store'
import { settingStore } from '@/stores/setting-store'

export function useDefaultCommands() {
  const { registerCommand, unregisterCommand } = useCommands()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const autoAcceptEdits = settingStore.useValue('autoAcceptEdits')
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
          layoutStore.set('sidebarOpen', (v) => !v)
          toggleSidebarUI()
        },
      },
      {
        id: 'toggle-terminal',
        name: 'Toggle Terminal',
        category: 'Layout',
        keybind: 'ctrl+`',
        action: () => layoutStore.set('terminalOpen', (v) => !v),
      },
      {
        id: 'toggle-review',
        name: 'Toggle Review Panel',
        category: 'Layout',
        keybind: 'mod+shift+r',
        action: () => layoutStore.set('reviewOpen', (v) => !v),
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
        action: settingStore.actions.toggleAutoAcceptEdits,
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
    toggleSidebarUI,
    autoAcceptEdits,
  ])
}
