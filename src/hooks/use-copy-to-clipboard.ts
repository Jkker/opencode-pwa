import { useState } from 'react'
import { toast } from 'sonner'

interface CopyOptions {
  timeout?: number
  silent?: boolean
}

export function useCopyToClipboard() {
  const [isCopied, setIsCopied] = useState(false)

  const copy = async (text: string, { timeout = 2_000, silent = false }: CopyOptions = {}) => {
    if (!navigator?.clipboard) {
      if (!silent) toast.error('Clipboard not supported')
      return false
    }

    try {
      await navigator.clipboard.writeText(text)
      setIsCopied(true)
      if (!silent) toast.success('Copied')

      if (timeout) {
        setTimeout(() => setIsCopied(false), timeout)
      }

      return true
    } catch (error) {
      console.warn('Copy failed', error)
      if (!silent) toast.error('Copy failed')
      setIsCopied(false)
      return false
    }
  }

  return { copy, isCopied }
}
