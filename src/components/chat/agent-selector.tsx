import { useState } from 'react'
import { Bot, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSession } from '@/lib/opencode'
import type { Agent } from '@/lib/opencode'

interface AgentSelectorProps {
  value?: string
  onChange: (agent: string) => void
  className?: string
}

/**
 * Agent selector dropdown.
 * Allows selecting the AI agent to use for prompts.
 */
export function AgentSelector({ value, onChange, className }: AgentSelectorProps) {
  const { agents } = useSession()
  const [open, setOpen] = useState(false)

  // Find current agent or default
  const currentAgent =
    agents.find((a) => a.name === value) ??
    agents.find((a) => a.default) ??
    agents[0]

  const availableAgents = agents.filter((a) => !a.hidden)

  if (availableAgents.length === 0) {
    return null
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={cn(
          'flex items-center gap-1 h-8 px-2 rounded-md text-sm',
          'hover:bg-muted transition-colors',
          className
        )}
      >
        <Bot className="h-4 w-4" />
        <span className="capitalize">{currentAgent?.name ?? 'Agent'}</span>
        <ChevronDown className="h-3 w-3 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {availableAgents.map((agent) => (
          <AgentItem
            key={agent.name}
            agent={agent}
            isSelected={agent.name === currentAgent?.name}
            onClick={() => {
              onChange(agent.name)
              setOpen(false)
            }}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface AgentItemProps {
  agent: Agent
  isSelected: boolean
  onClick: () => void
}

function AgentItem({ agent, isSelected, onClick }: AgentItemProps) {
  return (
    <DropdownMenuItem
      onClick={onClick}
      className={cn('flex items-center gap-2', isSelected && 'bg-muted')}
    >
      <Bot className="h-4 w-4" />
      <div className="flex flex-col">
        <span className="capitalize font-medium">{agent.name}</span>
        {agent.description && (
          <span className="text-xs text-muted-foreground line-clamp-1">
            {agent.description}
          </span>
        )}
      </div>
      {agent.default && (
        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-auto">
          Default
        </span>
      )}
    </DropdownMenuItem>
  )
}
