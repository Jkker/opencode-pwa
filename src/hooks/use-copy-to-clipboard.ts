import { useState } from 'react'
import { toast } from 'sonner'

export function useCopyToClipboard() {
  const [text, setText] = useState<string>()

  const copy = async (
    text: string,
    { timeout = 2_000, withToast = false }: { timeout?: number; withToast?: boolean } = {},
  ) => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard not supported')
      return false
    }

    try {
      await navigator.clipboard.writeText(text)
      setText(text)

      if (timeout) {
        setTimeout(() => {
          setText(undefined)
        }, timeout)
      }

      if (withToast) {
        toast.success('Copied to clipboard')
      }

      return true
    } catch (error) {
      console.warn('Copy failed', error)
      setText(undefined)
      return false
    }
  }

  return { text, copy, isCopied: !!text }
}
