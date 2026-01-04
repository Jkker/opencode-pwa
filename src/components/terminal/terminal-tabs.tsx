// Terminal tabs component for multi-tab terminal management.
// Provides tab bar with add/close/switch functionality.
import { Plus, X } from 'lucide-react'

import type { LocalPTY } from '@/stores/terminal-store'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface TerminalTabsProps {
  tabs: LocalPTY[]
  activeId: string | null
  onSelect: (id: string) => void
  onClose: (id: string) => void
  onAdd: () => void
  className?: string
}

export function TerminalTabs({
  tabs,
  activeId,
  onSelect,
  onClose,
  onAdd,
  className,
}: TerminalTabsProps) {
  return (
    <div className={cn('flex items-center gap-1 border-b bg-muted/30 px-2 py-1', className)}>
      <div className="flex flex-1 items-center gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <TerminalTab
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeId}
            onSelect={() => onSelect(tab.id)}
            onClose={() => onClose(tab.id)}
          />
        ))}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        onClick={onAdd}
        aria-label="New terminal"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  )
}

interface TerminalTabProps {
  tab: LocalPTY
  isActive: boolean
  onSelect: () => void
  onClose: () => void
}

function TerminalTab({ tab, isActive, onSelect, onClose }: TerminalTabProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        'group flex min-w-[120px] max-w-[200px] cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
        isActive
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <span className="flex-1 truncate">{tab.title}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className={cn(
          'rounded p-0.5 opacity-0 transition-opacity hover:bg-muted-foreground/20 group-hover:opacity-100',
          isActive && 'opacity-100',
        )}
        aria-label={`Close ${tab.title}`}
      >
        <X className="size-3" />
      </button>
    </div>
  )
}
