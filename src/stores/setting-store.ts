import { createStore } from 'zustand-x'

import { Theme } from '@/hooks/use-theme'

export interface ModelId {
  providerID: string
  modelID: string
}

export const settingStore = createStore(
  {
    serverURL: import.meta.env.VITE_OPENCODE_SERVER_URL ?? 'http://localhost:4096',
    autoAcceptEdits: false,
    healthy: undefined as boolean | undefined,
    selectedModel: {
      providerID: 'anthropic',
      modelID: 'claude-sonnet-4-20250514',
    } as ModelId,
    selectedAgent: 'build',
    selectedVariant: undefined as string | undefined,
    theme: 'system' as typeof Theme.infer,
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
  setSelectedModel: (model: ModelId) => set('selectedModel', model),
  setSelectedAgent: (agent: string) => set('selectedAgent', agent),
  setSelectedVariant: (variant: string | undefined) => set('selectedVariant', variant),
  setTheme: (theme: typeof Theme.infer) => set('theme', theme),
}))
