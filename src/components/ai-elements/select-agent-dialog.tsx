import { Bot, Check, ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAgentsQuery, type Agent } from '@/lib/opencode/queries'
import { cn } from '@/lib/utils'

interface SelectAgentDialogProps {
  selectedAgent: string
  onSelectAgent: (agent: string) => void
  directory?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactElement
  variant?: 'dialog' | 'popover'
  className?: string
}

export function SelectAgentDialog({
  selectedAgent,
  onSelectAgent,
  directory,
  open,
  onOpenChange,
  children,
  variant = 'popover',
  className,
}: SelectAgentDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const isControlled = open !== undefined
  const show = isControlled ? open : internalOpen
  const setShow = isControlled ? onOpenChange! : setInternalOpen

  const { data: agentsData } = useAgentsQuery(directory)

  // Filter and sort agents:
  // - Hide agents with hidden: true
  // - Show only primary or all mode agents (not subagent only)
  const agents = useMemo(() => {
    if (!agentsData) return []

    return agentsData
      .filter((agent: Agent) => {
        // Hide hidden agents
        if (agent.hidden) return false
        // Only show primary or all mode agents
        if (agent.mode === 'subagent') return false
        return true
      })
      .toSorted((a: Agent, b: Agent) => {
        // Native agents first
        if (a.native !== b.native) return a.native ? -1 : 1
        // Then alphabetically
        return a.name.localeCompare(b.name)
      })
  }, [agentsData])

  const handleSelect = (agentName: string) => {
    onSelectAgent(agentName)
    setShow(false)
  }

  const selectedAgentData = agents.find((a: Agent) => a.name === selectedAgent)

  const content = (
    <Command className="rounded-xl [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
      <CommandInput placeholder="Search agents..." />
      <CommandList>
        <CommandEmpty>No agents found.</CommandEmpty>
        <CommandGroup heading="Available Agents">
          {agents.map((agent: Agent) => (
            <CommandItem
              key={agent.name}
              onSelect={() => handleSelect(agent.name)}
              className="text-sm"
            >
              <Bot className="mr-2 size-4" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="capitalize font-medium">{agent.name}</span>
                  {!agent.native && (
                    <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded">
                      Custom
                    </span>
                  )}
                </div>
                {agent.description && (
                  <p className="text-xs text-muted-foreground truncate">{agent.description}</p>
                )}
              </div>
              {selectedAgent === agent.name && <Check className="ml-auto size-4" />}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )

  const trigger = children || (
    <Button variant="outline" size="sm" className={cn('gap-1.5 text-xs h-7', className)}>
      <Bot className="size-3" />
      <span className="capitalize">{selectedAgentData?.name ?? selectedAgent}</span>
      <ChevronDown className="size-3" />
    </Button>
  )

  if (variant === 'popover') {
    return (
      <Popover open={show} onOpenChange={setShow}>
        <PopoverTrigger render={trigger} />
        <PopoverContent className="w-[280px] p-0" align="start">
          {content}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogTrigger render={trigger} />
      <DialogContent className="p-0 gap-0 sm:max-w-[350px]" showCloseButton={false}>
        <DialogTitle className="sr-only">Select Agent</DialogTitle>
        {content}
      </DialogContent>
    </Dialog>
  )
}
