'use client'

import { createContext, type HTMLAttributes, useContext, useEffect, useRef, useState } from 'react'
import { type BundledLanguage } from 'shiki'

import { CopyButton, type CopyButtonProps } from '@/components/ui/button'
import { highlightCode } from '@/lib/shiki'
import { cn } from '@/lib/utils'

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string
  language: BundledLanguage
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
  const [html, setHtml] = useState<string>('')
  const [darkHtml, setDarkHtml] = useState<string>('')
  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = false
    void highlightCode(code, language, showLineNumbers).then(([light, dark]) => {
      if (!mounted.current) {
        setHtml(light)
        setDarkHtml(dark)
        mounted.current = true
      }
      return null
    })

    return () => {
      mounted.current = true // Use true to signal unmounted in this logic
    }
  }, [code, language, showLineNumbers])

  // Reset mounted on unmount
  useEffect(() => {
    mounted.current = false
    return () => {
      mounted.current = true
    }
  }, [])

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
            className="overflow-auto dark:hidden [&>pre]:m-0 [&>pre]:bg-background! [&>pre]:p-4 [&>pre]:text-foreground! [&>pre]:text-sm [&_code]:font-mono [&_code]:text-sm"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <div
            className="hidden overflow-auto dark:block [&>pre]:m-0 [&>pre]:bg-background! [&>pre]:p-4 [&>pre]:text-foreground! [&>pre]:text-sm [&_code]:font-mono [&_code]:text-sm"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: "this is needed."
            dangerouslySetInnerHTML={{ __html: darkHtml }}
          />
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
