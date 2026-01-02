// Session detail route.
// Shows the chat interface for a specific session.
// Mobile-optimized with touch-friendly controls.
import { createFileRoute } from '@tanstack/react-router'
import {
  Send,
  Square,
  Loader2,
  FileCode,
  User,
  Bot,
  MoreVertical,
  Copy,
  Check,
  ChevronDown,
  Sparkles,
  Terminal,
  History,
  ChevronUp,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

import type { Message, Part, TextPart, ToolPart } from '@/lib/opencode'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  useSessionQuery,
  useMessagesQuery,
  useDiffQuery,
  useSendPromptMutation,
  useAbortSessionMutation,
  useProvidersQuery,
  useAgentsQuery,
} from '@/lib/opencode/queries'
import { cn } from '@/lib/utils'
import { settingStore } from '@/stores/setting-store'

// Maximum characters to display in tool output preview
const TOOL_OUTPUT_MAX_LENGTH = 500

export const Route = createFileRoute('/project/$projectId/$sessionId')({
  component: SessionPage,
})

function SessionPage() {
  const { projectId, sessionId } = Route.useParams()
  const directory = decodeURIComponent(projectId)

  const { data: session, isLoading: sessionLoading } = useSessionQuery(sessionId)
  const { data: messagesData, isLoading: messagesLoading } = useMessagesQuery(sessionId)
  const { data: diffs } = useDiffQuery(sessionId)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messagesData])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [sessionId])

  const messages = messagesData?.map((m) => m.info).filter(Boolean) ?? []
  const parts =
    messagesData?.reduce<Record<string, Part[]>>((acc, m) => {
      if (m.info?.id) {
        acc[m.info.id] = m.parts ?? []
      }
      return acc
    }, {}) ?? {}

  const isLoading = sessionLoading || messagesLoading
  const hasChanges = diffs && diffs.length > 0

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1 xl:hidden" />
        <Separator orientation="vertical" className="mx-2 h-4 xl:hidden" />
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <h1 className="truncate text-sm font-medium">
            {sessionLoading ? <Skeleton className="h-4 w-32" /> : (session?.title ?? 'New Session')}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          {hasChanges && (
            <Button variant="ghost" size="sm" className="gap-1.5">
              <FileCode className="size-3.5" />
              <span className="text-xs">{diffs.length} files</span>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreVertical className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Share session</DropdownMenuItem>
              <DropdownMenuItem>Export</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-3xl">
          {isLoading ? (
            <div className="space-y-6 p-4">
              <MessageSkeleton />
              <MessageSkeleton isAssistant />
            </div>
          ) : messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-1 py-4">
              {messages.map((message) => (
                <MessageItem key={message.id} message={message} parts={parts[message.id] ?? []} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <PromptInput ref={inputRef} sessionId={sessionId} directory={directory} />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="space-y-2">
        <h2 className="text-lg font-medium">New Session</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Ask anything about your codebase. I can help you understand, modify, and debug your code.
        </p>
      </div>
    </div>
  )
}

function MessageSkeleton({ isAssistant = false }: { isAssistant?: boolean }) {
  return (
    <div className={cn('flex gap-3 p-4', isAssistant && 'bg-muted/50')}>
      <Skeleton className="size-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

interface MessageItemProps {
  message: Message
  parts: Part[]
}

function MessageItem({ message, parts }: MessageItemProps) {
  const isUser = message.role === 'user'
  const textParts = parts.filter((p): p is TextPart => p.type === 'text')
  const toolParts = parts.filter((p): p is ToolPart => p.type === 'tool')

  const text = textParts.map((p) => p.text).join('')

  return (
    <div className={cn('group relative flex gap-3 px-4 py-4', !isUser && 'bg-muted/30')}>
      <Avatar className="size-7 shrink-0">
        <AvatarFallback
          className={cn('text-xs', isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary')}
        >
          {isUser ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{isUser ? 'You' : 'Assistant'}</span>
          <span className="text-xs text-muted-foreground">{formatTime(message.time.created)}</span>
        </div>

        {/* Text content */}
        {text && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <MarkdownContent content={text} />
          </div>
        )}

        {/* Tool calls */}
        {toolParts.length > 0 && (
          <div className="space-y-2">
            {toolParts.map((tool) => (
              <ToolCallItem key={tool.id} tool={tool} />
            ))}
          </div>
        )}

        {/* Action bar - always visible on mobile, hover on desktop */}
        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <CopyButton text={text} />
        </div>
      </div>
    </div>
  )
}

function MarkdownContent({ content }: { content: string }) {
  // Simple markdown rendering - in production, use marked + shiki
  const lines = content.split('\n')

  return (
    <div className="whitespace-pre-wrap break-words">
      {lines.map((line, i) => {
        // Code blocks
        if (line.startsWith('```')) {
          return null // Would need proper code block handling
        }
        // Headers
        if (line.startsWith('# ')) {
          return (
            <h1 key={i} className="text-lg font-bold mt-4 mb-2">
              {line.slice(2)}
            </h1>
          )
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} className="text-base font-bold mt-3 mb-1">
              {line.slice(3)}
            </h2>
          )
        }
        if (line.startsWith('### ')) {
          return (
            <h3 key={i} className="text-sm font-bold mt-2 mb-1">
              {line.slice(4)}
            </h3>
          )
        }
        // Lists
        if (line.match(/^[-*]\s/)) {
          return (
            <li key={i} className="ml-4">
              {line.slice(2)}
            </li>
          )
        }
        if (line.match(/^\d+\.\s/)) {
          return (
            <li key={i} className="ml-4 list-decimal">
              {line.replace(/^\d+\.\s/, '')}
            </li>
          )
        }
        // Regular text
        return (
          <span key={i}>
            {line}
            {i < lines.length - 1 ? '\n' : ''}
          </span>
        )
      })}
    </div>
  )
}

function ToolCallItem({ tool }: { tool: ToolPart }) {
  const state = tool.state
  const isRunning = state.status === 'running'
  const isCompleted = state.status === 'completed'
  const isError = state.status === 'error'

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <FileCode className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">{tool.tool}</span>
        {isRunning && <Loader2 className="size-3 animate-spin text-primary ml-auto" />}
        {isCompleted && <Check className="size-3 text-green-500 ml-auto" />}
        {isError && <span className="text-xs text-destructive ml-auto">Error</span>}
      </div>
      {isCompleted && 'output' in state && state.output && (
        <pre className="p-3 text-xs overflow-x-auto max-h-32 overflow-y-auto bg-muted/50">
          {state.output.slice(0, TOOL_OUTPUT_MAX_LENGTH)}
          {state.output.length > TOOL_OUTPUT_MAX_LENGTH && '...'}
        </pre>
      )}
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon" className="size-6" onClick={handleCopy}>
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          </Button>
        }
      />
      <TooltipContent>{copied ? 'Copied!' : 'Copy'}</TooltipContent>
    </Tooltip>
  )
}

// Provider info for display
interface ProviderInfo {
  id: string
  name: string
  models: {
    id: string
    name: string
  }[]
}

const PromptInput = ({
  sessionId,
  directory,
  ref,
  ...props
}: React.ComponentPropsWithRef<'textarea'> & {
  sessionId: string
  directory: string
}) => {
  const [value, setValue] = useState('')
  const [promptHistory, setPromptHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showOptions, setShowOptions] = useState(false)

  const sendPrompt = useSendPromptMutation()
  const abortSession = useAbortSessionMutation()
  const { data: providersData } = useProvidersQuery()
  const { data: agentsData } = useAgentsQuery(directory)
  const autoAcceptEdits = settingStore.useState('autoAcceptEdits')
  const isMobile = useIsMobile()

  // Parse providers from API response
  const providers: ProviderInfo[] =
    providersData && 'all' in providersData
      ? providersData.all.map((p) => ({
          id: p.id,
          name: p.name,
          models: Object.values(p.models).map((m) => ({ id: m.id, name: m.name })),
        }))
      : []

  // Parse agents from API response (agents are keyed by name)
  const agents = agentsData
    ? Object.entries(agentsData).map(([name, agent]) => ({
        name,
        description: agent.description,
      }))
    : [
        { name: 'code', description: 'Code assistant' },
        { name: 'chat', description: 'General chat' },
      ]

  // Model/agent selection state
  const [selectedModel, setSelectedModel] = useState({
    providerID: 'anthropic',
    modelID: 'claude-sonnet-4-20250514',
  })
  const [selectedAgent, setSelectedAgent] = useState('code')

  const isWorking = sendPrompt.isPending
  const canSend = value.trim().length > 0 && !isWorking

  // Check for shell command prefix
  const isShellCommand = value.trim().startsWith('!')

  const handleSubmit = async () => {
    if (!canSend) return

    const text = value.trim()

    // Handle shell command prefix
    const actualText = isShellCommand ? text.slice(1).trim() : text

    // Add to history
    setPromptHistory((prev) => [...prev.slice(-49), text])
    setHistoryIndex(-1)
    setValue('')

    await sendPrompt.mutateAsync({
      sessionId,
      messageId: `msg_${Date.now()}`,
      text: isShellCommand ? `Run this shell command: ${actualText}` : actualText,
      agent: selectedAgent,
      model: selectedModel,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSubmit()
      return
    }

    // Abort on Escape
    if (e.key === 'Escape' && isWorking) {
      abortSession.mutate(sessionId)
      return
    }

    // History navigation with arrow keys (when input is empty or at start)
    if (e.key === 'ArrowUp' && promptHistory.length > 0) {
      const cursorAtStart =
        e.currentTarget.selectionStart === 0 && e.currentTarget.selectionEnd === 0
      if (value === '' || cursorAtStart) {
        e.preventDefault()
        const newIndex =
          historyIndex === -1 ? promptHistory.length - 1 : Math.max(0, historyIndex - 1)
        setHistoryIndex(newIndex)
        setValue(promptHistory[newIndex])
      }
    }

    if (e.key === 'ArrowDown' && historyIndex !== -1) {
      e.preventDefault()
      const newIndex = historyIndex + 1
      if (newIndex >= promptHistory.length) {
        setHistoryIndex(-1)
        setValue('')
      } else {
        setHistoryIndex(newIndex)
        setValue(promptHistory[newIndex])
      }
    }
  }

  // Get display name for current model
  const currentProvider = providers.find((p) => p.id === selectedModel.providerID)
  const currentModel = currentProvider?.models?.find((m) => m.id === selectedModel.modelID)
  const modelDisplayName =
    currentModel?.name ?? selectedModel.modelID.split('-').slice(0, 2).join(' ')

  return (
    <div className="border-t bg-background p-3 md:p-4">
      <div className="mx-auto max-w-3xl">
        {/* Options bar - collapsible on mobile */}
        <div
          className={cn(
            'mb-2 flex flex-wrap items-center gap-2 transition-all',
            isMobile && !showOptions && 'hidden',
          )}
        >
          {/* Model selector */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
                  <Sparkles className="size-3" />
                  <span className="max-w-24 truncate">{modelDisplayName}</span>
                  <ChevronDown className="size-3" />
                </Button>
              }
            />
            <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
              {providers.map((provider) => (
                <div key={provider.id}>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    {provider.name}
                  </div>
                  {provider.models.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onClick={() =>
                        setSelectedModel({ providerID: provider.id, modelID: model.id })
                      }
                      className={cn(
                        selectedModel.providerID === provider.id &&
                          selectedModel.modelID === model.id &&
                          'bg-accent',
                      )}
                    >
                      {model.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Agent selector */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
                  <Bot className="size-3" />
                  <span className="capitalize">{selectedAgent}</span>
                  <ChevronDown className="size-3" />
                </Button>
              }
            />
            <DropdownMenuContent align="start">
              {agents.map((agent) => (
                <DropdownMenuItem
                  key={agent.name}
                  onClick={() => setSelectedAgent(agent.name)}
                  className={cn(selectedAgent === agent.name && 'bg-accent')}
                >
                  <span className="capitalize">{agent.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Auto-accept toggle */}
          <Button
            variant={autoAcceptEdits ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5 text-xs h-7"
            onClick={settingStore.actions.toggleAutoAcceptEdits}
          >
            <Check className="size-3" />
            <span className="hidden sm:inline">Auto-accept</span>
          </Button>

          {/* History indicator */}
          {promptHistory.length > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <History className="size-3" />
              <span className="hidden sm:inline">{promptHistory.length} in history</span>
            </span>
          )}
        </div>

        {/* Input container */}
        <div className="relative flex items-end gap-2 rounded-xl border bg-card p-3 shadow-sm">
          {/* Mobile options toggle */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => setShowOptions(!showOptions)}
            >
              {showOptions ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
            </Button>
          )}

          {/* Shell command indicator */}
          {isShellCommand && (
            <div className="absolute left-3 top-3 flex items-center gap-1 text-orange-500">
              <Terminal className="size-4" />
            </div>
          )}

          <textarea
            ref={ref}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isMobile
                ? 'Ask anything...'
                : 'Ask anything... (Enter to send, Shift+Enter for new line, ! for shell)'
            }
            className={cn(
              'min-h-[44px] max-h-[200px] flex-1 resize-none bg-transparent text-sm md:text-base outline-none placeholder:text-muted-foreground',
              isShellCommand && 'pl-6',
            )}
            rows={1}
            {...props}
          />
          <div className="flex items-center gap-1">
            {isWorking ? (
              <Button
                variant="ghost"
                size="icon"
                className="size-10 md:size-8"
                onClick={() => abortSession.mutate(sessionId)}
              >
                <Square className="size-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                className="size-10 md:size-8"
                onClick={handleSubmit}
                disabled={!canSend}
              >
                <Send className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile hint */}
        {isMobile && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Swipe from left edge to open sidebar
          </p>
        )}
      </div>
    </div>
  )
}

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(timestamp)
}
