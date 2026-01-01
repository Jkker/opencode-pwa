/**
 * Permission context for handling edit permissions.
 * Manages auto-accept mode and permission requests.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PermissionStore {
  autoAcceptEdits: boolean
  setAutoAcceptEdits: (value: boolean) => void
  toggleAutoAcceptEdits: () => void
}

export const usePermissionStore = create<PermissionStore>()(
  persist(
    (set) => ({
      autoAcceptEdits: false,
      setAutoAcceptEdits: (value) => set({ autoAcceptEdits: value }),
      toggleAutoAcceptEdits: () => set((state) => ({ autoAcceptEdits: !state.autoAcceptEdits })),
    }),
    {
      name: 'opencode-permissions',
    }
  )
)
