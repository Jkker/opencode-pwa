import { Eye, EyeOff } from 'lucide-react'
import { useMemo } from 'react'

import { ModelSelectorLogo } from '@/components/ai-elements/model-selector'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useModelVisibility } from '@/hooks/use-model-visibility'
import { useProvidersQuery } from '@/lib/opencode/queries'

interface ManageModelsDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ManageModelsDialog({ open, onOpenChange }: ManageModelsDialogProps) {
  const { data: providersData } = useProvidersQuery()
  const { isModelVisible, toggleModelVisibility } = useModelVisibility()

  const providers = useMemo(() => {
    if (!providersData) return []
    return providersData.all.map((p) => ({
      id: p.id,
      name: p.name,
      models: Object.values(p.models || {}).map((m) => ({
        id: m.id,
        name: m.name,
      })),
    }))
  }, [providersData])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-[550px]">
        <DialogTitle className="sr-only">Manage Models</DialogTitle>
        <Command className="rounded-xl [\u0026_[cmdk-group-heading]]:px-2 [\u0026_[cmdk-group-heading]]:font-medium [\u0026_[cmdk-group-heading]]:text-muted-foreground">
          <CommandInput placeholder="Search models..." />
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>No models found.</CommandEmpty>
            {providers.map((provider) => (
              <CommandGroup key={provider.id} heading={provider.name}>
                {provider.models.map((model) => {
                  const visible = isModelVisible(provider.id, model.id)
                  return (
                    <CommandItem
                      key={`${provider.id}-${model.id}`}
                      onSelect={() => toggleModelVisibility(provider.id, model.id)}
                      className="cursor-pointer text-sm"
                    >
                      <ModelSelectorLogo provider={provider.id} className="mr-2" />
                      <span className="flex-1 truncate">{model.name}</span>
                      <div className="ml-auto flex items-center gap-2">
                        {visible ? (
                          <Eye className="size-4 text-muted-foreground" />
                        ) : (
                          <EyeOff className="size-4 text-muted-foreground/50" />
                        )}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
