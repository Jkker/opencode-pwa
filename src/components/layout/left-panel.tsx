'use client'

import { Link, useParams } from '@tanstack/react-router'
import {
  Search,
  Settings,
  MessageSquare,
  ChevronRight,
  Plus,
  Minus,
  Folder,
  FilterIcon,
  TreesIcon,
  FolderTree,
} from 'lucide-react'
import { useState } from 'react'

import type { Project, Session } from '@/lib/opencode'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useProjectsQuery,
  useSessionsQuery,
  useDiffQuery,
  useCreateSessionMutation,
} from '@/lib/opencode/queries'
import { cn } from '@/lib/utils'
import { projectStore } from '@/stores/project-store'

import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '../ui/input-group'

interface LeftPanelProps {
  onSettingsClick?: () => void
}

export function LeftPanel({ onSettingsClick }: LeftPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: projects, isLoading: projectsLoading } = useProjectsQuery()

  const filteredProjects = projects?.filter((p) => {
    if (!searchQuery) return true
    const name = p.name ?? p.worktree.split('/').at(-1) ?? ''
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="flex h-full flex-col overflow-y-auto p-2 gap-2">
      {/* Search Bar */}

      <InputGroup className="top-0 sticky acrylic">
        <InputGroupInput
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupAddon align="inline-end">
          <InputGroupButton className="rounded-full" size="icon-xs">
            <FolderTree />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      {/* Projects & Sessions */}
      {projectsLoading ? (
        <div className="space-y-2 p-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : filteredProjects?.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <Folder className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No projects found</p>
        </div>
      ) : (
        filteredProjects?.map((project) => <ProjectItem key={project.id} project={project} />)
      )}

      {/* Settings Button */}
      <div className="mt-auto border-t p-3">
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={onSettingsClick}>
          <Settings className="size-4" />
          <span>Settings</span>
        </Button>
      </div>
    </div>
  )
}

function ProjectItem({ project }: { project: Project }) {
  const { projectId, sessionId } = useParams({ strict: false })
  const { data: sessions, isLoading } = useSessionsQuery(project.worktree)
  const expandedProjects = projectStore.useValue('expandedProjects')
  const createSession = useCreateSessionMutation(project.worktree)

  const currentProjectId = projectId ? decodeURIComponent(projectId) : undefined
  const isCurrentProject = currentProjectId === project.worktree
  const isExpanded = expandedProjects?.[project.id] || isCurrentProject

  const name = project.name ?? project.worktree.split('/').at(-1) ?? project.worktree
  const sessionCount = sessions?.length ?? 0

  const sortedSessions =
    sessions
      ?.toSorted((a, b) => {
        const aTime = a.time.updated ?? a.time.created
        const bTime = b.time.updated ?? b.time.created
        return bTime - aTime
      })
      .slice(0, 10) ?? []

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={() => projectStore.actions.toggleProject(project.id)}
    >
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-muted',
          isCurrentProject && 'bg-muted',
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Folder className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{name}</span>
        </div>
        <div className="flex items-center gap-2">
          {sessionCount > 0 && (
            <span className="text-xs text-muted-foreground">{sessionCount}</span>
          )}
          <ChevronRight
            className={cn(
              'size-4 text-muted-foreground transition-transform',
              isExpanded && 'rotate-90',
            )}
          />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="ml-4 mt-1 space-y-0.5 border-l pl-2">
          {/* New Session Button */}
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-primary hover:bg-primary/10"
            onClick={() => createSession.mutate()}
            disabled={createSession.isPending}
          >
            <Plus className="size-3" />
            <span>{createSession.isPending ? 'Creating...' : 'New Session'}</span>
          </button>

          {isLoading ? (
            <>
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </>
          ) : (
            sortedSessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                projectId={project.worktree}
                isActive={sessionId === session.id}
              />
            ))
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

interface SessionItemProps {
  session: Session
  projectId: string
  isActive: boolean
}

function SessionItem({ session, projectId, isActive }: SessionItemProps) {
  const { data: diffs } = useDiffQuery(session.id)

  // Calculate diff stats
  const additions = diffs?.reduce((sum, d) => sum + d.additions, 0) ?? 0
  const deletions = diffs?.reduce((sum, d) => sum + d.deletions, 0) ?? 0

  return (
    <Link
      to="/project/$projectId/$sessionId"
      params={{
        projectId: encodeURIComponent(projectId),
        sessionId: session.id,
      }}
      className={cn(
        'flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted',
        isActive && 'bg-muted text-foreground',
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <MessageSquare className="size-3 shrink-0 text-muted-foreground" />
        <span className="truncate">{session.title || 'Untitled'}</span>
      </div>
      {(additions > 0 || deletions > 0) && (
        <div className="flex items-center gap-1 text-xs">
          {additions > 0 && (
            <span className="flex items-center gap-0.5 text-green-600">
              <Plus className="size-2.5" />
              {additions}
            </span>
          )}
          {deletions > 0 && (
            <span className="flex items-center gap-0.5 text-red-600">
              <Minus className="size-2.5" />
              {deletions}
            </span>
          )}
        </div>
      )}
    </Link>
  )
}
