import * as React from 'react'
import { type ReactNode } from 'react'

import { Message, MessageContent } from '@/components/ai-elements/message'
import { cn } from '@/lib/utils'

export interface ChatThreadProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
}

export const ChatThread = React.forwardRef<HTMLDivElement, ChatThreadProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex h-full flex-col overflow-y-auto overscroll-contain scroll-smooth',
          className,
        )}
        {...props}
      >
        <div className="mx-auto w-full max-w-3xl flex-1 space-y-4 p-4">{children}</div>
      </div>
    )
  },
)
ChatThread.displayName = 'ChatThread'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  children: ReactNode
  className?: string
}

export function ChatMessage({ role, children, className }: ChatMessageProps) {
  return (
    <Message from={role} className={className}>
      <MessageContent>{children}</MessageContent>
    </Message>
  )
}
