import { Send, Square, Copy, Check, User, Bot } from 'lucide-react'
import * as React from 'react'
import { type ReactNode, type ButtonHTMLAttributes } from 'react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface ChatThreadProps {
  children?: ReactNode
}

export function ChatThread({ children }: ChatThreadProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto scroll-smooth">{children}</div>
    </div>
  )
}

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: ReactNode
  timestamp?: string
  actions?: ReactNode
}

export function ChatMessage({ role, content, timestamp, actions }: ChatMessageProps) {
  const isUser = role === 'user'

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
          {timestamp && <span className="text-xs text-muted-foreground">{timestamp}</span>}
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">{content}</div>
        {actions && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

interface ChatComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel?: () => void
  isWorking?: boolean
  placeholder?: string
}

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  onCancel,
  isWorking = false,
  placeholder = 'Ask anything... (Enter to send)',
}: ChatComposerProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
    if (e.key === 'Escape' && isWorking && onCancel) {
      onCancel()
    }
  }

  return (
    <div className="border-t bg-background p-4">
      <div className="mx-auto max-w-3xl">
        <div className="relative flex items-end gap-2 rounded-xl border bg-card p-3 shadow-sm">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[60px] max-h-[200px] flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            rows={1}
          />
          <div className="flex items-center gap-1">
            {isWorking ? (
              <Button variant="ghost" size="icon" className="size-8" onClick={onCancel}>
                <Square className="size-4" />
              </Button>
            ) : (
              <Button size="icon" className="size-8" onClick={onSubmit} disabled={!value.trim()}>
                <Send className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  tooltip: string
}

export function ActionButton({ tooltip, className, children, ...props }: ActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Button variant="ghost" size="icon" className={cn('size-6', className)} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltip}</TooltipContent>
    </Tooltip>
  )
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ActionButton tooltip={copied ? 'Copied!' : 'Copy'} onClick={handleCopy}>
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
    </ActionButton>
  )
}
