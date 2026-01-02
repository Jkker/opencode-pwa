'use client'

import { useParams } from '@tanstack/react-router'
import { FileCode, Terminal, ListTodo, BarChart3 } from 'lucide-react'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useDiffQuery, useSessionQuery, useMessagesQuery } from '@/lib/opencode/queries'
import { cn } from '@/lib/utils'

export function RightPanel() {
  const { sessionId } = useParams({ strict: false })

  return (
    <Tabs defaultValue="status" className="flex h-full flex-col">
      <TabsList variant="line" className="shrink-0 border-b px-2">
        <TabsTrigger value="status" className="gap-1.5">
          <ListTodo className="size-3.5" />
          Status
        </TabsTrigger>
        <TabsTrigger value="changes" className="gap-1.5">
          <FileCode className="size-3.5" />
          Changes
        </TabsTrigger>
        <TabsTrigger value="terminal" className="gap-1.5">
          <Terminal className="size-3.5" />
          Terminal
        </TabsTrigger>
      </TabsList>

      <TabsContent value="status" className="flex-1 overflow-hidden">
        <StatusTab sessionId={sessionId} />
      </TabsContent>

      <TabsContent value="changes" className="flex-1 overflow-hidden">
        <ChangesTab sessionId={sessionId} />
      </TabsContent>

      <TabsContent value="terminal" className="flex-1 overflow-hidden">
        <TerminalTab />
      </TabsContent>
    </Tabs>
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
    <ScrollArea className="h-full">
      <div className="space-y-4 p-3">
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
                <dd className="truncate max-w-32">{session.title || 'Untitled'}</dd>
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
    </ScrollArea>
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
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Select a session to view changes
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-2 p-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  if (!diffs || diffs.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <FileCode className="size-8" />
        <p className="text-sm">No changes in this session</p>
      </div>
    )
  }

  const activeDiff = diffs.find((d) => d.file === selectedFile) ?? diffs[0]

  return (
    <div className="flex h-full flex-col">
      {/* File list */}
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b p-2">
        {diffs.map((diff) => {
          const fileName = diff.file.split('/').at(-1) ?? diff.file
          const isActive = diff.file === (selectedFile ?? diffs[0].file)

          return (
            <button
              key={diff.file}
              onClick={() => setSelectedFile(diff.file)}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs',
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
              )}
            >
              <FileCode className="size-3" />
              <span>{fileName}</span>
              <span className="text-green-500">+{diff.additions}</span>
              <span className="text-red-500">-{diff.deletions}</span>
            </button>
          )
        })}
      </div>

      {/* Diff view */}
      <ScrollArea className="flex-1">
        <div className="font-mono text-xs">
          {activeDiff && <UnifiedDiffView diff={activeDiff} />}
        </div>
      </ScrollArea>
    </div>
  )
}

interface UnifiedDiffViewProps {
  diff: { file: string; before: string; after: string; additions: number; deletions: number }
}

function UnifiedDiffView({ diff }: UnifiedDiffViewProps) {
  const beforeLines = diff.before.split('\n')
  const afterLines = diff.after.split('\n')

  return (
    <div>
      {afterLines.map((line, i) => {
        const beforeLine = beforeLines[i]
        const isAdded = beforeLine === undefined || beforeLine !== line
        const isRemoved = beforeLine !== undefined && beforeLine !== line

        return (
          <div key={i}>
            {isRemoved && beforeLine && (
              <div className="flex bg-red-500/10">
                <span className="w-10 shrink-0 border-r bg-red-500/20 px-2 py-0.5 text-right text-red-600">
                  -
                </span>
                <pre className="flex-1 px-2 py-0.5 text-red-600">{beforeLine}</pre>
              </div>
            )}
            <div className={cn('flex', isAdded && 'bg-green-500/10')}>
              <span
                className={cn(
                  'w-10 shrink-0 border-r px-2 py-0.5 text-right',
                  isAdded ? 'bg-green-500/20 text-green-600' : 'bg-muted text-muted-foreground',
                )}
              >
                {isAdded ? '+' : i + 1}
              </span>
              <pre className={cn('flex-1 px-2 py-0.5', isAdded && 'text-green-600')}>{line}</pre>
            </div>
          </div>
        )
      })}
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
    <div className="flex h-full flex-col bg-black text-green-400">
      <ScrollArea className="flex-1 p-2">
        <pre className="whitespace-pre-wrap font-mono text-xs">{output.join('\n')}</pre>
        <div className="flex items-center gap-1 font-mono text-xs">
          <span className="text-cyan-400">$</span>
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none"
            placeholder="Type a command..."
          />
        </div>
      </ScrollArea>
    </div>
  )
}
