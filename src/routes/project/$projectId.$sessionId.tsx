// Session detail route.
// Shows the chat interface for a specific session.
// Mobile-optimized with touch-friendly controls.
import { createFileRoute } from '@tanstack/react-router'
import { FileCode, MessageSquare } from 'lucide-react'
import { Streamdown } from 'streamdown'

import type { Part, TextPart, ToolPart } from '@/lib/opencode'

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
  ConversationStickyHeader,
} from '@/components/ai-elements/conversation'
import { Message, MessageContent, UserMessage } from '@/components/ai-elements/message'
import { ToolCard } from '@/components/ai-elements/tool'
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
    <div className="flex min-w-0 items-center gap-2">
      <span className="truncate font-medium">
        {sessionLoading ? <Skeleton className="h-4 w-32" /> : (session?.title ?? 'New Session')}
      </span>
      {hasChanges && (
        <span className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
          <FileCode className="size-3" />
          {diffs.length}
        </span>
      )}
    </div>
  )

  return (
    <HolyGrailLayout header={headerContent} sessionId={sessionId} directory={directory} showPrompt>
      {/* Messages */}
      <Conversation>
        <ConversationStickyHeader />
        <ConversationContent>
          {isLoading ? (
            <>
              <MessageSkeleton />
              <MessageSkeleton isAssistant />
            </>
          ) : messages.length === 0 ? (
            <ConversationEmptyState
              icon={<MessageSquare className="size-12" />}
              title="New Session"
              description="Ask anything about your codebase. I can help you understand, modify, and debug your code."
            />
          ) : (
            messages.map((message) => {
              const messageParts = parts[message.id] ?? []
              const textParts = messageParts.filter((p): p is TextPart => p.type === 'text')
              const toolParts = messageParts.filter((p): p is ToolPart => p.type === 'tool')
              const text = textParts.map((p) => p.text).join('')

              // User messages use the new collapsible UserMessage component
              if (message.role === 'user') {
                return (
                  <UserMessage key={message.id} messageId={message.id} text={text}>
                    {text}
                  </UserMessage>
                )
              }

              // Assistant messages
              return (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {/* Text content */}
                    {text && (
                      <Streamdown className="size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        {text}
                      </Streamdown>
                    )}

                    {/* Tool calls */}
                    {toolParts.length > 0 && (
                      <div className="mt-2 w-full space-y-2">
                        {toolParts.map((tool) => (
                          <ToolCard key={tool.id} tool={tool} className="w-full" />
                        ))}
                      </div>
                    )}
                  </MessageContent>
                </Message>
              )
            })
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
    </HolyGrailLayout>
  )
}

function MessageSkeleton({ isAssistant = false }: { isAssistant?: boolean }) {
  return (
    <Message from={isAssistant ? 'assistant' : 'user'} className="w-full">
      <MessageContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </MessageContent>
    </Message>
  )
}
