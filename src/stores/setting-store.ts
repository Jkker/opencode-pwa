import { createStore } from 'zustand-x'

export const settingStore = createStore(
  {
    serverURL: import.meta.env.VITE_OPENCODE_SERVER_URL ?? 'http://localhost:4096',
    autoAcceptEdits: false,
    healthy: undefined as boolean | undefined,
  },
  {
    name: 'opencode-client-store',
    persist: true,
    devtools: true,
  },
).extendActions(({ set }) => ({
  setServerURL: (url: string) => set('serverURL', url),
  setHealthy: (healthy: boolean | undefined) => set('healthy', healthy),
  toggleAutoAcceptEdits: () => set('autoAcceptEdits', (value) => !value),
}))
