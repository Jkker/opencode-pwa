import type { StaticDataRouteOption, AnyRouter } from '@tanstack/react-router'

import { Link, useRouter } from '@tanstack/react-router'
import { MessageSquare, Terminal } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { ServerStatus } from '@/components/chat/server-status'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  maxDepth?: number
}

interface RouteNode {
  children?: RouteNode[]
  id: string
  path: string
  to: string

  options: {
    staticData?: StaticDataRouteOption
  }
}

export function AppSidebar({ maxDepth = 3, ...props }: AppSidebarProps) {
  const router = useRouter<AnyRouter>()
  const { t } = useTranslation('routes')

  const renderRoute = ({ options: { staticData }, id, to, children }: RouteNode, depth = 0) => {
    if (depth >= maxDepth) return null

    const Item = depth > 0 ? SidebarMenuSubItem : SidebarMenuItem
    const Icon = staticData?.icon

    return (
      <Item key={id}>
        <Link
          to={to}
          className={cn(
            'text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground h-7 gap-2 rounded-md px-2 focus-visible:ring-2 data-[size=md]:text-sm data-[size=sm]:text-xs [&>svg]:size-4 flex min-w-0 -translate-x-px items-center overflow-hidden outline-hidden group-data-[collapsible=icon]:hidden disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:shrink-0',
          )}
        >
          {Icon && <Icon className="size-4" />}
          <span>{t(staticData?.title ?? to, { defaultValue: to })}</span>
        </Link>
        {children?.length && depth < maxDepth - 1 && (
          <SidebarMenuSub>{children.map((child) => renderRoute(child, depth + 1))}</SidebarMenuSub>
        )}
      </Item>
    )
  }

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={
                <Link to="/chat">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Terminal className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-medium">OpenCode</span>
                    <span className="text-xs text-muted-foreground">AI Coding Assistant</span>
                  </div>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-2">
            <SidebarMenuItem>
              <Link
                to="/chat"
                className={cn(
                  'text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground h-7 gap-2 rounded-md px-2 focus-visible:ring-2 data-[size=md]:text-sm data-[size=sm]:text-xs [&>svg]:size-4 flex min-w-0 -translate-x-px items-center overflow-hidden outline-hidden group-data-[collapsible=icon]:hidden disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:shrink-0',
                )}
              >
                <MessageSquare className="size-4" />
                <span>Chat</span>
              </Link>
            </SidebarMenuItem>
            {router.routeTree.children?.map(renderRoute)}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <ServerStatus className="px-2 py-2" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
