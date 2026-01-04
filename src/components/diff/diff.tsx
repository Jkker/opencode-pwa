'use client'

import type { DiffLineAnnotation, FileContents, BaseDiffOptions } from '@pierre/diffs/react'

import { MultiFileDiff } from '@pierre/diffs/react'

import { useDiffsOptions, type DiffStyle } from '@/lib/pierre'
import { cn } from '@/lib/utils'

export interface DiffProps<T = undefined> {
  /** File contents before the change */
  before: FileContents
  /** File contents after the change */
  after: FileContents
  /** Diff display style: 'unified' or 'split' */
  diffStyle?: DiffStyle
  /** Additional options for the diff component */
  options?: Partial<BaseDiffOptions>
  /** Line annotations */
  annotations?: DiffLineAnnotation<T>[]
  /** Render function for annotations */
  renderAnnotation?: (annotation: DiffLineAnnotation<T>) => React.ReactNode
  /** Additional class name */
  className?: string
  /** Prerendered HTML for SSR hydration */
  prerenderedHTML?: string
}

/**
 * Diff component for displaying file differences.
 * Uses @pierre/diffs/react for high-performance diff rendering.
 *
 * @example
 * ```tsx
 * <Diff
 *   before={{ name: 'file.ts', contents: 'old content' }}
 *   after={{ name: 'file.ts', contents: 'new content' }}
 *   diffStyle="unified"
 * />
 * ```
 */
export const Diff = <T = undefined>({
  before,
  after,
  diffStyle = 'unified',
  options,
  annotations,
  renderAnnotation,
  className,
  prerenderedHTML,
}: DiffProps<T>) => (
  <MultiFileDiff<T>
    className={cn('overflow-auto', className)}
    oldFile={before}
    newFile={after}
    options={useDiffsOptions({
      ...options,
      diffStyle,
      // Exclude hunkSeparators to avoid type conflicts
      hunkSeparators: undefined,
    })}
    lineAnnotations={annotations}
    renderAnnotation={renderAnnotation}
    prerenderedHTML={prerenderedHTML}
  />
)

export type { DiffStyle }
