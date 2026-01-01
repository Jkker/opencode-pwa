import { useRef, useEffect, forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'
import { cn } from '@/lib/utils'
import { MessageItem } from './message-item'
import type { Message, Part, SessionStatus } from '@/lib/opencode'

interface ThreadProps extends ComponentPropsWithoutRef<'div'> {
  messages: Message[]
  parts: Record<string, Part[]>
  status: SessionStatus
  onRetry?: (messageId: string) => void
}

/** Chat thread that displays messages with auto-scroll */
export const Thread = forwardRef<ElementRef<'div'>, ThreadProps>(
  ({ messages, parts, status, onRetry, className, ...props }, ref) => {
    const scrollRef = useRef<HTMLDivElement>(null)
    const isWorking = status.type !== 'idle'

    // Auto-scroll on new messages
    useEffect(() => {
      if (scrollRef.current && isWorking) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, [messages, parts, isWorking])

    // Get user messages for display (filter out assistant messages to pair them)
    const userMessages = messages.filter((m) => m.role === 'user')

    // Find the assistant message(s) that follow each user message
    const getAssistantMessages = (userMessageId: string) => {
      const userIdx = messages.findIndex((m) => m.id === userMessageId)
      if (userIdx === -1) return []

      const assistantMessages: Message[] = []
      for (let i = userIdx + 1; i < messages.length; i++) {
        const msg = messages[i]
        if (msg.role === 'user') break
        assistantMessages.push(msg)
      }
      return assistantMessages
    }

    const lastUserMessage = userMessages.at(-1)

    return (
      <div
        ref={ref}
        className={cn('flex-1 min-h-0 overflow-hidden', className)}
        {...props}
      >
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto overscroll-contain"
        >
          <div className="flex flex-col py-4 space-y-1">
            {messages.length === 0 ? (
              <EmptyState />
            ) : (
              userMessages.map((userMessage) => {
                const assistantMessages = getAssistantMessages(userMessage.id)
                const isLast = userMessage.id === lastUserMessage?.id

                return (
                  <div key={userMessage.id} className="space-y-1">
                    {/* User message */}
                    <MessageItem
                      message={userMessage}
                      parts={parts[userMessage.id] ?? []}
                    />

                    {/* Assistant responses */}
                    {assistantMessages.map((assistantMessage) => (
                      <MessageItem
                        key={assistantMessage.id}
                        message={assistantMessage}
                        parts={parts[assistantMessage.id] ?? []}
                        isStreaming={isLast && isWorking}
                        onRetry={() => onRetry?.(userMessage.id)}
                      />
                    ))}

                    {/* Show streaming indicator if no assistant response yet */}
                    {isLast && isWorking && assistantMessages.length === 0 && (
                      <MessageItem
                        message={{
                          id: 'streaming',
                          sessionID: userMessage.sessionID,
                          role: 'assistant',
                          parentID: userMessage.id,
                          time: { created: Date.now() },
                          cost: 0,
                          tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
                          mode: '',
                          agent: '',
                          path: { cwd: '', root: '' },
                          providerID: '',
                          modelID: '',
                        }}
                        parts={[]}
                        isStreaming
                      />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    )
  }
)

Thread.displayName = 'Thread'

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium mb-1">New Session</h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        Start a conversation by typing a message below
      </p>
    </div>
  )
}
