import { type FileContents, File, type FileOptions, type LineAnnotation } from '@pierre/diffs'
import { type HTMLAttributes, useEffect, useRef } from 'react'

import { styleVariables } from '@/lib/pierre'
import { getWorkerPool } from '@/lib/pierre/worker'
import { cn } from '@/lib/utils'

export interface CodeProps<T = object> extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  file: FileContents
  annotations?: LineAnnotation<T>[]
  options?: Partial<FileOptions<T>>
}

export function Code<T = object>({
  file,
  annotations,
  options,
  className,
  ...props
}: CodeProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInstanceRef = useRef<File<T> | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const workerPool = getWorkerPool('unified')

    const defaultOptions: Partial<FileOptions<T>> = {
      theme: 'github-light-high-contrast',
      themeType: 'system',
      disableLineNumbers: false,
      overflow: 'wrap',
      disableFileHeader: true,
    }

    const fileInstance = new File<T>(
      {
        ...defaultOptions,
        ...options,
      },
      workerPool,
    )

    fileInstanceRef.current = fileInstance

    container.innerHTML = ''
    fileInstance.render({
      file,
      lineAnnotations: annotations,
      containerWrapper: container,
    })

    return () => {
      fileInstance.cleanUp()
      fileInstanceRef.current = null
    }
  }, [file, annotations, options])

  return (
    <div
      ref={containerRef}
      data-component="code"
      style={styleVariables}
      className={cn('overflow-auto', className)}
      {...props}
    />
  )
}
