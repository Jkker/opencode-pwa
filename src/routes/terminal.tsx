import { createFileRoute } from '@tanstack/react-router'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'

import { Terminal } from '@/components/terminal'
import { Button } from '@/components/ui/button'
import { useClient } from '@/lib/opencode/client'
import { cn } from '@/lib/utils'
import { terminalStore, type LocalPTY } from '@/stores/terminal-store'

export const Route = createFileRoute('/terminal')({
  component: TerminalPage,
})

function TerminalPage() {
  const client = useClient()
  const terminals = terminalStore.useValue('terminals')
  const activeTerminalId = terminalStore.useValue('activeTerminalId')
  const addTerminal = terminalStore.actions.addTerminal
  const updateTerminal = terminalStore.actions.updateTerminal
  const removeTerminal = terminalStore.actions.removeTerminal
  const setActiveTerminal = terminalStore.actions.setActiveTerminal

  const [isCreating, setIsCreating] = useState(false)

  const handleCreateTerminal = async () => {
    setIsCreating(true)
    try {
      const response = await client.pty.create({
        title: `Terminal ${terminals.length + 1}`,
      })

      const ptyId = response.data?.id
      if (ptyId) {
        const newTerminal: LocalPTY = {
          id: ptyId,
          title: response.data?.title ?? `Terminal ${terminals.length + 1}`,
        }
        addTerminal(newTerminal)
        setActiveTerminal(ptyId)
      }
    } catch (error) {
      console.error('[Terminal] Failed to create:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCloseTerminal = async (id: string) => {
    try {
      await client.pty.remove({ ptyID: id })
      removeTerminal(id)
    } catch (error) {
      console.error('[Terminal] Failed to close:', error)
    }
  }

  const handleTerminalCleanup = (pty: LocalPTY) => {
    updateTerminal(pty)
  }

  const activeTerminal = terminals.find((t: LocalPTY) => t.id === activeTerminalId)

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b bg-card px-4 py-2">
        <h1 className="text-lg font-semibold">Terminal</h1>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCreateTerminal}
          disabled={isCreating}
          className="ml-auto"
        >
          <Plus className="size-4" />
          New Terminal
        </Button>
      </div>

      {/* Terminal Tabs */}
      {terminals.length > 0 && (
        <div className="flex items-center gap-1 border-b bg-muted/30 px-2">
          {terminals.map((terminal: LocalPTY) => (
            <button
              key={terminal.id}
              onClick={() => setActiveTerminal(terminal.id)}
              className={cn(
                'group relative flex items-center gap-2 px-3 py-1.5 text-sm transition-colors',
                'hover:bg-accent',
                terminal.id === activeTerminalId && 'bg-card',
              )}
            >
              <span className="max-w-[150px] truncate">{terminal.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  void handleCloseTerminal(terminal.id)
                }}
                className="opacity-0 hover:text-destructive group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </button>
          ))}
        </div>
      )}

      {/* Terminal Content */}
      <div className="relative flex-1 overflow-hidden">
        {terminals.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="mb-4">No terminals open</p>
              <Button onClick={handleCreateTerminal} disabled={isCreating}>
                <Plus className="mr-2 size-4" />
                Create Terminal
              </Button>
            </div>
          </div>
        ) : activeTerminal ? (
          <Terminal
            key={activeTerminal.id}
            pty={activeTerminal}
            onCleanup={handleTerminalCleanup}
            onConnectError={(error) => {
              console.error('[Terminal] Connection error:', error)
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Select a terminal from the tabs above
          </div>
        )}
      </div>
    </div>
  )
}
