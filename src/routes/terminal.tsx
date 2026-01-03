// Terminal test route for E2E testing.
// Provides a standalone terminal experience.
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, RefreshCw, Server } from 'lucide-react'
import { useEffect } from 'react'

import { TerminalPanel } from '@/components/terminal'
import { Button } from '@/components/ui/button'
import { useCreatePtyMutation, useRemovePtyMutation, useHealthQuery } from '@/lib/opencode/queries'
import { cn } from '@/lib/utils'
import { settingStore } from '@/stores/setting-store'
import { terminalStore, type LocalPTY } from '@/stores/terminal-store'

export const Route = createFileRoute('/terminal')({
  component: TerminalPage,
})

function TerminalPage() {
  const serverURL = settingStore.useValue('serverURL')
  const directory = '/' // Default directory for testing
  const tabs = terminalStore.useValue('all')
  const activeId = terminalStore.useValue('active')
  const { data: health, isLoading: healthLoading, refetch } = useHealthQuery()

  const createPty = useCreatePtyMutation(directory)
  const removePty = useRemovePtyMutation(directory)

  const handleAddTerminal = async () => {
    try {
      const pty = await createPty.mutateAsync({
        title: `Terminal ${tabs.length + 1}`,
      })
      if (pty) {
        terminalStore.actions.addTerminal({ id: pty.id, title: pty.title })
      }
    } catch (error) {
      console.error('Failed to create terminal:', error)
    }
  }

  const handleCloseTerminal = async (id: string) => {
    try {
      await removePty.mutateAsync(id)
      terminalStore.actions.removeTerminal(id)
    } catch (error) {
      console.error('Failed to close terminal:', error)
    }
  }

  const handleSelectTerminal = (id: string) => {
    terminalStore.actions.setActive(id)
  }

  const handleUpdateTerminal = (pty: LocalPTY) => {
    terminalStore.actions.updateTerminal(pty)
  }

  // Create initial terminal on mount if none exist
  useEffect(() => {
    if (tabs.length === 0 && health) {
      void handleAddTerminal()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run on health status change
  }, [health])

  return (
    <div className="flex h-dvh flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">Terminal</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <div
              className={cn(
                'size-2 rounded-full',
                healthLoading && 'bg-muted-foreground',
                health && 'bg-green-500',
                !healthLoading && !health && 'bg-destructive',
              )}
            />
            <Server className="size-4" />
            <span className="text-sm">
              {healthLoading ? 'Connecting...' : health ? 'Connected' : 'Disconnected'}
            </span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => void refetch()}>
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </header>

      {/* Server URL info */}
      <div className="border-b bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        Server: {serverURL}
      </div>

      {/* Terminal panel */}
      {!health && !healthLoading && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
          <div className="rounded-lg border bg-card p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold">Server Disconnected</h2>
            <p className="mb-4 text-muted-foreground">
              Please start the OpenCode server to use the terminal.
            </p>
            <code className="block rounded bg-muted px-4 py-2 text-sm">
              opencode serve --cors localhost:5173
            </code>
            <Button className="mt-4" onClick={() => void refetch()}>
              <RefreshCw className="mr-2 size-4" />
              Retry Connection
            </Button>
          </div>
        </div>
      )}

      {health && (
        <TerminalPanel
          tabs={tabs}
          activeId={activeId}
          directory={directory}
          onSelect={handleSelectTerminal}
          onClose={handleCloseTerminal}
          onAdd={handleAddTerminal}
          onUpdateTerminal={handleUpdateTerminal}
          className="flex-1"
        />
      )}
    </div>
  )
}
