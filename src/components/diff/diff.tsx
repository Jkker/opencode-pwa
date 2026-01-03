'use client'

import type { DiffLineAnnotation, FileContents, BaseDiffOptions } from '@pierre/diffs/react'
import type { CSSProperties, ReactNode } from 'react'

import { MultiFileDiff } from '@pierre/diffs/react'

import { createDefaultOptions, styleVariables, type DiffStyle } from '@/lib/pierre'
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
  renderAnnotation?: (annotation: DiffLineAnnotation<T>) => ReactNode
  /** Additional class name */
  className?: string
  /** Additional inline styles */
  style?: CSSProperties
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
export function Diff<T = undefined>({
  before,
  after,
  diffStyle = 'unified',
  options,
  annotations,
  renderAnnotation,
  className,
  style,
  prerenderedHTML,
}: DiffProps<T>) {
  // Build options compatible with FileDiffOptions
  const diffOptions = {
    ...createDefaultOptions(diffStyle),
    ...options,
    // Exclude hunkSeparators to avoid type conflicts
    hunkSeparators: undefined,
  }

  return (
    <div
      data-component="diff"
      className={cn('overflow-auto', className)}
      style={{ ...styleVariables, ...style }}
    >
      <MultiFileDiff<T>
        oldFile={before}
        newFile={after}
        options={diffOptions}
        lineAnnotations={annotations}
        renderAnnotation={renderAnnotation}
        prerenderedHTML={prerenderedHTML}
      />
    </div>
  )
}

export type { DiffStyle }
