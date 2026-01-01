import { createFileRoute, Link } from '@tanstack/react-router'
import { Folder, Plus, Clock, Server } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useProjectsQuery, useHealthQuery } from '@/lib/opencode/queries'
import { cn } from '@/lib/utils'
import type { Project } from '@/lib/opencode'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { data: projects, isLoading: projectsLoading } = useProjectsQuery()
  const { data: health, isLoading: healthLoading } = useHealthQuery()

  const recentProjects = projects
    ?.toSorted((a, b) => (b.time.updated ?? b.time.created) - (a.time.updated ?? a.time.created))
    .slice(0, 5)

  return (
    <div className="flex h-full flex-col items-center justify-center p-4">
      <div className="mx-auto w-full max-w-lg space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <span className="text-3xl font-bold">O</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">OpenCode</h1>
        </div>

        {/* Server Status */}
        <div className="flex items-center justify-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <div
              className={cn(
                'size-2 rounded-full',
                healthLoading && 'bg-muted-foreground',
                health && 'bg-green-500',
                !healthLoading && !health && 'bg-destructive'
              )}
            />
            <Server className="size-4" />
            <span className="text-sm">
              {healthLoading ? 'Connecting...' : health ? 'Connected' : 'Disconnected'}
            </span>
          </Button>
        </div>

        {/* Recent Projects */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Projects</CardTitle>
              <Button variant="ghost" size="sm" className="gap-1">
                <Plus className="size-4" />
                <span>Open Project</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : recentProjects?.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <Folder className="size-8 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="font-medium">No recent projects</p>
                  <p className="text-sm text-muted-foreground">
                    Get started by opening a local project
                  </p>
                </div>
                <Button className="mt-2">
                  <Folder className="mr-2 size-4" />
                  Open Project
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {recentProjects?.map((project) => (
                  <ProjectRow key={project.id} project={project} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ProjectRow({ project }: { project: Project }) {
  const name = project.name ?? project.worktree.split('/').at(-1) ?? project.worktree
  const relativePath = project.worktree.replace(/^\/[^/]+\/[^/]+\//, '~/')
  const relativeTime = formatRelativeTime(project.time.updated ?? project.time.created)

  return (
    <Link
      to="/project/$projectId/session"
      params={{ projectId: encodeURIComponent(project.worktree) }}
      className="flex items-center justify-between rounded-md p-3 hover:bg-muted"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-8 items-center justify-center rounded bg-muted">
          <Folder className="size-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground font-mono">{relativePath}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 text-muted-foreground">
        <Clock className="size-3" />
        <span className="text-xs">{relativeTime}</span>
      </div>
    </Link>
  )
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(timestamp)
}
