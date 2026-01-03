'use client'

import type { ComponentProps } from 'react'

import { ArrowDownIcon } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// --- Sticky Scroll Context ---

interface StickyUserMessage {
  id: string
  text: string
}

interface StickyScrollContextValue {
  stickyMessage: StickyUserMessage | null
  registerUserMessage: (id: string, text: string, element: HTMLElement) => void
  unregisterUserMessage: (id: string) => void
}

const StickyScrollContext = createContext<StickyScrollContextValue | null>(null)

export function useStickyScroll() {
  return useContext(StickyScrollContext)
}

export type ConversationProps = ComponentProps<typeof StickToBottom>

export const Conversation = ({ className, children, ...props }: ConversationProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const userMessagesRef = useRef<Map<string, { text: string; element: HTMLElement }>>(new Map())
  const [stickyMessage, setStickyMessage] = useState<StickyUserMessage | null>(null)

  const registerUserMessage = useCallback((id: string, text: string, element: HTMLElement) => {
    userMessagesRef.current.set(id, { text, element })
  }, [])

  const unregisterUserMessage = useCallback((id: string) => {
    userMessagesRef.current.delete(id)
  }, [])

  // Intersection Observer to track which user message should be sticky
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scrollableElement = container.querySelector('[data-stick-to-bottom-scroll]')
    if (!scrollableElement) return

    const handleScroll = () => {
      const containerRect = scrollableElement.getBoundingClientRect()

      let lastAboveMessage: StickyUserMessage | null = null

      // Find the last user message that has scrolled above the viewport
      for (const [id, { text, element }] of userMessagesRef.current) {
        const rect = element.getBoundingClientRect()
        const relativeTop = rect.top - containerRect.top

        // If message top is above the container top (scrolled past)
        if (relativeTop < 0 && rect.bottom < containerRect.top + 80) {
          lastAboveMessage = { id, text }
        }
      }

      setStickyMessage(lastAboveMessage)
    }

    scrollableElement.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check

    return () => {
      scrollableElement.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const contextValue: StickyScrollContextValue = {
    stickyMessage,
    registerUserMessage,
    unregisterUserMessage,
  }

  return (
    <StickyScrollContext.Provider value={contextValue}>
      <div ref={containerRef} className="relative flex flex-1 flex-col overflow-hidden">
        <StickToBottom
          className={cn('relative flex-1 overflow-y-hidden', className)}
          initial="smooth"
          resize="smooth"
          role="log"
          {...props}
        >
          {children}
        </StickToBottom>
      </div>
    </StickyScrollContext.Provider>
  )
}

export type ConversationContentProps = ComponentProps<typeof StickToBottom.Content>

export const ConversationContent = ({ className, ...props }: ConversationContentProps) => (
  <StickToBottom.Content className={cn('flex flex-col gap-4 p-4 relative', className)} {...props} />
)

// --- Sticky Header ---

export interface ConversationStickyHeaderProps extends ComponentProps<'div'> {
  /** Maximum characters to show in sticky header */
  maxChars?: number
}

export function ConversationStickyHeader({
  className,
  maxChars = 100,
  ...props
}: ConversationStickyHeaderProps) {
  const stickyContext = useStickyScroll()
  const stickyMessage = stickyContext?.stickyMessage

  if (!stickyMessage) return null

  const truncatedText =
    stickyMessage.text.length > maxChars
      ? `${stickyMessage.text.slice(0, maxChars).trim()}...`
      : stickyMessage.text

  return (
    <div
      className={cn(
        'absolute inset-x-0 top-0 z-10 border-b bg-background/95 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm',
        'animate-in fade-in-0 slide-in-from-top-2 duration-200',
        className,
      )}
      {...props}
    >
      <span className="line-clamp-1">{truncatedText}</span>
    </div>
  )
}

export type ConversationEmptyStateProps = ComponentProps<'div'> & {
  title?: string
  description?: string
  icon?: React.ReactNode
}

export const ConversationEmptyState = ({
  className,
  title = 'No messages yet',
  description = 'Start a conversation to see messages here',
  icon,
  children,
  ...props
}: ConversationEmptyStateProps) => (
  <div
    className={cn(
      'flex size-full flex-col items-center justify-center gap-3 p-8 text-center',
      className,
    )}
    {...props}
  >
    {children ?? (
      <>
        {icon && <div className="text-muted-foreground">{icon}</div>}
        <div className="space-y-1">
          <h3 className="font-medium text-sm">{title}</h3>
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
        </div>
      </>
    )}
  </div>
)

export type ConversationScrollButtonProps = ComponentProps<typeof Button>

export const ConversationScrollButton = ({
  className,
  ...props
}: ConversationScrollButtonProps) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext()

  const handleScrollToBottom = useCallback(() => {
    void scrollToBottom()
  }, [scrollToBottom])

  return (
    !isAtBottom && (
      <Button
        className={cn('absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full', className)}
        onClick={handleScrollToBottom}
        size="icon"
        variant="outline"
        {...props}
      >
        <ArrowDownIcon className="size-4" />
      </Button>
    )
  )
}
