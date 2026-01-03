'use client'

import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export interface DiffChangesProps extends ComponentProps<'div'> {
  /** Changes data (single or array) */
  changes: { additions: number; deletions: number } | { additions: number; deletions: number }[]
  /** Display variant */
  variant?: 'default' | 'bars'
}

/**
 * DiffChanges component for displaying diff statistics.
 * Shows additions/deletions as numbers or visual bars.
 */
export function DiffChanges({
  changes,
  variant = 'default',
  className,
  ...props
}: DiffChangesProps) {
  const additions = Array.isArray(changes)
    ? changes.reduce((acc, diff) => acc + (diff.additions ?? 0), 0)
    : changes.additions

  const deletions = Array.isArray(changes)
    ? changes.reduce((acc, diff) => acc + (diff.deletions ?? 0), 0)
    : changes.deletions

  const total = (additions ?? 0) + (deletions ?? 0)

  const blockCounts = () => {
    const TOTAL_BLOCKS = 5

    const adds = additions ?? 0
    const dels = deletions ?? 0

    if (adds === 0 && dels === 0) {
      return { added: 0, deleted: 0, neutral: TOTAL_BLOCKS }
    }

    const totalChanges = adds + dels

    if (totalChanges < 5) {
      const added = adds > 0 ? 1 : 0
      const deleted = dels > 0 ? 1 : 0
      const neutral = TOTAL_BLOCKS - added - deleted
      return { added, deleted, neutral }
    }

    const ratio = adds > dels ? adds / dels : dels / adds
    let BLOCKS_FOR_COLORS = TOTAL_BLOCKS

    if (totalChanges < 20) {
      BLOCKS_FOR_COLORS = TOTAL_BLOCKS - 1
    } else if (ratio < 4) {
      BLOCKS_FOR_COLORS = TOTAL_BLOCKS - 1
    }

    const percentAdded = adds / totalChanges
    const percentDeleted = dels / totalChanges

    const addedRaw = percentAdded * BLOCKS_FOR_COLORS
    const deletedRaw = percentDeleted * BLOCKS_FOR_COLORS

    let added = adds > 0 ? Math.max(1, Math.round(addedRaw)) : 0
    let deleted = dels > 0 ? Math.max(1, Math.round(deletedRaw)) : 0

    // Cap bars based on actual change magnitude
    if (adds > 0 && adds <= 5) added = Math.min(added, 1)
    if (adds > 5 && adds <= 10) added = Math.min(added, 2)
    if (dels > 0 && dels <= 5) deleted = Math.min(deleted, 1)
    if (dels > 5 && dels <= 10) deleted = Math.min(deleted, 2)

    let totalAllocated = added + deleted
    if (totalAllocated > BLOCKS_FOR_COLORS) {
      if (addedRaw > deletedRaw) {
        added = BLOCKS_FOR_COLORS - deleted
      } else {
        deleted = BLOCKS_FOR_COLORS - added
      }
      totalAllocated = added + deleted
    }

    const neutral = Math.max(0, TOTAL_BLOCKS - totalAllocated)

    return { added, deleted, neutral }
  }

  const counts = blockCounts()
  const visibleBlocks = [
    ...Array(counts.added).fill('text-green-500'),
    ...Array(counts.deleted).fill('text-red-500'),
    ...Array(counts.neutral).fill('text-muted-foreground/50'),
  ].slice(0, 5)

  if (variant === 'default' && total === 0) {
    return null
  }

  return (
    <div
      data-component="diff-changes"
      className={cn('flex items-center gap-1.5 text-xs', className)}
      {...props}
    >
      {variant === 'bars' ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 12" fill="none" className="h-3 w-4">
          <g>
            {visibleBlocks.map((color, i) => (
              <rect
                key={i}
                x={i * 4}
                width="2"
                height="12"
                rx="1"
                className={cn('fill-current', color)}
              />
            ))}
          </g>
        </svg>
      ) : (
        <>
          <span className="font-mono text-green-600 dark:text-green-400">+{additions}</span>
          <span className="font-mono text-red-600 dark:text-red-400">-{deletions}</span>
        </>
      )}
    </div>
  )
}
