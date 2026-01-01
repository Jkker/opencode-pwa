import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Thread } from './thread'
import { Composer } from './composer'
import { useSession } from '@/lib/opencode'

interface ChatViewProps {
  className?: string
}

/**
 * Main chat view component that combines thread and composer.
 * Mobile-first responsive design.
 */
export function ChatView({ className }: ChatViewProps) {
  const { messages, parts, status, sendMessage, abort } = useSession()
  const [inputValue, setInputValue] = useState('')
  const isWorking = status.type !== 'idle'

  const handleSubmit = async () => {
    if (!inputValue.trim()) return

    const text = inputValue
    setInputValue('')

    await sendMessage(text)
  }

  const handleCancel = async () => {
    await abort()
  }

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      <Thread
        messages={messages}
        parts={parts}
        status={status}
      />
      <Composer
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isWorking}
      />
    </div>
  )
}
