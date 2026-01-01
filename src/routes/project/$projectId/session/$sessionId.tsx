/**
 * Session detail route.
 * Shows the chat interface for a specific session.
 */
import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef, forwardRef } from 'react'
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
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { 
  useSessionQuery, 
  useMessagesQuery, 
  useDiffQuery,
  useSendPromptMutation, 
  useAbortSessionMutation,
} from '@/lib/opencode/queries'
import type { Message, Part, TextPart, ToolPart } from '@/lib/opencode'

/** Maximum characters to display in tool output preview */
const TOOL_OUTPUT_MAX_LENGTH = 500

export const Route = createFileRoute('/project/$projectId/session/$sessionId')({
  component: SessionPage,
})

function SessionPage() {
  const { projectId: _projectId, sessionId } = Route.useParams()
  
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
  const parts = messagesData?.reduce<Record<string, Part[]>>((acc, m) => {
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
            {sessionLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              session?.title ?? 'New Session'
            )}
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
            <DropdownMenuTrigger render={
              <Button variant="ghost" size="icon" className="size-8">
                <MoreVertical className="size-4" />
              </Button>
            } />
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Share session</DropdownMenuItem>
              <DropdownMenuItem>Export</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
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
                <MessageItem
                  key={message.id}
                  message={message}
                  parts={parts[message.id] ?? []}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <PromptInput ref={inputRef} sessionId={sessionId} />
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
        <AvatarFallback className={cn('text-xs', isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary')}>
          {isUser ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">
            {isUser ? 'You' : 'Assistant'}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.time.created)}
          </span>
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

        {/* Action bar */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
          return <h1 key={i} className="text-lg font-bold mt-4 mb-2">{line.slice(2)}</h1>
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-base font-bold mt-3 mb-1">{line.slice(3)}</h2>
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-sm font-bold mt-2 mb-1">{line.slice(4)}</h3>
        }
        // Lists
        if (line.match(/^[-*]\s/)) {
          return <li key={i} className="ml-4">{line.slice(2)}</li>
        }
        if (line.match(/^\d+\.\s/)) {
          return <li key={i} className="ml-4 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>
        }
        // Regular text
        return <span key={i}>{line}{i < lines.length - 1 ? '\n' : ''}</span>
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
      <TooltipTrigger render={
        <Button variant="ghost" size="icon" className="size-6" onClick={handleCopy}>
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        </Button>
      } />
      <TooltipContent>{copied ? 'Copied!' : 'Copy'}</TooltipContent>
    </Tooltip>
  )
}

interface PromptInputProps {
  sessionId: string
}

const PromptInput = forwardRef<HTMLTextAreaElement, PromptInputProps>(
  ({ sessionId }, ref) => {
    const [value, setValue] = useState('')
    const sendPrompt = useSendPromptMutation()
    const abortSession = useAbortSessionMutation()

    const isWorking = sendPrompt.isPending
    const canSend = value.trim().length > 0 && !isWorking

    const handleSubmit = async () => {
      if (!canSend) return
      
      const text = value.trim()
      setValue('')
      
      await sendPrompt.mutateAsync({
        sessionId,
        messageId: `msg_${Date.now()}`,
        text,
        agent: 'code', // Default agent
        model: {
          providerID: 'anthropic',
          modelID: 'claude-sonnet-4-20250514',
        },
      })
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        void handleSubmit()
      }
      if (e.key === 'Escape' && isWorking) {
        abortSession.mutate(sessionId)
      }
    }

    return (
      <div className="border-t bg-background p-4">
        <div className="mx-auto max-w-3xl">
          <div className="relative flex items-end gap-2 rounded-xl border bg-card p-3 shadow-sm">
            <textarea
              ref={ref}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything... (Enter to send, Shift+Enter for new line)"
              className="min-h-[60px] max-h-[200px] flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              rows={1}
            />
            <div className="flex items-center gap-1">
              {isWorking ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => abortSession.mutate(sessionId)}
                >
                  <Square className="size-4" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  className="size-8"
                  onClick={handleSubmit}
                  disabled={!canSend}
                >
                  <Send className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
)
PromptInput.displayName = 'PromptInput'

function formatTime(timestamp: number): string {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(timestamp)
}
