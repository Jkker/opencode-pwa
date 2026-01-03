'use client'

import { createOpencodeClient } from '@opencode-ai/sdk/v2/client'
import { useQueries } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import {
  Search,
  Settings,
  MessageSquare,
  ChevronRight,
  Plus,
  Minus,
  Folder,
  FolderTree,
  List,
} from 'lucide-react'
import 'temporal-polyfill/global'
import { useState } from 'react'

import type { Project, Session } from '@/lib/opencode'

import { Button, CopyButton } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useProjectsQuery,
  useSessionsQuery,
  useDiffQuery,
  useCreateSessionMutation,
  queryKeys,
} from '@/lib/opencode/queries'
import { formatRelativeTime } from '@/lib/temporal-utils'
import { cn } from '@/lib/utils'
import { projectStore } from '@/stores/project-store'
import { settingStore } from '@/stores/setting-store'

import { formatProjectName, formatSessionTitle } from '../../lib/opencode/utils'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '../ui/input-group'

interface LeftPanelProps {
  onSettingsClick?: () => void
}

interface SessionWithProject {
  session: Session
  project: Project
}

/** Groups adjacent sessions that belong to the same project */
function groupAdjacentByProject(items: SessionWithProject[]): SessionWithProject[][] {
  if (items.length === 0) return []

  const groups: SessionWithProject[][] = []
  let currentGroup: SessionWithProject[] = [items[0]]

  for (let i = 1; i < items.length; i++) {
    if (items[i].project.id === items[i - 1].project.id) {
      currentGroup.push(items[i])
    } else {
      groups.push(currentGroup)
      currentGroup = [items[i]]
    }
  }
  groups.push(currentGroup)

  return groups
}

/** Formats a unix timestamp (ms) as relative time from now */
function formatTimeAgo(timestamp: number): string {
  const sessionTime = Temporal.Instant.fromEpochMilliseconds(timestamp)
    .toZonedDateTimeISO(Temporal.Now.timeZoneId())
    .toPlainDateTime()
  return formatRelativeTime(sessionTime)
}

export function LeftPanel({ onSettingsClick }: LeftPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = settingStore.useState('projectListMode')
  const { data: projects, isLoading: projectsLoading } = useProjectsQuery()

  const filteredProjects = projects?.filter((p) => {
    if (!searchQuery) return true
    const name = p.name ?? p.worktree.split('/').at(-1) ?? ''
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="flex h-full flex-col overflow-y-auto p-2 gap-2 relative">
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
          <InputGroupButton
            className="rounded-full"
            size="icon-xs"
            onClick={() => setViewMode(viewMode === 'tree' ? 'flat' : 'tree')}
            title={viewMode === 'tree' ? 'Switch to flat view' : 'Switch to tree view'}
          >
            {viewMode === 'tree' ? <FolderTree /> : <List />}
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
      ) : viewMode === 'tree' ? (
        filteredProjects?.map((project) => <ProjectItem key={project.id} project={project} />)
      ) : (
        <FlatSessionList projects={filteredProjects ?? []} searchQuery={searchQuery} />
      )}
      <div className="flex-1 h-9 flex w-full" />
      {/* Settings Button */}
      <Button
        variant="secondary"
        size="lg"
        className="w-full justify-start fixed bottom-0 left-0 flex gap-2 rounded-none shadow-md"
        onClick={onSettingsClick}
      >
        <Settings />
        <span>Settings</span>
      </Button>
    </div>
  )
}

interface FlatSessionListProps {
  projects: Project[]
  searchQuery: string
}

function FlatSessionList({ projects, searchQuery }: FlatSessionListProps) {
  const { sessionId } = useParams({ strict: false })
  const url = settingStore.useValue('serverURL')

  // Fetch sessions for all projects in parallel
  const sessionQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: queryKeys.sessions(url, project.worktree),
      queryFn: async () => {
        const client = createOpencodeClient({
          baseUrl: url,
          directory: project.worktree,
          throwOnError: true,
        })
        const result = await client.session.list()
        return { project, sessions: result.data ?? [] }
      },
    })),
  })

  const isLoading = sessionQueries.some((q) => q.isLoading || !q.data?.sessions)

  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  // Flatten and sort all sessions (safe to access after loading check)
  const allSessions: SessionWithProject[] = sessionQueries
    .flatMap((q) => {
      if (!q.data) return []
      return q.data.sessions?.map((session) => ({
        session,
        project: q.data.project,
      }))
    })
    .filter(({ session }) => {
      if (!searchQuery) return true
      return session.title?.toLowerCase().includes(searchQuery.toLowerCase())
    })
    .toSorted((a, b) => {
      const aTime = a.session.time.updated ?? a.session.time.created
      const bTime = b.session.time.updated ?? b.session.time.created
      return bTime - aTime
    })

  const groupedSessions = groupAdjacentByProject(allSessions)

  if (allSessions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <MessageSquare className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No sessions found</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {groupedSessions.map((group) => {
        const { project } = group[0]

        return (
          <div key={`${project.id}-${group[0].session.id}`}>
            {/* Project header */}
            <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
              <Folder className="size-3" />
              <span className="truncate">{formatProjectName(project)}</span>
              <CopyButton data={project} iconOnly size="icon-xs" className="ml-auto" />
            </div>

            {/* Sessions in group */}
            <div className="space-y-0.5">
              {group.map(({ session }) => (
                <FlatSessionItem
                  key={session.id}
                  session={session}
                  projectId={project.worktree}
                  isActive={sessionId === session.id}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface FlatSessionItemProps {
  session: Session
  projectId: string
  isActive: boolean
}

function FlatSessionItem({ session, projectId, isActive }: FlatSessionItemProps) {
  const timestamp = session.time.updated ?? session.time.created
  const timeAgo = formatTimeAgo(timestamp)

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
        <span className="truncate">{formatSessionTitle(session)}</span>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">{timeAgo}</span>
    </Link>
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

  const sessionCount = sessions?.length ?? 0

  console.log(`🚀 ~ ProjectItem ~ sessions:`, sessions)
  if (!sessions?.toSorted) return null

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
          <span className="truncate">{formatProjectName(project)}</span>
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
        <span className="truncate">{formatSessionTitle(session)}</span>
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
