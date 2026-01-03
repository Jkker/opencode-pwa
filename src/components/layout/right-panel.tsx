// oxlint-disable only-export-components
'use client'

import { useParams } from '@tanstack/react-router'
import { FileCode, Terminal, ListTodo, BarChart3, PlusIcon, MinusIcon } from 'lucide-react'
import { useState } from 'react'

import {
  Context,
  ContextTrigger,
  ContextContent,
  ContextContentHeader,
  ContextContentBody,
  ContextContentFooter,
  ContextInputUsage,
  ContextOutputUsage,
  ContextReasoningUsage,
  ContextCacheUsage,
} from '@/components/ai-elements/context'
import {
  Queue,
  QueueSection,
  QueueSectionTrigger,
  QueueSectionLabel,
  QueueSectionContent,
  QueueList,
  QueueItem,
  QueueItemIndicator,
  QueueItemContent,
} from '@/components/ai-elements/queue'
import { Diff } from '@/components/pierre'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { SwipeableTabPanel } from '@/components/ui/swipeable-tab-panel'
import { useDiffQuery, useSessionQuery, useMessagesQuery } from '@/lib/opencode/queries'
import { cn } from '@/lib/utils'

import { Button } from '../ui/button'

/** Right panel tab IDs */
export const RIGHT_PANEL_TABS = ['status', 'changes', 'terminal'] as const
export type RightPanelTab = (typeof RIGHT_PANEL_TABS)[number]

export interface RightPanelProps {
  /** Currently active tab */
  activeTab?: RightPanelTab
  /** Callback when tab changes */
  onTabChange?: (tab: RightPanelTab) => void
  /** Whether the panel is open (for swipe integration) */
  isOpen?: boolean
  /** Callback to close the panel */
  onClose?: () => void
  /** Callback to open the panel */
  onOpen?: () => void
  /** Whether swipe navigation is enabled */
  swipeEnabled?: boolean
}

export function RightPanel({
  activeTab: controlledActiveTab,
  onTabChange,
  isOpen = true,
  onClose,
  onOpen,
  swipeEnabled = false,
}: RightPanelProps) {
  const { sessionId } = useParams({ strict: false })
  const [internalTab, setInternalTab] = useState<RightPanelTab>('status')

  const activeTab = controlledActiveTab ?? internalTab
  const handleTabChange = (tab: RightPanelTab) => {
    onTabChange?.(tab)
    if (!controlledActiveTab) setInternalTab(tab)
  }

  const tabs = [
    {
      id: 'status' as const,
      label: 'Status',
      icon: <ListTodo className="size-3.5" />,
      content: <StatusTab sessionId={sessionId} />,
    },
    {
      id: 'changes' as const,
      label: 'Changes',
      icon: <FileCode className="size-3.5" />,
      content: <ChangesTab sessionId={sessionId} />,
    },
    {
      id: 'terminal' as const,
      label: 'Terminal',
      icon: <Terminal className="size-3.5" />,
      content: <TerminalTab />,
    },
  ]

  return (
    <SwipeableTabPanel
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      isOpen={isOpen}
      onClose={onClose}
      onOpen={onOpen}
      swipeEnabled={swipeEnabled}
    />
  )
}

interface StatusTabProps {
  sessionId?: string
}

function StatusTab({ sessionId }: StatusTabProps) {
  const { data: session } = useSessionQuery(sessionId)
  const { data: messagesData } = useMessagesQuery(sessionId)

  // Compute todos from messages (tool calls that are pending/completed)
  const toolParts =
    messagesData?.flatMap((m) => m.parts?.filter((p) => p.type === 'tool') ?? []) ?? []
  const pendingTools = toolParts.filter((t) => t.state?.status === 'running')
  const completedTools = toolParts.filter((t) => t.state?.status === 'completed')

  // Estimate token usage (placeholder - would need actual usage data from SDK)
  const usedTokens = messagesData?.length ? messagesData.length * 1000 : 0
  const maxTokens = 200000 // Claude's context window

  return (
    <div className="w-full space-y-4 p-3">
      {/* Todos Section */}
      <Queue>
        <QueueSection defaultOpen>
          <QueueSectionTrigger>
            <QueueSectionLabel
              icon={<ListTodo className="size-4" />}
              label="Tasks"
              count={pendingTools.length + completedTools.length}
            />
          </QueueSectionTrigger>
          <QueueSectionContent>
            <QueueList>
              {pendingTools.length === 0 && completedTools.length === 0 ? (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  No active tasks
                </div>
              ) : (
                <>
                  {pendingTools.map((tool) => (
                    <QueueItem key={tool.id}>
                      <div className="flex items-center gap-2">
                        <QueueItemIndicator />
                        <QueueItemContent>{tool.tool}</QueueItemContent>
                      </div>
                    </QueueItem>
                  ))}
                  {completedTools.slice(-5).map((tool) => (
                    <QueueItem key={tool.id}>
                      <div className="flex items-center gap-2">
                        <QueueItemIndicator completed />
                        <QueueItemContent completed>{tool.tool}</QueueItemContent>
                      </div>
                    </QueueItem>
                  ))}
                </>
              )}
            </QueueList>
          </QueueSectionContent>
        </QueueSection>
      </Queue>

      {/* Stats Section */}
      <div className="rounded-lg border bg-card p-3">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Context Usage</span>
        </div>
        <Context usedTokens={usedTokens} maxTokens={maxTokens}>
          <ContextTrigger className="w-full justify-between" />
          <ContextContent>
            <ContextContentHeader />
            <ContextContentBody>
              <div className="space-y-2">
                <ContextInputUsage />
                <ContextOutputUsage />
                <ContextReasoningUsage />
                <ContextCacheUsage />
              </div>
            </ContextContentBody>
            <ContextContentFooter />
          </ContextContent>
        </Context>
      </div>

      {/* Session Info */}
      {session && (
        <div className="rounded-lg border bg-card p-3">
          <h4 className="mb-2 text-sm font-medium">Session</h4>
          <dl className="space-y-1 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Title</dt>
              <dd className="max-w-32 truncate">{session.title || 'Untitled'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Messages</dt>
              <dd>{messagesData?.length ?? 0}</dd>
            </div>
            {session.summary && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Files changed</dt>
                <dd>{session.summary.files}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </div>
  )
}

interface ChangesTabProps {
  sessionId?: string
}

function ChangesTab({ sessionId }: ChangesTabProps) {
  const { data: diffs, isLoading } = useDiffQuery(sessionId)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  if (!sessionId) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        Select a session to view changes
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-2 p-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  if (!diffs || diffs.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <FileCode className="size-8" />
        <p className="text-sm">No changes in this session</p>
      </div>
    )
  }

  const activeDiff = diffs.find((d) => d.file === selectedFile) ?? diffs[0]

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* File list - horizontally scrollable */}
      <ScrollArea className="w-full shrink-0 border-b">
        <div className="flex gap-1 p-2">
          {diffs.map((diff) => {
            const fileName = diff.file.split('/').at(-1) ?? diff.file
            const isActive = diff.file === (selectedFile ?? diffs[0].file)

            return (
              <Button
                key={diff.file}
                onClick={() => setSelectedFile(diff.file)}
                variant={isActive ? 'default' : 'secondary'}
                size="xs"
                className={'font-mono'}
              >
                <FileCode className="size-3" />
                <span>{fileName}</span>
                <span
                  className={cn(
                    'items-center flex',
                    isActive ? 'text-green-300 dark:text-green-700' : 'text-green-500',
                  )}
                >
                  <PlusIcon />
                  {diff.additions}
                </span>
                <span
                  className={cn(
                    'items-center flex',
                    isActive ? 'text-red-300 dark:text-red-700' : 'text-red-500',
                  )}
                >
                  <MinusIcon />
                  {diff.deletions}
                </span>
              </Button>
            )
          })}
        </div>
      </ScrollArea>

      {/* Diff view - vertically scrollable with horizontal overflow */}
      <ScrollArea className="min-h-0 w-full flex-1">
        <div className="min-w-full">
          {activeDiff && (
            <Diff
              before={{
                name: activeDiff.file,
                contents: activeDiff.before,
              }}
              after={{
                name: activeDiff.file,
                contents: activeDiff.after,
              }}
              diffStyle="unified"
              className="font-mono text-xs"
            />
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function TerminalTab() {
  const [inputValue, setInputValue] = useState('')
  const [output, setOutput] = useState<string[]>([
    '$ Welcome to OpenCode Terminal',
    'Type commands to interact with the server.',
    '',
  ])

  const handleCommand = (command: string) => {
    if (!command.trim()) return
    setOutput((prev) => [...prev, `$ ${command}`, '(Terminal integration coming soon)', ''])
    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(inputValue)
    }
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-black text-green-400">
      <ScrollArea className="min-h-0 w-full flex-1 p-2">
        <pre className="w-full whitespace-pre-wrap font-mono text-xs">{output.join('\n')}</pre>
        <div className="flex w-full items-center gap-1 font-mono text-xs">
          <span className="text-cyan-400">$</span>
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-w-0 flex-1 bg-transparent outline-none"
            placeholder="Type a command..."
          />
        </div>
      </ScrollArea>
    </div>
  )
}
