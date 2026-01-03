'use client'

import type { ComponentProps, ReactNode } from 'react'

import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  WrenchIcon,
  XCircleIcon,
} from 'lucide-react'
import { isValidElement, useState } from 'react'

import type { ToolPart, ToolState } from '@/lib/opencode'

import { Code } from '@/components/pierre'
import { CopyButton } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

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

function formatOutput(output: string): { text: string; language: string } {
  // Try to parse as JSON for pretty printing
  try {
    const parsed = JSON.parse(output)
    return { text: JSON.stringify(parsed, null, 2), language: 'json' }
  } catch {
    return { text: output, language: 'text' }
  }
}

export interface ToolCardProps extends ComponentProps<'div'> {
  /** Tool part from OpenCode SDK */
  tool: ToolPart
  /** Icon to display (defaults to WrenchIcon) */
  icon?: ReactNode
}

export function ToolCard({ className, tool, icon, ...props }: ToolCardProps) {
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
    : { text: '', language: 'text' }

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
        <div className="flex items-center gap-2 px-2 py-1.5">
          <CollapsibleTrigger
            className="flex flex-1 items-center gap-2 text-left min-w-0 select-none"
            nativeButton={false}
            render={<div />}
          >
            {icon && <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>}
            <StatusIndicator status={status} />
            <span className="flex-1 line-clamp-2 font-medium text-sm">{displayTitle}</span>
            {/* Actions - single copy button for all content */}
            <div className="flex items-center shrink-0">
              <CopyButton data={state} size="icon-xs" />
              {/* download button */}
            </div>
            <ChevronDownIcon
              className={cn(
                'size-4 text-muted-foreground transition-transform duration-200 shrink-0',
                isOpen && 'rotate-180',
              )}
            />
          </CollapsibleTrigger>
        </div>

        {/* Content */}
        <CollapsibleContent>
          <div className="border-t">
            {/* Input Section */}
            {inputData && (
              <Collapsible open={isInputOpen} onOpenChange={setIsInputOpen}>
                <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left hover:bg-muted/50">
                  <span className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                    Input
                  </span>
                  <ChevronDownIcon
                    className={cn(
                      'size-3 text-muted-foreground transition-transform duration-200',
                      isInputOpen && 'rotate-180',
                    )}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="max-h-64 overflow-auto px-2 pb-2">
                    <div className="rounded-md bg-muted/50">
                      <Code
                        file={{
                          name: 'input.json',
                          contents: inputText,
                        }}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Output Section */}
            {hasOutput && (
              <Collapsible open={isOutputOpen} onOpenChange={setIsOutputOpen}>
                <CollapsibleTrigger
                  className={cn(
                    'flex w-full items-center justify-between gap-2 px-2 py-1.5 text-left hover:bg-muted/50',
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
                  <ChevronDownIcon
                    className={cn(
                      'size-3 text-muted-foreground transition-transform duration-200',
                      isOutputOpen && 'rotate-180',
                    )}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="max-h-64 overflow-auto px-2 pb-2">
                    <div
                      className={cn('rounded-md', isError ? 'bg-destructive/10' : 'bg-muted/50')}
                    >
                      {errorText && <div className="p-2 text-destructive text-sm">{errorText}</div>}
                      {outputRaw && (
                        <Code
                          file={{
                            name: `output.${outputLang}`,
                            contents: outputText,
                          }}
                          className="text-xs"
                        />
                      )}
                    </div>
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
      <Code
        file={{
          name: 'input.json',
          contents: JSON.stringify(input, null, 2),
        }}
        className="text-xs"
      />
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
    Output = (
      <Code
        file={{
          name: `output.${language}`,
          contents: text,
        }}
        className="text-xs"
      />
    )
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
