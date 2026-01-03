import type { BaseDiffOptions } from '@pierre/diffs/react'
import type { CSSProperties } from 'react'

/**
 * Default options for @pierre/diffs components.
 * Ported from opencode's SolidJS implementation.
 */
export function createDefaultOptions(
  style: BaseDiffOptions['diffStyle'],
): Partial<BaseDiffOptions> {
  return {
    theme: {
      light: 'one-light',
      dark: 'one-dark-pro',
    },
    themeType: 'system',
    disableLineNumbers: false,
    overflow: 'wrap',
    diffStyle: style ?? 'unified',
    diffIndicators: 'bars',
    disableBackground: false,
    expansionLineCount: 20,
    lineDiffType: style === 'split' ? 'word-alt' : 'none',
    maxLineDiffLength: 1000,
    disableFileHeader: true,
  } as const
}

/**
 * CSS custom properties for @pierre/diffs styling.
 */
export const styleVariables: CSSProperties = {
  ['--diffs-font-family' as string]:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  ['--diffs-font-size' as string]: '13px',
  ['--diffs-line-height' as string]: '24px',
  ['--diffs-tab-size' as string]: '2',
  ['--diffs-gap-block' as string]: '0',
  ['--diffs-min-number-column-width' as string]: '4ch',
}

export type DiffStyle = 'unified' | 'split'
