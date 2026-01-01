import { createFileRoute, Outlet } from '@tanstack/react-router'
import { MessageSquare } from 'lucide-react'
import { SessionProvider, useOpencodeStore } from '@/lib/opencode'

export const Route = createFileRoute('/chat')({
  staticData: {
    icon: MessageSquare,
    title: 'Chat',
  },
  component: ChatLayout,
})

function ChatLayout() {
  // Get current directory from store, default to '/'
  const directory = useOpencodeStore((state) => state.directory.current) ?? '/'

  return (
    <SessionProvider directory={directory}>
      <Outlet />
    </SessionProvider>
  )
}
