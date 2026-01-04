'use client'

import type { FileOptions, SupportedLanguages } from '@pierre/diffs/react'
import type { HTMLAttributes } from 'react'

import { File } from '@pierre/diffs/react'
import { createContext, useContext } from 'react'

import { CopyButton, type CopyButtonProps } from '@/components/ui/button'
import { useDiffsOptions } from '@/lib/pierre'
import { cn } from '@/lib/utils'

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string
  language: SupportedLanguages
  showLineNumbers?: boolean
}

const CodeBlockContext = createContext({ code: '' })

export const CodeBlock = ({
  code,
  language = 'text',
  showLineNumbers = false,
  className,
  children,
  ...props
}: CodeBlockProps) => {
  const options = useDiffsOptions<FileOptions<undefined>>({
    disableLineNumbers: !showLineNumbers,
    disableFileHeader: true,
  })

  return (
    <CodeBlockContext value={{ code }}>
      <div
        className={cn('group relative w-full overflow-hidden rounded-md bg-input', className)}
        {...props}
      >
        <File file={{ name: 'code', contents: code, lang: language }} options={options} />
        {children && (
          <div className="absolute top-2 right-2 flex items-center gap-2">{children}</div>
        )}
      </div>
    </CodeBlockContext>
  )
}

export type CodeBlockCopyButtonProps = Omit<CopyButtonProps, 'data'> & {
  onCopy?: () => void
  onError?: (error: Error) => void
}

/** Copy button that reads code from CodeBlock context */
export const CodeBlockCopyButton = ({
  onCopy,
  onError,
  className,
  ...props
}: CodeBlockCopyButtonProps) => {
  const { code } = useContext(CodeBlockContext)

  return (
    <CopyButton
      data={code}
      label={null}
      size="icon"
      className={cn('shrink-0', className)}
      onCopySuccess={onCopy}
      onCopyError={onError}
      {...props}
    />
  )
}
