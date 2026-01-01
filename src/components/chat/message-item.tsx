import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react'
import { Bot, User, Copy, Check, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { extractTextContent, extractToolCalls, getMessageError } from '@/lib/opencode/adapter'
import type { Message, Part, ToolPart } from '@/lib/opencode'

interface MessageItemProps extends ComponentPropsWithoutRef<'div'> {
  message: Message
  parts: Part[]
  isStreaming?: boolean
  onRetry?: () => void
}

/** Single message in the chat thread */
export const MessageItem = forwardRef<ElementRef<'div'>, MessageItemProps>(
  ({ message, parts, isStreaming, onRetry, className, ...props }, ref) => {
    const isUser = message.role === 'user'
    const { isCopied, copy } = useCopyToClipboard()

    // Extract text content
    const textContent = extractTextContent(parts)

    // Extract tool calls
    const toolCalls = extractToolCalls(parts)

    // Check for error
    const error = getMessageError(message)
    const hasError = !!error

    return (
      <div
        ref={ref}
        className={cn(
          'flex gap-3 px-4 py-3',
          isUser && 'flex-row-reverse',
          className
        )}
        {...props}
      >
        {/* Avatar */}
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
            isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        {/* Content */}
        <div
          className={cn(
            'flex-1 min-w-0 space-y-2',
            isUser && 'flex flex-col items-end'
          )}
        >
          {/* Main message bubble */}
          <div
            className={cn(
              'rounded-2xl px-4 py-2 max-w-[85%]',
              isUser
                ? 'bg-primary text-primary-foreground rounded-br-md'
                : 'bg-muted rounded-bl-md',
              hasError && 'border-2 border-destructive'
            )}
          >
            {textContent ? (
              <p className="text-sm whitespace-pre-wrap break-words">
                {textContent}
              </p>
            ) : isStreaming ? (
              <div className="flex items-center gap-1">
                <span className="animate-pulse">●</span>
                <span className="animate-pulse animation-delay-200">●</span>
                <span className="animate-pulse animation-delay-400">●</span>
              </div>
            ) : null}

            {hasError && error && (
              <p className="text-destructive text-xs mt-1">
                {error.name}: {error.message ?? 'An error occurred'}
              </p>
            )}
          </div>

          {/* Tool calls */}
          {toolCalls.length > 0 && (
            <div className="space-y-1 max-w-[85%]">
              {toolCalls.map((tool) => (
                <ToolCallItem key={tool.id} tool={tool} />
              ))}
            </div>
          )}

          {/* Actions */}
          {!isUser && textContent && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => copy(textContent)}
              >
                {isCopied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              {onRetry && hasError && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onRetry}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
)

MessageItem.displayName = 'MessageItem'

interface ToolCallItemProps {
  tool: ToolPart
}

function ToolCallItem({ tool }: ToolCallItemProps) {
  const { state } = tool
  const isRunning = state.status === 'running' || state.status === 'pending'
  const isError = state.status === 'error'
  const isCompleted = state.status === 'completed'

  const title =
    state.status === 'completed' || state.status === 'running'
      ? state.title
      : tool.tool

  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2 text-sm',
        isRunning && 'border-blue-500/50 bg-blue-500/10',
        isError && 'border-destructive/50 bg-destructive/10',
        isCompleted && 'border-border bg-muted/50'
      )}
    >
      <div className="flex items-center gap-2">
        {isRunning && (
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
        )}
        {isError && <div className="h-2 w-2 rounded-full bg-destructive" />}
        {isCompleted && <div className="h-2 w-2 rounded-full bg-green-500" />}
        <span className="font-medium">{title ?? tool.tool}</span>
      </div>
      {isError && 'error' in state && (
        <p className="text-destructive text-xs mt-1">{state.error}</p>
      )}
    </div>
  )
}
