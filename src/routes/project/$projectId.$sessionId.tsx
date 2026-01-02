// Session detail route.
// Shows the chat interface for a specific session.
// Mobile-optimized with touch-friendly controls.
import { createFileRoute } from '@tanstack/react-router'
import { FileCode } from 'lucide-react'
import { useEffect, useRef } from 'react'

import type { Message, Part, TextPart, ToolPart } from '@/lib/opencode'

import { MessageResponse } from '@/components/ai-elements/message'
import { ToolCard } from '@/components/ai-elements/tool'
import { ChatMessage, ChatThread } from '@/components/chat/chat-thread'
import { HolyGrailLayout } from '@/components/layout/layout'
import { Skeleton } from '@/components/ui/skeleton'
import { useDiffQuery, useMessagesQuery, useSessionQuery } from '@/lib/opencode/queries'

export const Route = createFileRoute('/project/$projectId/$sessionId')({
  component: SessionPage,
})

function SessionPage() {
  const { projectId, sessionId } = Route.useParams()
  const directory = decodeURIComponent(projectId)

  const { data: session, isLoading: sessionLoading } = useSessionQuery(sessionId)
  const { data: messagesData, isLoading: messagesLoading } = useMessagesQuery(sessionId)
  const { data: diffs } = useDiffQuery(sessionId)

  const endRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
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
    <div className="flex items-center gap-2 min-w-0">
      <span className="truncate font-medium">
        {sessionLoading ? <Skeleton className="h-4 w-32" /> : (session?.title ?? 'New Session')}
      </span>
      {hasChanges && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <FileCode className="size-3" />
          {diffs.length}
        </span>
      )}
    </div>
  )

  return (
    <HolyGrailLayout header={headerContent} sessionId={sessionId} directory={directory} showPrompt>
      {/* Messages */}
      <ChatThread>
        {isLoading ? (
          <>
            <MessageSkeleton />
            <MessageSkeleton isAssistant />
          </>
        ) : messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((message) => (
            <MessageItem key={message.id} message={message} parts={parts[message.id] ?? []} />
          ))
        )}
        <div ref={endRef} />
      </ChatThread>
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
    <ChatMessage role={isAssistant ? 'assistant' : 'user'} className="w-full">
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </ChatMessage>
  )
}

interface MessageItemProps {
  message: Message
  parts: Part[]
}

function MessageItem({ message, parts }: MessageItemProps) {
  const textParts = parts.filter((p): p is TextPart => p.type === 'text')
  const toolParts = parts.filter((p): p is ToolPart => p.type === 'tool')

  const text = textParts.map((p) => p.text).join('')

  return (
    <ChatMessage role={message.role}>
      {/* Text content */}
      {text && <MessageResponse>{text}</MessageResponse>}

      {/* Tool calls */}
      {toolParts.length > 0 && (
        <div className="space-y-2 mt-2 w-full">
          {toolParts.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              icon={<FileCode className="size-4" />}
              className="w-full"
            />
          ))}
        </div>
      )}
    </ChatMessage>
  )
}
