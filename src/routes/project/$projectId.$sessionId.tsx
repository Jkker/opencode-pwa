// Session detail route.
// Shows the chat interface for a specific session.
// Mobile-optimized with touch-friendly controls.
import { createFileRoute } from '@tanstack/react-router'
import { FileCode } from 'lucide-react'
import { useEffect, useRef } from 'react'

import type { Message, Part, TextPart, ToolPart } from '@/lib/opencode'

import { ToolCard } from '@/components/ai-elements/tool'
import { HolyGrailLayout } from '@/components/holy-grail/layout'
import { Skeleton } from '@/components/ui/skeleton'
import { useSessionQuery, useMessagesQuery, useDiffQuery } from '@/lib/opencode/queries'
import { cn } from '@/lib/utils'

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

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messagesData])

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

  const headerContent = (
    <div className="flex items-center gap-2">
      <span className="truncate font-medium">
        {sessionLoading ? <Skeleton className="h-4 w-32" /> : (session?.title ?? 'New Session')}
      </span>
      {hasChanges && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <FileCode className="size-3" />
          {diffs.length} files
        </span>
      )}
    </div>
  )

  return (
    <HolyGrailLayout header={headerContent} sessionId={sessionId} directory={directory} showPrompt>
      {/* Messages */}
      <div ref={scrollRef} className="h-full overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-3xl">
          {isLoading ? (
            <div className="space-y-4 px-2 py-2">
              <MessageSkeleton />
              <MessageSkeleton isAssistant />
            </div>
          ) : messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="px-2 py-2">
              {messages.map((message) => (
                <MessageItem key={message.id} message={message} parts={parts[message.id] ?? []} />
              ))}
            </div>
          )}
        </div>
      </div>
    </HolyGrailLayout>
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
    <div className={cn('py-2', !isAssistant && 'bg-primary/10')}>
      <div className="space-y-2">
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
    <div className={cn('py-2', isUser && 'bg-primary/10')}>
      {/* Text content */}
      {text && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <MarkdownContent content={text} />
        </div>
      )}

      {/* Tool calls */}
      {toolParts.length > 0 && (
        <div className="space-y-1.5 mt-2">
          {toolParts.map((tool) => (
            <ToolCard key={tool.id} tool={tool} icon={<FileCode className="size-4" />} />
          ))}
        </div>
      )}
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
