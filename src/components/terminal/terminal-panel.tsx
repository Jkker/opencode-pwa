// Terminal panel component combining tabs and terminal instances.
// Provides a complete terminal experience with multi-tab support.
import type { LocalPTY } from '@/stores/terminal-store'

import { cn } from '@/lib/utils'

import { Terminal } from './terminal'
import { TerminalTabs } from './terminal-tabs'

export interface TerminalPanelProps {
  tabs: LocalPTY[]
  activeId: string | null
  directory: string
  onSelect: (id: string) => void
  onClose: (id: string) => void
  onAdd: () => void
  onUpdateTerminal: (pty: LocalPTY) => void
  className?: string
}

export function TerminalPanel({
  tabs,
  activeId,
  directory,
  onSelect,
  onClose,
  onAdd,
  onUpdateTerminal,
  className,
}: TerminalPanelProps) {
  const activeTab = tabs.find((tab) => tab.id === activeId)

  return (
    <div className={cn('flex flex-col', className)}>
      <TerminalTabs
        tabs={tabs}
        activeId={activeId}
        onSelect={onSelect}
        onClose={onClose}
        onAdd={onAdd}
      />
      <div className="relative flex-1">
        {tabs.map((tab) => (
          <div key={tab.id} className={cn('absolute inset-0', tab.id !== activeId && 'invisible')}>
            <Terminal pty={tab} directory={directory} onCleanup={onUpdateTerminal} />
          </div>
        ))}
        {!activeTab && tabs.length === 0 && (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>No terminals open. Click + to create one.</p>
          </div>
        )}
      </div>
    </div>
  )
}
