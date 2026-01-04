import type { BaseDiffOptions } from '@pierre/diffs/react'

import { useTheme } from '@/hooks/use-theme'

export const useDiffsOptions = <T extends Partial<BaseDiffOptions>>(options: T) => {
  const { resolvedTheme } = useTheme()
  return {
    disableLineNumbers: false,
    overflow: 'wrap',
    diffStyle: options?.diffStyle ?? 'unified',
    diffIndicators: 'bars',
    disableBackground: false,
    expansionLineCount: 20,
    lineDiffType: options?.diffStyle === 'split' ? 'word-alt' : 'none',
    maxLineDiffLength: 1000,
    disableFileHeader: true,
    themeType: resolvedTheme === 'dark' ? 'dark' : 'light',
    ...options,
  }
}

export type DiffStyle = 'unified' | 'split'
