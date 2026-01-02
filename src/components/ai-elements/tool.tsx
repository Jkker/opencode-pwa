'use client'

import type { ComponentProps, ReactNode } from 'react'
import type { BundledLanguage } from 'shiki'

import {
  ArchiveIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  CopyIcon,
  DownloadIcon,
  ShareIcon,
  WrenchIcon,
  XCircleIcon,
} from 'lucide-react'
import { isValidElement, useState } from 'react'

import type { ToolPart, ToolState } from '@/lib/opencode'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'

import { CodeBlock } from './code-block'

// Max height for scroll areas (in pixels)
const MAX_CONTENT_HEIGHT = 256
// Threshold for auto-collapsing output
const OUTPUT_COLLAPSE_THRESHOLD = 500

type ToolStatus = ToolState['status']

const STATUS_CONFIG: Record<ToolStatus, { label: string; icon: ReactNode; colorClass: string }> = {
  pending: {
    label: 'Pending',
    icon: <CircleIcon className="size-3 animate-pulse" />,
    colorClass: 'text-muted-foreground',
  },
  running: {
    label: 'Running',
    icon: <ClockIcon className="size-3 animate-spin" />,
    colorClass: 'text-primary',
  },
  completed: {
    label: 'Completed',
    icon: <CheckCircleIcon className="size-3" />,
    colorClass: 'text-green-600',
  },
  error: {
    label: 'Error',
    icon: <XCircleIcon className="size-3" />,
    colorClass: 'text-destructive',
  },
}

function StatusIndicator({ status }: { status: ToolStatus }) {
  const config = STATUS_CONFIG[status]
  return <span className={cn('flex items-center gap-1', config.colorClass)}>{config.icon}</span>
}

interface CopyButtonProps {
  text: string
  label?: string
  className?: string
}

function CopyButton({ text, label = 'Copy', className }: CopyButtonProps) {
  const { copy, isCopied } = useCopyToClipboard()
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={cn('size-6', className)}
            onClick={(e) => {
              e.stopPropagation()
              void copy(text)
            }}
          >
            {isCopied ? (
              <CheckCircleIcon className="size-3 text-green-600" />
            ) : (
              <CopyIcon className="size-3" />
            )}
          </Button>
        }
      />
      <TooltipContent>{isCopied ? 'Copied!' : label}</TooltipContent>
    </Tooltip>
  )
}

function formatOutput(output: string): { text: string; language: BundledLanguage } {
  // Try to parse as JSON for pretty printing
  try {
    const parsed = JSON.parse(output)
    return { text: JSON.stringify(parsed, null, 2), language: 'json' }
  } catch {
    return { text: output, language: 'log' }
  }
}

// Action button component
interface ActionButtonProps {
  icon: ReactNode
  label: string
  onClick?: () => void
  className?: string
}

function ActionButton({ icon, label, onClick, className }: ActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={cn('size-6', className)}
            onClick={(e) => {
              e.stopPropagation()
              onClick?.()
            }}
          >
            {icon}
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export interface ToolCardProps extends ComponentProps<'div'> {
  /** Tool part from OpenCode SDK */
  tool: ToolPart
  /** Icon to display (defaults to WrenchIcon) */
  icon?: ReactNode
  /** Callback when archive action is triggered */
  onArchive?: () => void
  /** Callback when share action is triggered */
  onShare?: () => void
  /** Callback when download action is triggered */
  onDownload?: () => void
}

export function ToolCard({
  className,
  tool,
  icon,
  onArchive,
  onShare,
  onDownload,
  ...props
}: ToolCardProps) {
  const { state } = tool
  const status = state.status

  // Extract title from state if available
  const title = 'title' in state ? state.title : undefined
  const displayTitle = title ?? tool.tool
  const hasTitle = !!title

  // Get input from state
  const inputData = state.input
  const inputText = inputData ? JSON.stringify(inputData, null, 2) : ''

  // Get output from state (only available when completed or error)
  const outputRaw = status === 'completed' ? state.output : undefined
  const errorText = status === 'error' ? state.error : undefined
  const { text: outputText, language: outputLang } = outputRaw
    ? formatOutput(outputRaw)
    : { text: '', language: 'log' as BundledLanguage }

  // Determine if output should be auto-collapsed (too long)
  const shouldCollapseOutput = outputText.length > OUTPUT_COLLAPSE_THRESHOLD

  // Main card collapsed state
  const [isOpen, setIsOpen] = useState(true)
  // Input section collapsed state (collapsed by default if there's a title)
  const [isInputOpen, setIsInputOpen] = useState(!hasTitle)
  // Output section collapsed state
  const [isOutputOpen, setIsOutputOpen] = useState(!shouldCollapseOutput)

  const hasOutput = !!(outputRaw || errorText)
  const isError = status === 'error'

  return (
    <div
      className={cn(
        'not-prose rounded-lg border bg-card transition-shadow hover:shadow-sm',
        className,
      )}
      {...props}
    >
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2">
          <CollapsibleTrigger className="flex flex-1 items-center gap-2 text-left">
            <span className="text-muted-foreground">
              {icon ?? <WrenchIcon className="size-4" />}
            </span>
            <span className="flex-1 truncate font-medium text-sm">{displayTitle}</span>
            <StatusIndicator status={status} />
            <ChevronDownIcon
              className={cn(
                'size-4 text-muted-foreground transition-transform duration-200',
                isOpen && 'rotate-180',
              )}
            />
          </CollapsibleTrigger>

          {/* Actions */}
          <div className="flex items-center gap-0.5 border-l pl-2">
            {inputText && <CopyButton text={inputText} label="Copy input" />}
            {outputText && <CopyButton text={outputText} label="Copy output" />}
            {onDownload && (
              <ActionButton
                icon={<DownloadIcon className="size-3" />}
                label="Download"
                onClick={onDownload}
              />
            )}
            {onShare && (
              <ActionButton
                icon={<ShareIcon className="size-3" />}
                label="Share"
                onClick={onShare}
              />
            )}
            {onArchive && (
              <ActionButton
                icon={<ArchiveIcon className="size-3" />}
                label="Archive"
                onClick={onArchive}
              />
            )}
          </div>
        </div>

        {/* Content */}
        <CollapsibleContent>
          <div className="border-t">
            {/* Input Section */}
            {inputData && (
              <Collapsible open={isInputOpen} onOpenChange={setIsInputOpen}>
                <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted/50">
                  <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Input
                  </span>
                  <div className="flex items-center gap-1">
                    <CopyButton text={inputText} label="Copy input" className="size-5" />
                    <ChevronDownIcon
                      className={cn(
                        'size-3 text-muted-foreground transition-transform duration-200',
                        isInputOpen && 'rotate-180',
                      )}
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-3 pb-3">
                    <ScrollArea
                      className="rounded-md bg-muted/50"
                      style={{ maxHeight: MAX_CONTENT_HEIGHT }}
                    >
                      <CodeBlock code={inputText} language="json" />
                    </ScrollArea>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Output Section */}
            {hasOutput && (
              <Collapsible open={isOutputOpen} onOpenChange={setIsOutputOpen}>
                <CollapsibleTrigger
                  className={cn(
                    'flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted/50',
                    inputData && 'border-t',
                  )}
                >
                  <span
                    className={cn(
                      'font-medium text-xs uppercase tracking-wide',
                      isError ? 'text-destructive' : 'text-muted-foreground',
                    )}
                  >
                    {isError ? 'Error' : 'Output'}
                  </span>
                  <div className="flex items-center gap-1">
                    {(outputText || errorText) && (
                      <CopyButton
                        text={outputText || errorText || ''}
                        label="Copy output"
                        className="size-5"
                      />
                    )}
                    <ChevronDownIcon
                      className={cn(
                        'size-3 text-muted-foreground transition-transform duration-200',
                        isOutputOpen && 'rotate-180',
                      )}
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-3 pb-3">
                    <ScrollArea
                      className={cn('rounded-md', isError ? 'bg-destructive/10' : 'bg-muted/50')}
                      style={{ maxHeight: MAX_CONTENT_HEIGHT }}
                    >
                      {errorText && <div className="p-2 text-destructive text-sm">{errorText}</div>}
                      {outputRaw && <CodeBlock code={outputText} language={outputLang} />}
                    </ScrollArea>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Loading state when no output yet */}
            {!hasOutput && (status === 'pending' || status === 'running') && (
              <div className="flex items-center gap-2 px-3 py-3 text-muted-foreground text-sm">
                <ClockIcon className="size-3 animate-pulse" />
                <span>Waiting for result...</span>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

// Legacy exports for backward compatibility
export type ToolProps = ComponentProps<typeof Collapsible>
export const Tool = ({ className, ...props }: ToolProps) => (
  <Collapsible className={cn('not-prose mb-4 w-full rounded-md border', className)} {...props} />
)

export type ToolHeaderProps = {
  title?: string
  type: string
  status: ToolStatus
  className?: string
}

export const ToolHeader = ({ className, title, type, status }: ToolHeaderProps) => (
  <CollapsibleTrigger
    className={cn('flex w-full items-center justify-between gap-4 p-3', className)}
  >
    <div className="flex items-center gap-2">
      <WrenchIcon className="size-4 text-muted-foreground" />
      <span className="font-medium text-sm">{title ?? type}</span>
      <StatusIndicator status={status} />
    </div>
    <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
  </CollapsibleTrigger>
)

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>
export const ToolContent = ({ className, ...props }: ToolContentProps) => (
  <CollapsibleContent
    className={cn(
      'data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in',
      className,
    )}
    {...props}
  />
)

export type ToolInputProps = ComponentProps<'div'> & {
  input: Record<string, unknown>
}

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => (
  <div className={cn('space-y-2 overflow-hidden p-4', className)} {...props}>
    <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
      Parameters
    </h4>
    <div className="rounded-md bg-muted/50">
      <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
    </div>
  </div>
)

export type ToolOutputProps = ComponentProps<'div'> & {
  output?: string | ReactNode
  errorText?: string
}

export const ToolOutput = ({ className, output, errorText, ...props }: ToolOutputProps) => {
  if (!(output || errorText)) {
    return null
  }

  let Output: ReactNode = null

  if (typeof output === 'object' && isValidElement(output)) {
    Output = output
  } else if (typeof output === 'string') {
    const { text, language } = formatOutput(output)
    Output = <CodeBlock code={text} language={language} />
  }

  return (
    <div className={cn('space-y-2 p-4', className)} {...props}>
      <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {errorText ? 'Error' : 'Result'}
      </h4>
      <div
        className={cn(
          'overflow-x-auto rounded-md text-xs [&_table]:w-full',
          errorText ? 'bg-destructive/10 text-destructive' : 'bg-muted/50 text-foreground',
        )}
      >
        {errorText && <div className="p-2">{errorText}</div>}
        {Output}
      </div>
    </div>
  )
}
