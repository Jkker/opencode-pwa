import { type DiffLineAnnotation, FileDiff, type FileContents } from '@pierre/diffs'
import { type HTMLAttributes, useEffect, useRef } from 'react'

import { createDefaultOptions, styleVariables } from '@/lib/pierre'
import { getWorkerPool, type WorkerPoolStyle } from '@/lib/pierre/worker'
import { cn } from '@/lib/utils'

export interface DiffProps<T = object> extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  before: FileContents
  after: FileContents
  annotations?: DiffLineAnnotation<T>[]
  diffStyle?: WorkerPoolStyle
}

export function Diff<T = object>({
  before,
  after,
  annotations,
  diffStyle = 'unified',
  className,
  ...props
}: DiffProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const diffInstanceRef = useRef<FileDiff<T> | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const workerPool = getWorkerPool(diffStyle)
    const diffInstance = new FileDiff<T>(
      {
        ...createDefaultOptions<T>(diffStyle),
      },
      workerPool,
    )

    diffInstanceRef.current = diffInstance

    container.innerHTML = ''
    diffInstance.render({
      oldFile: before,
      newFile: after,
      lineAnnotations: annotations,
      containerWrapper: container,
    })

    return () => {
      diffInstance.cleanUp()
      diffInstanceRef.current = null
    }
  }, [before, after, annotations, diffStyle])

  return (
    <div
      ref={containerRef}
      data-component="diff"
      style={styleVariables}
      className={cn('overflow-auto', className)}
      {...props}
    />
  )
}
