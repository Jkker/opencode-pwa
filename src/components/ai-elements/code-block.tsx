'use client'

import type { FileOptions, SupportedLanguages } from '@pierre/diffs/react'
import type { HTMLAttributes } from 'react'

import { File } from '@pierre/diffs/react'
import { createContext, useContext } from 'react'

import { CopyButton, type CopyButtonProps } from '@/components/ui/button'
import { createDefaultOptions, styleVariables } from '@/lib/pierre'
import { cn } from '@/lib/utils'

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string
  language: string
  showLineNumbers?: boolean
}

type CodeBlockContextType = {
  code: string
}

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: '',
})

export const CodeBlock = ({
  code,
  language,
  showLineNumbers = false,
  className,
  children,
  ...props
}: CodeBlockProps) => {
  const options: Partial<FileOptions<undefined>> = {
    ...createDefaultOptions('unified'),
    disableLineNumbers: !showLineNumbers,
    disableFileHeader: true,
  }

  // Use provided language or fallback to text
  const lang = (language || 'text') as SupportedLanguages

  return (
    <CodeBlockContext.Provider value={{ code }}>
      <div
        className={cn(
          'group relative w-full overflow-hidden rounded-md border bg-background text-foreground',
          className,
        )}
        {...props}
      >
        <div className="relative">
          <div
            data-component="code-block"
            className="overflow-auto [&_pre]:m-0 [&_pre]:!bg-background [&_pre]:p-4 [&_pre]:!text-foreground [&_pre]:text-sm [&_code]:font-mono [&_code]:text-sm"
            style={styleVariables}
          >
            <File file={{ name: 'code', contents: code, lang }} options={options} />
          </div>
          {children && (
            <div className="absolute top-2 right-2 flex items-center gap-2">{children}</div>
          )}
        </div>
      </div>
    </CodeBlockContext.Provider>
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
