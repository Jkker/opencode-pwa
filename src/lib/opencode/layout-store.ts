/**
 * OpenCode layout store using Zustand.
 * Manages UI layout state like sidebar, panels, etc.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LayoutState {
  sidebarOpen: boolean
  sidebarWidth: number
  terminalOpen: boolean
  terminalHeight: number
  reviewOpen: boolean
  reviewWidth: number
  diffStyle: 'unified' | 'split'
}

interface LayoutActions {
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSidebarWidth: (width: number) => void
  toggleTerminal: () => void
  setTerminalOpen: (open: boolean) => void
  setTerminalHeight: (height: number) => void
  toggleReview: () => void
  setReviewOpen: (open: boolean) => void
  setReviewWidth: (width: number) => void
  setDiffStyle: (style: 'unified' | 'split') => void
}

type LayoutStore = LayoutState & LayoutActions

export const useLayoutStore = create<LayoutStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarWidth: 280,
      terminalOpen: false,
      terminalHeight: 300,
      reviewOpen: false,
      reviewWidth: 500,
      diffStyle: 'unified',

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      toggleTerminal: () => set((state) => ({ terminalOpen: !state.terminalOpen })),
      setTerminalOpen: (open) => set({ terminalOpen: open }),
      setTerminalHeight: (height) => set({ terminalHeight: height }),
      toggleReview: () => set((state) => ({ reviewOpen: !state.reviewOpen })),
      setReviewOpen: (open) => set({ reviewOpen: open }),
      setReviewWidth: (width) => set({ reviewWidth: width }),
      setDiffStyle: (style) => set({ diffStyle: style }),
    }),
    {
      name: 'opencode-layout',
    }
  )
)
