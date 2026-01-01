/**
 * Session sidebar component for OpenCode.
 * Shows projects and their sessions in a collapsible tree.
 */
import { Link, useParams } from '@tanstack/react-router'
import { Folder, MessageSquare, Plus, ChevronRight, Settings, Server } from 'lucide-react'

import type { Project, Session } from '@/lib/opencode'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useProjectsQuery, useSessionsQuery, useHealthQuery } from '@/lib/opencode/queries'
import { cn } from '@/lib/utils'

function getProjectName(project: Project): string {
  if (project.name) return project.name
  const parts = project.worktree.split('/')
  return parts.at(-1) ?? project.worktree
}

function getAvatarColor(projectId: string): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ]
  const hash = projectId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

interface ProjectItemProps {
  project: Project
}

function ProjectItem({ project }: ProjectItemProps) {
  const params = useParams({ strict: false })
  const { data: sessions, isLoading } = useSessionsQuery(project.worktree)

  const currentProjectId = params.projectId
  const currentSessionId = params.sessionId
  const isCurrentProject = currentProjectId === encodeURIComponent(project.worktree)
  const name = getProjectName(project)

  const sortedSessions =
    sessions
      ?.toSorted((a, b) => {
        const aTime = a.time.updated ?? a.time.created
        const bTime = b.time.updated ?? b.time.created
        return bTime - aTime
      })
      .slice(0, 10) ?? []

  return (
    <SidebarMenuItem>
      <button
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-sidebar-accent',
          isCurrentProject && 'bg-sidebar-accent',
        )}
      >
        <div className="flex items-center gap-2">
          <Avatar className={cn('size-5', getAvatarColor(project.id))}>
            <AvatarFallback className="text-xs text-white">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">{name}</span>
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
      </button>

      <SidebarMenuSub>
        <SidebarMenuSubItem>
          <Link
            to={`/project/${encodeURIComponent(project.worktree)}/session`}
            className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-primary hover:bg-primary/10"
          >
            <Plus className="size-3" />
            <span>New Session</span>
          </Link>
        </SidebarMenuSubItem>
        {isLoading ? (
          <>
            <SidebarMenuSubItem>
              <Skeleton className="h-6 w-full" />
            </SidebarMenuSubItem>
            <SidebarMenuSubItem>
              <Skeleton className="h-6 w-full" />
            </SidebarMenuSubItem>
          </>
        ) : (
          sortedSessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              projectId={project.worktree}
              isActive={currentSessionId === session.id}
            />
          ))
        )}
      </SidebarMenuSub>
    </SidebarMenuItem>
  )
}

interface SessionItemProps {
  session: Session
  projectId: string
  isActive: boolean
}

function SessionItem({ session, projectId, isActive }: SessionItemProps) {
  const relativeTime = formatRelativeTime(session.time.updated ?? session.time.created)

  return (
    <SidebarMenuSubItem>
      <Link
        to={`/project/${encodeURIComponent(projectId)}/session/${session.id}`}
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-sidebar-accent',
          isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
        )}
      >
        <MessageSquare className="size-3 shrink-0" />
        <span className="flex-1 truncate">{session.title}</span>
        <span className="text-xs text-muted-foreground">{relativeTime}</span>
      </Link>
    </SidebarMenuSubItem>
  )
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  return `${days}d`
}

function ServerStatus() {
  const { data: health, isLoading } = useHealthQuery()

  return (
    <Button variant="ghost" size="sm" className="gap-2">
      <div
        className={cn(
          'size-2 rounded-full',
          isLoading && 'bg-muted-foreground',
          health && 'bg-green-500',
          !isLoading && !health && 'bg-destructive',
        )}
      />
      <Server className="size-4" />
    </Button>
  )
}

interface SessionSidebarProps extends React.ComponentProps<typeof Sidebar> {}

export function SessionSidebar(props: SessionSidebarProps) {
  const { data: projects, isLoading } = useProjectsQuery()

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link to="/" className="flex items-center gap-3 px-2 py-1.5">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-lg font-bold">O</span>
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold">OpenCode</span>
                <span className="text-xs text-muted-foreground">AI Assistant</span>
              </div>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Projects</span>
            <Button variant="ghost" size="icon" className="size-6">
              <Plus className="size-4" />
            </Button>
          </SidebarGroupLabel>
          <SidebarMenu>
            {isLoading ? (
              <>
                <SidebarMenuItem>
                  <Skeleton className="h-8 w-full" />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <Skeleton className="h-8 w-full" />
                </SidebarMenuItem>
              </>
            ) : projects?.length === 0 ? (
              <SidebarMenuItem>
                <Link to="/" className="flex items-center gap-2 px-2 py-1.5 text-muted-foreground">
                  <Folder className="size-4" />
                  <span>Open a project</span>
                </Link>
              </SidebarMenuItem>
            ) : (
              projects?.map((project) => <ProjectItem key={project.id} project={project} />)
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <div className="flex items-center justify-between p-2">
          <ServerStatus />
          <Button variant="ghost" size="icon">
            <Settings className="size-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
