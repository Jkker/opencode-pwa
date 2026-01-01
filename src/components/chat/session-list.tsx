import { Link, useParams } from '@tanstack/react-router'
import { Plus, MessageSquare, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/opencode'
import type { Session } from '@/lib/opencode'

interface SessionListProps {
  className?: string
  onSessionCreate?: (session: Session) => void
}

/**
 * Session list component for the sidebar.
 * Shows all sessions with ability to create, select, and delete.
 */
export function SessionList({ className, onSessionCreate }: SessionListProps) {
  const { sessions, createSession, deleteSession } = useSession()
  const params = useParams({ strict: false })
  const currentSessionId = params.sessionId as string | undefined

  const handleCreateSession = async () => {
    const session = await createSession()
    if (session) {
      onSessionCreate?.(session)
    }
  }

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault()
    e.stopPropagation()
    await deleteSession(sessionId)
  }

  // Sort sessions by most recent first
  const sortedSessions = sessions.toSorted((a, b) => {
    const aTime = a.time.updated ?? a.time.created
    const bTime = b.time.updated ?? b.time.created
    return bTime - aTime
  })

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-medium text-muted-foreground">Sessions</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => void handleCreateSession()}
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">New session</span>
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        {sortedSessions.length === 0 ? (
          <p className="text-sm text-muted-foreground px-2 py-4 text-center">
            No sessions yet
          </p>
        ) : (
          sortedSessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={session.id === currentSessionId}
              onDelete={(e) => void handleDeleteSession(e, session.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface SessionItemProps {
  session: Session
  isActive: boolean
  onDelete: (e: React.MouseEvent) => void
}

function SessionItem({ session, isActive, onDelete }: SessionItemProps) {
  // Format relative time
  const timeAgo = formatRelativeTime(session.time.updated ?? session.time.created)

  // Get first message preview or default text
  const title = session.title ?? 'New conversation'

  return (
    <Link
      to="/chat/$sessionId"
      params={{ sessionId: session.id }}
      className={cn(
        'group flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors',
        'hover:bg-muted/50',
        isActive && 'bg-muted'
      )}
    >
      <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{timeAgo}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onDelete}
      >
        <Trash2 className="h-3 w-3" />
        <span className="sr-only">Delete session</span>
      </Button>
    </Link>
  )
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}
