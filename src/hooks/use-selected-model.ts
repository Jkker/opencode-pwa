// Hook for managing selected model state with store and derived data
import { useMemo } from 'react'

import { useProvidersQuery, type Model } from '@/lib/opencode/queries'
import { settingStore, type ModelId } from '@/stores/setting-store'

export type { ModelId } from '@/stores/setting-store'

export interface ModelWithProvider extends Model {
  provider: {
    id: string
    name: string
    connected: boolean
  }
}

export function useSelectedModel() {
  const selectedModel = settingStore.useValue('selectedModel')
  const selectedVariant = settingStore.useValue('selectedVariant')
  const { data: providersData } = useProvidersQuery()

  const modelDetails = useMemo(() => {
    if (!providersData) return null

    const provider = providersData.all.find((p) => p.id === selectedModel.providerID)
    if (!provider) return null

    const model = provider.models[selectedModel.modelID]
    if (!model) return null

    const connected = providersData.connected.includes(provider.id)

    return {
      ...model,
      provider: {
        id: provider.id,
        name: provider.name,
        connected,
      },
    } satisfies ModelWithProvider
  }, [providersData, selectedModel])

  const availableVariants = useMemo(() => {
    if (!modelDetails?.variants) return []
    return Object.keys(modelDetails.variants)
  }, [modelDetails])

  const setModel = (model: ModelId) => {
    settingStore.actions.setSelectedModel(model)
    // Reset variant when model changes
    settingStore.actions.setSelectedVariant(undefined)
  }

  const setVariant = (variant: string | undefined) => {
    settingStore.actions.setSelectedVariant(variant)
  }

  return {
    selectedModel,
    selectedVariant,
    modelDetails,
    availableVariants,
    setModel,
    setVariant,
    hasVariants: availableVariants.length > 0,
    displayName: modelDetails?.name ?? selectedModel.modelID,
    isConnected: modelDetails?.provider.connected ?? false,
  }
}

// Helper to get all available models grouped by provider
export function useAvailableModels() {
  const { data: providersData } = useProvidersQuery()

  return useMemo(() => {
    if (!providersData) return { providers: [], connectedProviders: [] }

    const connected = new Set(providersData.connected)

    const providers = providersData.all.map((provider) => ({
      ...provider,
      connected: connected.has(provider.id),
      modelList: Object.values(provider.models),
    }))

    // Sort: connected providers first, then by name
    const sortedProviders = providers.toSorted((a, b) => {
      if (a.connected !== b.connected) return b.connected ? 1 : -1
      return a.name.localeCompare(b.name)
    })

    return {
      providers: sortedProviders,
      connectedProviders: sortedProviders.filter((p) => p.connected),
    }
  }, [providersData])
}
