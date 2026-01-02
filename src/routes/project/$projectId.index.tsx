// Session list / new session route.
// Shows when navigating to /project/:projectId/session without a session ID.
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { MessageSquare, Plus, Loader2 } from 'lucide-react'

import type { Session } from '@/lib/opencode'

import { HolyGrailLayout } from '@/components/layout/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useSessionsQuery, useCreateSessionMutation } from '@/lib/opencode/queries'
import { formatRelativeTime } from '@/lib/temporal-utils'

export const Route = createFileRoute('/project/$projectId/')({
  component: SessionIndexPage,
})

function SessionIndexPage() {
  const { projectId } = Route.useParams()
  const navigate = useNavigate()
  const directory = decodeURIComponent(projectId)

  const { data: sessions, isLoading } = useSessionsQuery(directory)
  const createSession = useCreateSessionMutation(directory)

  const handleNewSession = async () => {
    const session = await createSession.mutateAsync()
    if (session) {
      await navigate({
        to: '/project/$projectId/$sessionId',
        params: { projectId, sessionId: session.id },
      })
    }
  }

  // Maximum number of recent sessions to display
  const MAX_RECENT_SESSIONS = 20

  const sortedSessions = sessions
    ?.toSorted((a, b) => (b.time.updated ?? b.time.created) - (a.time.updated ?? a.time.created))
    .slice(0, MAX_RECENT_SESSIONS)

  const projectName = directory.split('/').at(-1) ?? directory

  return (
    <HolyGrailLayout
      header={<span className="font-semibold">{projectName}</span>}
      directory={directory}
      showPrompt={false}
    >
      <div className="flex h-full flex-col items-center justify-center p-4">
        <div className="mx-auto w-full max-w-2xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold">{projectName}</h1>
            <p className="text-muted-foreground">Start a new session or continue an existing one</p>
          </div>

          {/* New Session Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleNewSession}
              disabled={createSession.isPending}
              className="gap-2"
            >
              {createSession.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              New Session
            </Button>
          </div>

          {/* Sessions List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Sessions</CardTitle>
              <CardDescription>Continue where you left off</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : sortedSessions?.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <MessageSquare className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No sessions yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {sortedSessions?.map((session) => (
                    <SessionRow key={session.id} session={session} projectId={projectId} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </HolyGrailLayout>
  )
}

function SessionRow({ session, projectId }: { session: Session; projectId: string }) {
  const navigate = useNavigate()
  const timestamp = session.time.updated ?? session.time.created
  const relativeTime = formatRelativeTime(
    Temporal.Instant.fromEpochMilliseconds(timestamp)
      .toZonedDateTimeISO(Temporal.Now.timeZoneId())
      .toPlainDateTime(),
  )

  const handleClick = () =>
    navigate({
      to: '/project/$projectId/$sessionId',
      params: { projectId, sessionId: session.id },
    })

  return (
    <button
      onClick={handleClick}
      className="flex w-full items-center justify-between rounded-md p-3 text-left hover:bg-muted transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate font-medium">{session.title}</p>
          {session.summary && (
            <p className="truncate text-xs text-muted-foreground">
              {session.summary.files} file{session.summary.files !== 1 ? 's' : ''} changed
            </p>
          )}
        </div>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{relativeTime}</span>
    </button>
  )
}
