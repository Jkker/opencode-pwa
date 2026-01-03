'use client'

import type { BaseDiffOptions } from '@pierre/diffs/react'
import type { ComponentProps, ReactNode } from 'react'

import { ChevronDown, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

import { FileIcon } from '../icon/file-icon'
import { Diff, type DiffStyle } from './diff'
import { DiffChanges } from './diff-changes'

/** Get directory path from file path */
function getDirectory(path: string): string {
  const parts = path.split('/')
  return parts.length > 1 ? parts.slice(0, -1).join('/') + '/' : ''
}

/** Get filename from file path */
function getFilename(path: string): string {
  return path.split('/').at(-1) ?? path
}

export interface FileDiffData {
  file: string
  before: string
  after: string
  additions: number
  deletions: number
}

export interface SessionReviewProps extends ComponentProps<'div'> {
  /** Array of file diffs to display */
  diffs: FileDiffData[]
  /** Diff display style: 'unified' or 'split' */
  diffStyle?: DiffStyle
  /** Callback when diff style changes */
  onDiffStyleChange?: (style: DiffStyle) => void
  /** Open file paths (controlled) */
  open?: string[]
  /** Callback when open files change */
  onOpenChange?: (open: string[]) => void
  /** Actions to display in the header */
  actions?: ReactNode
  /** Additional options for diff components */
  diffOptions?: Partial<BaseDiffOptions>
}

/**
 * SessionReview component for reviewing all file changes in a session.
 * Features collapsible accordions for each file with unified/split view toggle.
 *
 * @example
 * ```tsx
 * <SessionReview
 *   diffs={diffs}
 *   diffStyle="unified"
 *   onDiffStyleChange={setDiffStyle}
 * />
 * ```
 */
export function SessionReview({
  diffs,
  diffStyle: controlledDiffStyle,
  onDiffStyleChange,
  open: controlledOpen,
  onOpenChange,
  actions,
  diffOptions,
  className,
  ...props
}: SessionReviewProps) {
  // Internal state for uncontrolled mode
  const [internalDiffStyle, setInternalDiffStyle] = useState<DiffStyle>('unified')
  const [internalOpen, setInternalOpen] = useState<string[]>(() =>
    diffs.length > 10 ? [] : diffs.map((d) => d.file),
  )

  const diffStyle = controlledDiffStyle ?? internalDiffStyle
  const openFiles = controlledOpen ?? internalOpen

  const handleDiffStyleChange = (style: DiffStyle) => {
    onDiffStyleChange?.(style)
    if (controlledDiffStyle === undefined) {
      setInternalDiffStyle(style)
    }
  }

  const handleOpenChange = (files: string[]) => {
    onOpenChange?.(files)
    if (controlledOpen === undefined) {
      setInternalOpen(files)
    }
  }

  const handleExpandCollapseAll = () => {
    const next = openFiles.length > 0 ? [] : diffs.map((d) => d.file)
    handleOpenChange(next)
  }

  const toggleFile = (file: string) => {
    const isOpen = openFiles.includes(file)
    const next = isOpen ? openFiles.filter((f) => f !== file) : [...openFiles, file]
    handleOpenChange(next)
  }

  return (
    <div
      data-component="session-review"
      className={cn('flex h-full flex-col overflow-hidden', className)}
      {...props}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b bg-background px-3 py-2">
        <span className="text-sm font-medium">Session changes</span>
        <div className="flex items-center gap-3">
          {onDiffStyleChange && (
            <div className="flex rounded-md border">
              <Button
                variant={diffStyle === 'unified' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleDiffStyleChange('unified')}
                className="rounded-r-none border-0 text-xs"
              >
                Unified
              </Button>
              <Button
                variant={diffStyle === 'split' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => handleDiffStyleChange('split')}
                className="rounded-l-none border-0 text-xs"
              >
                Split
              </Button>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={handleExpandCollapseAll} className="gap-1.5">
            <ChevronsUpDown className="size-3.5" />
            {openFiles.length > 0 ? 'Collapse all' : 'Expand all'}
          </Button>
          {actions}
        </div>
      </div>

      {/* File List */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col">
          {diffs.map((diff) => {
            const isOpen = openFiles.includes(diff.file)

            return (
              <Collapsible key={diff.file} open={isOpen} onOpenChange={() => toggleFile(diff.file)}>
                {/* File Header */}
                <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 border-b bg-muted/30 px-3 py-2 text-left hover:bg-muted/50">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <FileIcon
                      node={{ path: diff.file, type: 'file' }}
                      className="size-4 shrink-0"
                    />
                    <div className="flex min-w-0 flex-1 items-baseline gap-0.5 text-sm">
                      {diff.file.includes('/') && (
                        <span className="truncate text-muted-foreground direction-rtl text-left">
                          {getDirectory(diff.file)}
                        </span>
                      )}
                      <span className="shrink-0 font-medium">{getFilename(diff.file)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <DiffChanges changes={diff} />
                    <ChevronDown
                      className={cn(
                        'size-4 text-muted-foreground transition-transform',
                        isOpen && 'rotate-180',
                      )}
                    />
                  </div>
                </CollapsibleTrigger>

                {/* File Diff Content */}
                <CollapsibleContent>
                  <div className="border-b">
                    <Diff
                      before={{ name: diff.file, contents: diff.before }}
                      after={{ name: diff.file, contents: diff.after }}
                      diffStyle={diffStyle}
                      options={diffOptions}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
