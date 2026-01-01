import { createFileRoute } from '@tanstack/react-router'
import { ChatView } from '@/components/chat'

export const Route = createFileRoute('/chat/')({
  component: ChatIndexPage,
})

function ChatIndexPage() {
  return <ChatView className="h-[calc(100vh-var(--header-height))]" />
}
