'use client'

import type { FileContents, FileOptions, LineAnnotation } from '@pierre/diffs/react'

import { File } from '@pierre/diffs/react'

import { useDiffsOptions } from '@/lib/pierre'
import { cn } from '@/lib/utils'

export interface CodeProps<T = undefined> {
  /** File contents to display */
  file: FileContents
  /** Additional options for the code component */
  options?: Partial<FileOptions<T>>
  /** Line annotations */
  annotations?: LineAnnotation<T>[]
  /** Render function for annotations */
  renderAnnotation?: (annotation: LineAnnotation<T>) => React.ReactNode
  /** Additional class name */
  className?: string
  /** Prerendered HTML for SSR hydration */
  prerenderedHTML?: string
}

/**
 * Code component for displaying syntax-highlighted code.
 * Uses @pierre/diffs/react for high-performance code rendering.
 *
 * @example
 * ```tsx
 * <Code
 *   file={{ name: 'file.ts', contents: 'const x = 1;' }}
 * />
 * ```
 */
export const Code = <T = undefined>({
  file,
  options,
  annotations,
  renderAnnotation,
  className,
  prerenderedHTML,
}: CodeProps<T>) => (
  <File<T>
    className={cn('overflow-auto', className)}
    file={file}
    options={useDiffsOptions({ ...options })}
    lineAnnotations={annotations}
    renderAnnotation={renderAnnotation}
    prerenderedHTML={prerenderedHTML}
  />
)
