// OpenCode layout store using Zustand X.
// Manages UI layout state like sidebar, panels, etc.
import { createStore } from 'zustand-x'

export const layoutStore = createStore(
  {
    sidebarOpen: true,
    sidebarWidth: 280,
    terminalOpen: false,
    terminalHeight: 300,
    reviewOpen: false,
    reviewWidth: 500,
    diffStyle: 'unified' as 'unified' | 'split',
  },
  {
    name: 'opencode-layout',
    persist: true,
  },
)
