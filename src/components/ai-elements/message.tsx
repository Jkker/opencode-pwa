'use client'

import type { FileUIPart, UIMessage } from 'ai'
import type { ComponentProps, HTMLAttributes, ReactElement, Ref } from 'react'

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  PaperclipIcon,
  PencilIcon,
  XIcon,
} from 'lucide-react'
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'

import { useStickyScroll } from '@/components/ai-elements/conversation'
import { Button } from '@/components/ui/button'
import { ButtonGroup, ButtonGroupText } from '@/components/ui/button-group'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// Default max lines before truncation
const DEFAULT_MAX_LINES = 6

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage['role']
  ref?: Ref<HTMLDivElement>
}

export const Message = ({ className, from, ref, ...props }: MessageProps) => (
  <div
    ref={ref}
    className={cn(
      'group flex w-full max-w-[95%] flex-col gap-2',
      from === 'user' ? 'is-user ml-auto justify-end' : 'is-assistant',
      className,
    )}
    {...props}
  />
)

export type MessageContentProps = HTMLAttributes<HTMLDivElement>

export const MessageContent = ({ children, className, ...props }: MessageContentProps) => (
  <div
    className={cn(
      'is-user:dark flex max-w-full min-w-0 flex-col gap-2 overflow-hidden text-sm',
      'group-[.is-user]:w-fit group-[.is-user]:ml-auto group-[.is-user]:rounded-lg group-[.is-user]:bg-secondary group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-foreground',
      'group-[.is-assistant]:w-full group-[.is-assistant]:text-foreground',
      className,
    )}
    {...props}
  >
    {children}
  </div>
)

export type MessageActionsProps = ComponentProps<'div'>

export const MessageActions = ({ className, children, ...props }: MessageActionsProps) => (
  <div className={cn('flex items-center gap-1', className)} {...props}>
    {children}
  </div>
)

export type MessageActionProps = ComponentProps<typeof Button> & {
  tooltip?: string
  label?: string
}

export const MessageAction = ({
  tooltip,
  children,
  label,
  variant = 'ghost',
  size = 'icon-sm',
  ...props
}: MessageActionProps) => {
  const button = (
    <Button size={size} variant={variant} {...props}>
      {children}
      <span className="sr-only">{label || tooltip}</span>
    </Button>
  )

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return button
}

type MessageBranchContextType = {
  currentBranch: number
  totalBranches: number
  goToPrevious: () => void
  goToNext: () => void
  branches: ReactElement[]
  setBranches: (branches: ReactElement[]) => void
}

const MessageBranchContext = createContext<MessageBranchContextType | null>(null)

const useMessageBranch = () => {
  const context = useContext(MessageBranchContext)

  if (!context) {
    throw new Error('MessageBranch components must be used within MessageBranch')
  }

  return context
}

export type MessageBranchProps = HTMLAttributes<HTMLDivElement> & {
  defaultBranch?: number
  onBranchChange?: (branchIndex: number) => void
}

export const MessageBranch = ({
  defaultBranch = 0,
  onBranchChange,
  className,
  ...props
}: MessageBranchProps) => {
  const [currentBranch, setCurrentBranch] = useState(defaultBranch)
  const [branches, setBranches] = useState<ReactElement[]>([])

  const handleBranchChange = (newBranch: number) => {
    setCurrentBranch(newBranch)
    onBranchChange?.(newBranch)
  }

  const goToPrevious = () => {
    const newBranch = currentBranch > 0 ? currentBranch - 1 : branches.length - 1
    handleBranchChange(newBranch)
  }

  const goToNext = () => {
    const newBranch = currentBranch < branches.length - 1 ? currentBranch + 1 : 0
    handleBranchChange(newBranch)
  }

  const contextValue: MessageBranchContextType = {
    currentBranch,
    totalBranches: branches.length,
    goToPrevious,
    goToNext,
    branches,
    setBranches,
  }

  return (
    <MessageBranchContext.Provider value={contextValue}>
      <div className={cn('grid w-full gap-2 [&>div]:pb-0', className)} {...props} />
    </MessageBranchContext.Provider>
  )
}

export type MessageBranchContentProps = HTMLAttributes<HTMLDivElement>

export const MessageBranchContent = ({ children, ...props }: MessageBranchContentProps) => {
  const { currentBranch, setBranches, branches } = useMessageBranch()

  const childrenArray = React.Children.toArray(children).filter((child): child is ReactElement =>
    React.isValidElement(child),
  )

  // Use useEffect to update branches when they change
  useEffect(() => {
    if (branches.length !== childrenArray.length) {
      setBranches(childrenArray)
    }
  }, [childrenArray, branches.length, setBranches])

  return childrenArray.map((branch, index) => (
    <div
      className={cn(
        'grid gap-2 overflow-hidden [&>div]:pb-0',
        index === currentBranch ? 'block' : 'hidden',
      )}
      key={branch.key ?? index}
      {...props}
    >
      {branch}
    </div>
  ))
}

export type MessageBranchSelectorProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage['role']
}

export const MessageBranchSelector = ({
  className,
  from,
  ...props
}: MessageBranchSelectorProps) => {
  const { totalBranches } = useMessageBranch()

  // Don't render if there's only one branch
  if (totalBranches <= 1) {
    return null
  }

  return (
    <ButtonGroup
      className="[&>*:not(:first-child)]:rounded-l-md [&>*:not(:last-child)]:rounded-r-md"
      orientation="horizontal"
      {...props}
    />
  )
}

export type MessageBranchPreviousProps = ComponentProps<typeof Button>

export const MessageBranchPrevious = ({ children, ...props }: MessageBranchPreviousProps) => {
  const { goToPrevious, totalBranches } = useMessageBranch()

  return (
    <Button
      aria-label="Previous branch"
      disabled={totalBranches <= 1}
      onClick={goToPrevious}
      size="icon-sm"
      variant="ghost"
      {...props}
    >
      {children ?? <ChevronLeftIcon size={14} />}
    </Button>
  )
}

export type MessageBranchNextProps = ComponentProps<typeof Button>

export const MessageBranchNext = ({ children, className, ...props }: MessageBranchNextProps) => {
  const { goToNext, totalBranches } = useMessageBranch()

  return (
    <Button
      aria-label="Next branch"
      disabled={totalBranches <= 1}
      onClick={goToNext}
      size="icon-sm"
      variant="ghost"
      {...props}
    >
      {children ?? <ChevronRightIcon size={14} />}
    </Button>
  )
}

export type MessageBranchPageProps = HTMLAttributes<HTMLSpanElement>

export const MessageBranchPage = ({ className, ...props }: MessageBranchPageProps) => {
  const { currentBranch, totalBranches } = useMessageBranch()

  return (
    <ButtonGroupText
      className={cn('border-none bg-transparent text-muted-foreground shadow-none', className)}
      {...props}
    >
      {currentBranch + 1} of {totalBranches}
    </ButtonGroupText>
  )
}

export type MessageAttachmentProps = HTMLAttributes<HTMLDivElement> & {
  data: FileUIPart
  className?: string
  onRemove?: () => void
}

export function MessageAttachment({ data, className, onRemove, ...props }: MessageAttachmentProps) {
  const filename = data.filename || ''
  const mediaType = data.mediaType?.startsWith('image/') && data.url ? 'image' : 'file'
  const isImage = mediaType === 'image'
  const attachmentLabel = filename || (isImage ? 'Image' : 'Attachment')

  return (
    <div className={cn('group relative size-24 overflow-hidden rounded-lg', className)} {...props}>
      {isImage ? (
        <>
          <img
            alt={filename || 'attachment'}
            className="size-full object-cover"
            height={100}
            src={data.url}
            width={100}
          />
          {onRemove && (
            <Button
              aria-label="Remove attachment"
              className="absolute top-2 right-2 size-6 rounded-full bg-background/80 p-0 opacity-0 backdrop-blur-sm transition-opacity hover:bg-background group-hover:opacity-100 [&>svg]:size-3"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              type="button"
              variant="ghost"
            >
              <XIcon />
              <span className="sr-only">Remove</span>
            </Button>
          )}
        </>
      ) : (
        <>
          <Tooltip>
            <TooltipTrigger className="flex size-full shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <PaperclipIcon className="size-4" />
            </TooltipTrigger>
            <TooltipContent>
              <p>{attachmentLabel}</p>
            </TooltipContent>
          </Tooltip>
          {onRemove && (
            <Button
              aria-label="Remove attachment"
              className="size-6 shrink-0 rounded-full p-0 opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100 [&>svg]:size-3"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              type="button"
              variant="ghost"
            >
              <XIcon />
              <span className="sr-only">Remove</span>
            </Button>
          )}
        </>
      )}
    </div>
  )
}

export type MessageAttachmentsProps = ComponentProps<'div'>

export function MessageAttachments({ children, className, ...props }: MessageAttachmentsProps) {
  if (!children) {
    return null
  }

  return (
    <div className={cn('ml-auto flex w-fit flex-wrap items-start gap-2', className)} {...props}>
      {children}
    </div>
  )
}

export type MessageToolbarProps = ComponentProps<'div'>

export const MessageToolbar = ({ className, children, ...props }: MessageToolbarProps) => (
  <div className={cn('mt-4 flex w-full items-center justify-between gap-4', className)} {...props}>
    {children}
  </div>
)

// --- User Message Components ---

export interface UserMessageProps extends HTMLAttributes<HTMLDivElement> {
  /** The raw text content for copy/edit operations */
  text: string
  /** Whether the message should be collapsible (auto-detected if content exceeds maxLines) */
  collapsible?: boolean
  /** Maximum lines to show when collapsed */
  maxLines?: number
  /** Initial collapsed state (defaults to true if content exceeds maxLines) */
  defaultCollapsed?: boolean
  /** Callback when edit is requested */
  onEdit?: (text: string) => void
  /** Message ID for branching reference */
  messageId?: string
  /** Data attribute for sticky scroll tracking */
  'data-user-message-id'?: string
}

export function UserMessage({
  className,
  children,
  text,
  collapsible,
  maxLines = DEFAULT_MAX_LINES,
  defaultCollapsed,
  onEdit,
  messageId,
  ...props
}: UserMessageProps) {
  const messageRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [shouldCollapse, setShouldCollapse] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed ?? true)
  const [copied, setCopied] = useState(false)
  const stickyScroll = useStickyScroll()

  // Register with sticky scroll context
  useEffect(() => {
    if (!messageId || !messageRef.current || !stickyScroll) return

    stickyScroll.registerUserMessage(messageId, text, messageRef.current)

    return () => {
      stickyScroll.unregisterUserMessage(messageId)
    }
  }, [messageId, text, stickyScroll])

  // Measure content height to determine if collapsible
  useEffect(() => {
    if (collapsible !== undefined) {
      setShouldCollapse(collapsible)
      return
    }

    const el = contentRef.current
    if (!el) return

    // Use line-height estimation (~1.5rem per line)
    const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight) || 24
    const maxHeight = lineHeight * maxLines
    const isOverflowing = el.scrollHeight > maxHeight + lineHeight / 2

    setShouldCollapse(isOverflowing)
    if (defaultCollapsed === undefined) {
      setIsCollapsed(isOverflowing)
    }
  }, [children, text, collapsible, maxLines, defaultCollapsed])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleEdit = () => {
    onEdit?.(text)
  }

  const content = (
    <div
      ref={contentRef}
      className={cn(
        'size-full text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
        shouldCollapse && isCollapsed && 'line-clamp-6',
      )}
      style={
        shouldCollapse && isCollapsed
          ? { WebkitLineClamp: maxLines, display: '-webkit-box', WebkitBoxOrient: 'vertical' }
          : undefined
      }
    >
      {children}
    </div>
  )

  return (
    <Message
      ref={messageRef}
      from="user"
      className={cn('user-message', className)}
      data-user-message-id={messageId}
      {...props}
    >
      <MessageContent className="group/user-message relative">
        {shouldCollapse ? (
          <Collapsible open={!isCollapsed} onOpenChange={(open) => setIsCollapsed(!open)}>
            <div
              className={cn(isCollapsed && 'line-clamp-6')}
              style={
                isCollapsed
                  ? {
                      WebkitLineClamp: maxLines,
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }
                  : undefined
              }
            >
              {content}
            </div>
            <CollapsibleContent>
              {/* Hidden when collapsed, visible when expanded */}
            </CollapsibleContent>
            <div className="mt-2 flex items-center gap-1">
              <CollapsibleTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs text-muted-foreground"
                  />
                }
              >
                <ChevronDownIcon
                  className={cn('size-3.5 transition-transform', !isCollapsed && 'rotate-180')}
                />
                {isCollapsed ? 'Show more' : 'Show less'}
              </CollapsibleTrigger>
              <UserMessageActions
                onCopy={handleCopy}
                onEdit={onEdit ? handleEdit : undefined}
                copied={copied}
              />
            </div>
          </Collapsible>
        ) : (
          <>
            {content}
            <div className="mt-2 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover/user-message:opacity-100">
              <UserMessageActions
                onCopy={handleCopy}
                onEdit={onEdit ? handleEdit : undefined}
                copied={copied}
              />
            </div>
          </>
        )}
      </MessageContent>
    </Message>
  )
}

interface UserMessageActionsProps {
  onCopy: () => void
  onEdit?: () => void
  copied: boolean
}

function UserMessageActions({ onCopy, onEdit, copied }: UserMessageActionsProps) {
  return (
    <div className="flex items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-7 text-muted-foreground hover:text-foreground"
            />
          }
          onClick={onCopy}
        >
          <CopyIcon className="size-3.5" />
          <span className="sr-only">Copy message</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{copied ? 'Copied!' : 'Copy'}</p>
        </TooltipContent>
      </Tooltip>

      {onEdit && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7 text-muted-foreground hover:text-foreground"
              />
            }
            onClick={onEdit}
          >
            <PencilIcon className="size-3.5" />
            <span className="sr-only">Edit message</span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Edit (branch)</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

// --- Sticky User Message (for sticky scroll header) ---

export interface StickyUserMessageProps extends HTMLAttributes<HTMLDivElement> {
  /** The truncated text preview */
  text: string
  /** Maximum characters to show in sticky header */
  maxChars?: number
}

export function StickyUserMessage({
  className,
  text,
  maxChars = 100,
  ...props
}: StickyUserMessageProps) {
  const truncatedText = text.length > maxChars ? `${text.slice(0, maxChars).trim()}...` : text

  return (
    <div
      className={cn(
        'sticky-user-message bg-background/95 backdrop-blur-sm border-b px-4 py-2 text-sm text-muted-foreground',
        'animate-in slide-in-from-top-2 fade-in-0 duration-200',
        className,
      )}
      {...props}
    >
      <span className="line-clamp-1">{truncatedText}</span>
    </div>
  )
}
