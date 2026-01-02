import { createStore } from 'zustand-x'

const modelVisibilityStore = createStore(
  {
    hiddenModels: [] as string[],
  },
  {
    name: 'opencode-model-visibility',
    persist: true,
  },
).extendActions(({ set, get }) => ({
  toggleModelVisibility: (providerID: string, modelID: string) => {
    const key = `${providerID}/${modelID}`
    const current = get('hiddenModels')

    if (current.includes(key)) {
      set(
        'hiddenModels',
        current.filter((k) => k !== key),
      )
    } else {
      set('hiddenModels', [...current, key])
    }
  },
  showModel: (providerID: string, modelID: string) => {
    const key = `${providerID}/${modelID}`
    set(
      'hiddenModels',
      get('hiddenModels').filter((k) => k !== key),
    )
  },
  hideModel: (providerID: string, modelID: string) => {
    const key = `${providerID}/${modelID}`
    const current = get('hiddenModels')
    if (!current.includes(key)) {
      set('hiddenModels', [...current, key])
    }
  },
}))

export function useModelVisibility() {
  const hiddenModels = modelVisibilityStore.useValue('hiddenModels')

  const isModelVisible = (providerID: string, modelID: string) => {
    return !hiddenModels.includes(`${providerID}/${modelID}`)
  }

  return {
    hiddenModels,
    isModelVisible,
    toggleModelVisibility: modelVisibilityStore.actions.toggleModelVisibility,
    showModel: modelVisibilityStore.actions.showModel,
    hideModel: modelVisibilityStore.actions.hideModel,
  }
}
