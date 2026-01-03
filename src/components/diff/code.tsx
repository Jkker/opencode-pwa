'use client'

import type { FileContents, FileOptions, LineAnnotation } from '@pierre/diffs/react'
import type { CSSProperties, ReactNode } from 'react'

import { File } from '@pierre/diffs/react'

import { createDefaultOptions, styleVariables } from '@/lib/pierre'
import { cn } from '@/lib/utils'

export interface CodeProps<T = undefined> {
  /** File contents to display */
  file: FileContents
  /** Additional options for the code component */
  options?: Partial<FileOptions<T>>
  /** Line annotations */
  annotations?: LineAnnotation<T>[]
  /** Render function for annotations */
  renderAnnotation?: (annotation: LineAnnotation<T>) => ReactNode
  /** Additional class name */
  className?: string
  /** Additional inline styles */
  style?: CSSProperties
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
export function Code<T = undefined>({
  file,
  options,
  annotations,
  renderAnnotation,
  className,
  style,
  prerenderedHTML,
}: CodeProps<T>) {
  const mergedOptions = {
    ...createDefaultOptions('unified'),
    ...options,
  }

  return (
    <div
      data-component="code"
      className={cn('overflow-auto', className)}
      style={{ ...styleVariables, ...style }}
    >
      <File<T>
        file={file}
        options={mergedOptions}
        lineAnnotations={annotations}
        renderAnnotation={renderAnnotation}
        prerenderedHTML={prerenderedHTML}
      />
    </div>
  )
}
