import { createStore } from 'zustand-x'

export interface ModelId {
  providerID: string
  modelID: string
}

const MAX_RECENT = 5

const recentModelsStore = createStore(
  {
    recentModels: [] as ModelId[],
  },
  {
    name: 'opencode-recent-models',
    persist: true,
  },
).extendActions(({ set, get }) => ({
  addRecentModel: (model: ModelId) => {
    const current = get('recentModels')
    const filtered = current.filter(
      (m) => !(m.providerID === model.providerID && m.modelID === model.modelID),
    )
    set('recentModels', [model, ...filtered].slice(0, MAX_RECENT))
  },
  clearRecentModels: () => {
    set('recentModels', [])
  },
}))

export function useRecentModels() {
  const recentModels = recentModelsStore.useValue('recentModels')

  return {
    recentModels,
    addRecentModel: recentModelsStore.actions.addRecentModel,
    clearRecentModels: recentModelsStore.actions.clearRecentModels,
  }
}
