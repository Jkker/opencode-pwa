import { createOpencodeClient } from '@opencode-ai/sdk/v2/client'
import { Link, useParams } from '@tanstack/react-router'
import {
  Folder,
  MessageSquare,
  Plus,
  ChevronRight,
  Settings,
  Server,
  Plug,
  Circle,
} from 'lucide-react'
import { useState } from 'react'

import type { Project } from '@/lib/opencode'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  useProjectsQuery,
  useSessionsQuery,
  useHealthQuery,
  useMcpStatusQuery,
} from '@/lib/opencode/queries'
import { cn } from '@/lib/utils'
import { projectStore } from '@/stores/project-store'
import { settingStore } from '@/stores/setting-store'

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
  const { projectId } = useParams({ strict: false })
  const { data: sessions, isLoading } = useSessionsQuery(project.worktree)
  const { data: mcpStatus } = useMcpStatusQuery(project.worktree)
  const expandedProjects = projectStore.useValue('expandedProjects')
  const isMobile = useIsMobile()

  const isCurrentProject = projectId === project.worktree
  const isExpanded = expandedProjects && (expandedProjects[project.id] || isCurrentProject)
  const name = getProjectName(project)

  // Parse MCP status - handle both array and object responses
  const mcpArray = Array.isArray(mcpStatus) ? mcpStatus : []
  const mcpConnected = mcpArray.filter((s: { status?: string }) => s.status === 'connected').length
  const mcpTotal = mcpArray.length

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
      <SidebarMenuItem>
        <CollapsibleTrigger
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-md px-2 text-sm font-medium hover:bg-sidebar-accent active:bg-sidebar-accent/80',
            // Larger touch targets on mobile
            isMobile ? 'py-3' : 'py-1.5',
            isCurrentProject && 'bg-sidebar-accent',
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className={cn('size-5 shrink-0', getAvatarColor(project.id))}>
              <AvatarFallback className="text-xs">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="truncate">{name}</span>
          </div>
          <div className="flex items-center gap-1">
            {/* MCP status indicator */}
            {mcpTotal > 0 && (
              <Tooltip>
                <TooltipTrigger
                  className="flex items-center gap-0.5 text-xs text-muted-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Plug className="size-3" />
                  <span>
                    {mcpConnected}/{mcpTotal}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {mcpConnected} of {mcpTotal} MCP servers connected
                </TooltipContent>
              </Tooltip>
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
          <SidebarMenuSub>
            <SidebarMenuSubItem>
              <Link
                to="/project/$projectId"
                params={{ projectId: project.worktree }}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2 text-sm text-primary hover:bg-primary/10 active:bg-primary/20',
                  isMobile ? 'py-2.5' : 'py-1.5',
                )}
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
                <SidebarMenuSubItem key={session.id}>
                  <Link
                    to={`/project/${encodeURIComponent(project.worktree)}/${session.id}`}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-2 text-sm hover:bg-sidebar-accent active:bg-sidebar-accent/80',
                      isMobile ? 'py-2.5' : 'py-1.5',
                    )}
                    activeProps={{
                      className: 'bg-sidebar-accent text-sidebar-accent-foreground',
                    }}
                  >
                    <MessageSquare className="size-3 shrink-0" />
                    <span className="flex-1 truncate">{session.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(session.time.updated ?? session.time.created)}
                    </span>
                  </Link>
                </SidebarMenuSubItem>
              ))
            )}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
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

function ServerStatus({ onClick }: { onClick?: () => void }) {
  const { data: health, isLoading } = useHealthQuery()
  const isMobile = useIsMobile()

  const status = isLoading ? 'loading' : health ? 'connected' : 'disconnected'

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size={isMobile ? 'default' : 'sm'}
            className="gap-2"
            onClick={onClick}
          >
            <Circle
              className={cn(
                'size-2',
                status === 'loading' && 'fill-muted-foreground text-muted-foreground',
                status === 'connected' && 'fill-green-500 text-green-500',
                status === 'disconnected' && 'fill-destructive text-destructive',
              )}
            />
            <Server className="size-4" />
          </Button>
        }
      />
      <TooltipContent>
        {status === 'loading' && 'Checking server...'}
        {status === 'connected' && 'Server connected'}
        {status === 'disconnected' && 'Server disconnected'}
      </TooltipContent>
    </Tooltip>
  )
}

// Server settings drawer - mobile optimized with Vaul
function ServerSettingsDrawer({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const url = settingStore.useValue('serverURL')
  const healthy = settingStore.useValue('healthy')
  const [inputUrl, setInputUrl] = useState(url)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<boolean | undefined>(undefined)

  const handleSave = () => {
    settingStore.actions.setServerURL(inputUrl)
    onOpenChange(false)
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(undefined)
    try {
      const client = createOpencodeClient({ baseUrl: inputUrl })
      const result = (await client.global.health()).data?.healthy ?? false
      setTestResult(result)
    } finally {
      setTesting(false)
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Server Connection</DrawerTitle>
          <DrawerDescription>Configure your OpenCode server connection.</DrawerDescription>
        </DrawerHeader>

        <div className="space-y-4 px-4">
          <div className="space-y-2">
            <Label htmlFor="server-url">Server URL</Label>
            <div className="flex gap-2">
              <Input
                id="server-url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="http://localhost:4096"
                className="h-11"
              />
              <Button
                variant="outline"
                size="icon"
                className="size-11 shrink-0"
                onClick={handleTest}
                disabled={testing}
              >
                <Server className={cn('size-4', testing && 'animate-pulse')} />
              </Button>
            </div>
            {testResult !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                <Circle
                  className={cn(
                    'size-2',
                    testResult
                      ? 'fill-green-500 text-green-500'
                      : 'fill-destructive text-destructive',
                  )}
                />
                <span className={testResult ? 'text-green-500' : 'text-destructive'}>
                  {testResult ? 'Connection successful' : 'Connection failed'}
                </span>
              </div>
            )}
            {healthy !== undefined && inputUrl === url && testResult === undefined && (
              <div className="flex items-center gap-2 text-sm">
                <Circle
                  className={cn(
                    'size-2',
                    healthy ? 'fill-green-500 text-green-500' : 'fill-destructive text-destructive',
                  )}
                />
                <span className={healthy ? 'text-green-500' : 'text-destructive'}>
                  {healthy ? 'Connected' : 'Connection failed'}
                </span>
              </div>
            )}
          </div>
        </div>

        <DrawerFooter>
          <Button onClick={handleSave} className="h-11">
            Save
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11">
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

interface SessionSidebarProps extends React.ComponentProps<typeof Sidebar> {}

export function SessionSidebar(props: SessionSidebarProps) {
  const { data: projects, isLoading } = useProjectsQuery()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const isMobile = useIsMobile()

  return (
    <>
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
                  <Link
                    to="/"
                    className="flex items-center gap-2 px-2 py-1.5 text-muted-foreground"
                  >
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
            <ServerStatus onClick={() => setSettingsOpen(true)} />
            <Button
              variant="ghost"
              size={isMobile ? 'default' : 'icon'}
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="size-4" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <ServerSettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  )
}
