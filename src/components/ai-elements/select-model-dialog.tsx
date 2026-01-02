import {
  Brain,
  Check,
  ChevronsUpDown,
  Eye,
  FileText,
  Mic,
  Plus,
  Settings,
  Video,
  Wrench,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { ManageModelsDialog } from '@/components/ai-elements/manage-models-dialog'
import { ModelSelectorLogo } from '@/components/ai-elements/model-selector'
import { SelectProviderDialog } from '@/components/ai-elements/select-provider-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useModelVisibility } from '@/hooks/use-model-visibility'
import { useRecentModels, type ModelId } from '@/hooks/use-recent-models'
import { useProvidersQuery, type Model } from '@/lib/opencode/queries'
import { cn } from '@/lib/utils'

interface SelectModelDialogProps {
  selectedModel: ModelId
  onSelectModel: (model: ModelId) => void
  selectedVariant?: string
  onSelectVariant?: (variant: string | undefined) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactElement
  variant?: 'dialog' | 'popover'
  className?: string
}

interface ModelWithMeta {
  id: string
  name: string
  model?: Model
}

interface ProviderWithModels {
  id: string
  name: string
  connected: boolean
  models: ModelWithMeta[]
}

/** Icon for model capabilities */
function CapabilityIcon({
  capability,
  active,
  size = 'sm',
}: {
  capability: 'reasoning' | 'vision' | 'audio' | 'video' | 'pdf' | 'toolcall'
  active: boolean
  size?: 'sm' | 'md'
}) {
  const sizeClass = size === 'sm' ? 'size-3' : 'size-4'
  const Icon = {
    reasoning: Brain,
    vision: Eye,
    audio: Mic,
    video: Video,
    pdf: FileText,
    toolcall: Wrench,
  }[capability]

  if (!active) return null

  const label = capability === 'toolcall' ? 'Tool Use' : capability

  return (
    <Tooltip>
      <TooltipTrigger
        render={<Icon className={cn(sizeClass, 'text-muted-foreground cursor-help')} />}
      />
      <TooltipContent side="top">
        <span className="capitalize">{label}</span>
      </TooltipContent>
    </Tooltip>
  )
}

/** Model capability badges */
function ModelCapabilities({ model }: { model: Model }) {
  const caps = model.capabilities
  return (
    <div className="flex items-center gap-1">
      <CapabilityIcon capability="reasoning" active={caps.reasoning} />
      <CapabilityIcon capability="vision" active={caps.input.image} />
      <CapabilityIcon capability="audio" active={caps.input.audio} />
      <CapabilityIcon capability="video" active={caps.input.video} />
      <CapabilityIcon capability="pdf" active={caps.input.pdf} />
      <CapabilityIcon capability="toolcall" active={caps.toolcall} />
    </div>
  )
}

/** Variant selector for models with reasoning effort */
function VariantSelector({
  variants,
  selectedVariant,
  onSelectVariant,
}: {
  variants: string[]
  selectedVariant?: string
  onSelectVariant: (variant: string | undefined) => void
}) {
  if (variants.length === 0) return null

  // Common reasoning effort levels
  const orderedVariants = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh'].filter((v) =>
    variants.includes(v),
  )

  // Add any other variants not in the standard order
  const otherVariants = variants.filter((v) => !orderedVariants.includes(v))
  const allVariants = [...orderedVariants, ...otherVariants]

  const labels: Record<string, string> = {
    none: 'None',
    minimal: 'Min',
    low: 'Low',
    medium: 'Med',
    high: 'High',
    xhigh: 'Max',
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t bg-muted/30">
      <Zap className="size-3 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">Thinking:</span>
      <div className="flex gap-1">
        {allVariants.map((v) => (
          <Button
            key={v}
            variant={selectedVariant === v ? 'default' : 'outline'}
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => onSelectVariant(selectedVariant === v ? undefined : v)}
          >
            {labels[v] ?? v}
          </Button>
        ))}
      </div>
    </div>
  )
}

export function SelectModelDialog({
  selectedModel,
  onSelectModel,
  selectedVariant,
  onSelectVariant,
  open,
  onOpenChange,
  children,
  variant = 'dialog',
  className,
}: SelectModelDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [providerOpen, setProviderOpen] = useState(false)
  const [expandedModel, setExpandedModel] = useState<{
    providerID: string
    modelID: string
  } | null>(null)

  const isControlled = open !== undefined
  const show = isControlled ? open : internalOpen
  const setShow = isControlled ? onOpenChange! : setInternalOpen

  const { data: providersData } = useProvidersQuery()
  const { recentModels, addRecentModel } = useRecentModels()
  const { isModelVisible } = useModelVisibility()

  // Parse providers with connection status and full model data
  const providers = useMemo(() => {
    if (!providersData) return []

    const connected = new Set(providersData.connected)

    const providerList: ProviderWithModels[] = providersData.all.map((p) => ({
      id: p.id,
      name: p.name,
      connected: connected.has(p.id),
      models: Object.values(p.models).map((m) => ({
        id: m.id,
        name: m.name,
        model: m,
      })),
    }))

    // Sort: connected providers first, then by name
    return providerList.toSorted((a, b) => {
      if (a.connected !== b.connected) return b.connected ? 1 : -1
      return a.name.localeCompare(b.name)
    })
  }, [providersData])

  const handleSelect = (providerID: string, modelID: string, model?: Model) => {
    // If model has variants, expand it instead of selecting
    if (model?.variants && Object.keys(model.variants).length > 0 && onSelectVariant) {
      if (expandedModel?.providerID === providerID && expandedModel?.modelID === modelID) {
        setExpandedModel(null)
      } else {
        setExpandedModel({ providerID, modelID })
      }
      // Also select the model
      const modelSelection = { providerID, modelID }
      onSelectModel(modelSelection)
      addRecentModel(modelSelection)
      return
    }

    const modelSelection = { providerID, modelID }
    onSelectModel(modelSelection)
    addRecentModel(modelSelection)
    onSelectVariant?.(undefined)
    setShow(false)
  }

  // Find display names for recent models
  const recentModelsWithDetails = useMemo(() => {
    return recentModels
      .filter((rm) => isModelVisible(rm.providerID, rm.modelID))
      .map((rm) => {
        const provider = providers.find((p) => p.id === rm.providerID)
        const modelMeta = provider?.models.find((m) => m.id === rm.modelID)
        if (!provider || !modelMeta) return null
        return {
          ...rm,
          providerName: provider.name,
          modelName: modelMeta.name,
          model: modelMeta.model,
          connected: provider.connected,
        }
      })
      .filter((m): m is NonNullable<typeof m> => m !== null)
  }, [recentModels, providers, isModelVisible])

  // Get current model for variant display
  const currentModelData = useMemo(() => {
    const provider = providers.find((p) => p.id === selectedModel.providerID)
    return provider?.models.find((m) => m.id === selectedModel.modelID)?.model
  }, [providers, selectedModel])

  const currentVariants = currentModelData?.variants ? Object.keys(currentModelData.variants) : []

  const content = (
    <Command className="rounded-xl [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
      <CommandInput placeholder="Search models..." />
      <CommandList>
        <CommandEmpty>No models found.</CommandEmpty>

        {recentModelsWithDetails.length > 0 && (
          <CommandGroup heading="Recent">
            {recentModelsWithDetails.map((model) => (
              <CommandItem
                key={`${model.providerID}-${model.modelID}`}
                onSelect={() => handleSelect(model.providerID, model.modelID, model.model)}
                className="text-sm"
                disabled={!model.connected}
              >
                <ModelSelectorLogo provider={model.providerID} className="mr-2" />
                <span className="flex-1 truncate">
                  {model.modelName}{' '}
                  <span className="text-muted-foreground">by {model.providerName}</span>
                </span>
                <div className="flex items-center gap-2">
                  {model.model && <ModelCapabilities model={model.model} />}
                  {!model.connected && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      Disconnected
                    </Badge>
                  )}
                  {selectedModel.providerID === model.providerID &&
                    selectedModel.modelID === model.modelID && <Check className="size-4" />}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {providers.map((provider) => {
          const visibleModels = provider.models.filter((m) => isModelVisible(provider.id, m.id))

          if (visibleModels.length === 0) return null

          return (
            <CommandGroup
              key={provider.id}
              heading={
                <span className="flex items-center gap-2">
                  {provider.name}
                  {!provider.connected && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 font-normal">
                      Not connected
                    </Badge>
                  )}
                </span>
              }
            >
              {visibleModels.map((modelMeta) => {
                const isSelected =
                  selectedModel.providerID === provider.id && selectedModel.modelID === modelMeta.id
                const isExpanded =
                  expandedModel?.providerID === provider.id &&
                  expandedModel?.modelID === modelMeta.id
                const hasVariants =
                  modelMeta.model?.variants && Object.keys(modelMeta.model.variants).length > 0

                return (
                  <div key={`${provider.id}-${modelMeta.id}`}>
                    <CommandItem
                      onSelect={() => handleSelect(provider.id, modelMeta.id, modelMeta.model)}
                      className={cn('text-sm', !provider.connected && 'opacity-60')}
                      disabled={!provider.connected}
                    >
                      <ModelSelectorLogo provider={provider.id} className="mr-2" />
                      <span className="flex-1 truncate">{modelMeta.name}</span>
                      <div className="flex items-center gap-2">
                        {modelMeta.model && <ModelCapabilities model={modelMeta.model} />}
                        {hasVariants && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            <Zap className="size-2.5 mr-0.5" />
                            Thinking
                          </Badge>
                        )}
                        {isSelected && <Check className="size-4" />}
                      </div>
                    </CommandItem>
                    {isExpanded && isSelected && modelMeta.model?.variants && onSelectVariant && (
                      <VariantSelector
                        variants={Object.keys(modelMeta.model.variants)}
                        selectedVariant={selectedVariant}
                        onSelectVariant={onSelectVariant}
                      />
                    )}
                  </div>
                )
              })}
            </CommandGroup>
          )
        })}

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => setProviderOpen(true)}>
            <Plus className="mr-2 size-4" />
            Connect Provider
          </CommandItem>
          <CommandItem onSelect={() => setManageOpen(true)}>
            <Settings className="mr-2 size-4" />
            Manage Models
          </CommandItem>
        </CommandGroup>
      </CommandList>

      {/* Variant selector at bottom when model is selected */}
      {currentVariants.length > 0 && onSelectVariant && (
        <VariantSelector
          variants={currentVariants}
          selectedVariant={selectedVariant}
          onSelectVariant={onSelectVariant}
        />
      )}

      <ManageModelsDialog open={manageOpen} onOpenChange={setManageOpen} />
      <SelectProviderDialog open={providerOpen} onOpenChange={setProviderOpen} />
    </Command>
  )

  const trigger = children || (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={show}
      className={cn('w-[250px] justify-between', className)}
    >
      Select Model
      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
    </Button>
  )

  if (variant === 'popover') {
    return (
      <Popover open={show} onOpenChange={setShow}>
        <PopoverTrigger render={trigger} />
        <PopoverContent className="w-[350px] p-0" align="start">
          {content}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogTrigger render={trigger} />
      <DialogContent className="p-0 gap-0 sm:max-w-[450px]" showCloseButton={false}>
        <DialogTitle className="sr-only">Select Model</DialogTitle>
        {content}
      </DialogContent>
    </Dialog>
  )
}
