import { useQueryClient } from '@tanstack/react-query'
import { Check, Loader2, Key } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'

import { ModelSelectorLogo } from '@/components/ai-elements/model-selector'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  useProvidersQuery,
  useProviderAuthQuery,
  useOAuthAuthorizeMutation,
  useSetAuthMutation,
  queryKeys,
} from '@/lib/opencode/queries'
import { cn } from '@/lib/utils'
import { settingStore } from '@/stores/setting-store'

interface SelectProviderDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type View = 'list' | 'api-key'

export function SelectProviderDialog({ open, onOpenChange }: SelectProviderDialogProps) {
  const { data: providersData } = useProvidersQuery()
  const { data: authMethods } = useProviderAuthQuery()
  const oauthMutation = useOAuthAuthorizeMutation()
  const setAuthMutation = useSetAuthMutation()
  const queryClient = useQueryClient()
  const serverUrl = settingStore.useValue('serverURL')

  const [view, setView] = useState<View>('list')
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Track if we are waiting for OAuth to complete
  const isWaitingForOAuth = useRef(false)

  const providers = providersData?.all ?? []
  const connected = new Set(providersData?.connected ?? [])

  // Refetch providers when window regains focus if we initiated OAuth
  useEffect(() => {
    const handleFocus = () => {
      if (isWaitingForOAuth.current) {
        // Delay slightly to allow server to process callback
        setTimeout(() => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.providers(serverUrl) })
          isWaitingForOAuth.current = false
        }, 1000)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [queryClient, serverUrl])

  // Sort: unconnected first, then by name
  const sortedProviders = providers.toSorted((a, b) => {
    const aConnected = connected.has(a.id)
    const bConnected = connected.has(b.id)
    if (aConnected !== bConnected) return aConnected ? 1 : -1
    return a.name.localeCompare(b.name)
  })

  const handleProviderSelect = async (providerId: string) => {
    const methods = authMethods?.[providerId]
    if (!methods?.length) {
      // No auth methods, just show as unavailable
      return
    }

    const hasOAuth = methods.some((m) => m.type === 'oauth')
    const hasApiKey = methods.some((m) => m.type === 'api_key')

    if (hasOAuth) {
      // Initiate OAuth flow
      try {
        const methodIndex = methods.findIndex((m) => m.type === 'oauth')
        const result = await oauthMutation.mutateAsync({
          providerID: providerId,
          method: methodIndex,
        })
        // Open authorization URL in new window
        if (result?.url) {
          isWaitingForOAuth.current = true
          window.open(result.url, '_blank', 'width=600,height=700')
        }
      } catch {
        setError('Failed to initiate OAuth flow')
        isWaitingForOAuth.current = false
      }
    } else if (hasApiKey) {
      // Show API key input
      setSelectedProvider(providerId)
      setView('api-key')
      setApiKey('')
      setError(null)
    }
  }

  const handleApiKeySubmit = async () => {
    if (!selectedProvider || !apiKey.trim()) return

    try {
      await setAuthMutation.mutateAsync({
        providerID: selectedProvider,
        apiKey: apiKey.trim(),
      })
      setView('list')
      setSelectedProvider(null)
      setApiKey('')
      setError(null)
    } catch {
      setError('Failed to connect provider. Please check your API key.')
    }
  }

  const handleBack = () => {
    setView('list')
    setSelectedProvider(null)
    setApiKey('')
    setError(null)
  }

  const selectedProviderData = providers.find((p) => p.id === selectedProvider)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-[425px]">
        <DialogTitle className="sr-only">Connect Provider</DialogTitle>

        {view === 'list' && (
          <Command className="rounded-xl [\u0026_[cmdk-group-heading]]:px-2 [\u0026_[cmdk-group-heading]]:font-medium [\u0026_[cmdk-group-heading]]:text-muted-foreground">
            <CommandInput placeholder="Search providers..." />
            <CommandList>
              <CommandEmpty>No providers found.</CommandEmpty>
              <CommandGroup heading="Available Providers">
                {sortedProviders.map((provider) => {
                  const isConnected = connected.has(provider.id)
                  const methods = authMethods?.[provider.id]
                  const hasAuth = methods && methods.length > 0

                  return (
                    <CommandItem
                      key={provider.id}
                      onSelect={() => !isConnected && hasAuth && handleProviderSelect(provider.id)}
                      className={cn('text-sm', !hasAuth && 'opacity-50')}
                      disabled={!hasAuth}
                    >
                      <ModelSelectorLogo provider={provider.id} className="mr-2" />
                      <span className="flex-1 truncate">{provider.name}</span>
                      {isConnected && <Check className="ml-auto size-4 text-green-500" />}
                      {!isConnected && hasAuth && (
                        <span className="text-xs text-muted-foreground">
                          {methods?.some((m) => m.type === 'oauth') ? 'OAuth' : 'API Key'}
                        </span>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        )}

        {view === 'api-key' && selectedProviderData && (
          <div className="space-y-4 p-4">
            <div className="flex items-center gap-3">
              <ModelSelectorLogo provider={selectedProviderData.id} className="size-5" />
              <div>
                <h3 className="font-medium">{selectedProviderData.name}</h3>
                <p className="text-sm text-muted-foreground">Enter your API key to connect</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Key className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void handleApiKeySubmit()
                    }
                  }}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
              <Button
                onClick={() => void handleApiKeySubmit()}
                disabled={!apiKey.trim() || setAuthMutation.isPending}
              >
                {setAuthMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Connect
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
