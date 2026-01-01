/**
 * OpenCode server connection store using Zustand.
 * Manages server URL, health status, and connection state.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getOpencodeClient } from './client'

interface ServerState {
  url: string
  healthy: boolean | undefined
  name: string
}

interface ServerActions {
  setUrl: (url: string) => void
  checkHealth: () => Promise<void>
}

type ServerStore = ServerState & ServerActions

const DEFAULT_URL = import.meta.env.VITE_OPENCODE_SERVER_URL ?? 'http://localhost:4096'

export const useServerStore = create<ServerStore>()(
  persist(
    (set, _get) => ({
      url: DEFAULT_URL,
      healthy: undefined,
      name: 'Local Server',

      setUrl: (url: string) => {
        set({ url, healthy: undefined, name: url })
      },

      checkHealth: async () => {
        try {
          const client = getOpencodeClient()
          const result = await client.global.health()
          if (result.data) {
            set({ healthy: true })
          } else {
            set({ healthy: false })
          }
        } catch {
          set({ healthy: false })
        }
      },
    }),
    {
      name: 'opencode-server',
      partialize: (state) => ({ url: state.url }),
    }
  )
)
