import type { QueryClient } from '@tanstack/react-query'

import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import { SessionSidebar } from '@/components/chat/session-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

interface RootRouteContext {
  queryClient: QueryClient
  isProtected?: boolean
}

export const Route = createRootRouteWithContext<RootRouteContext>()({
  component: () => (
    <TooltipProvider>
      <SidebarProvider
        style={{
          '--sidebar-width': 'calc(var(--spacing) * 64)',
        }}
      >
        <SessionSidebar />
        <SidebarInset className="h-dvh overflow-hidden">
          <Outlet />
        </SidebarInset>
      </SidebarProvider>

      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
          {
            name: 'Tanstack Query',
            render: <ReactQueryDevtoolsPanel />,
          },
        ]}
      />
    </TooltipProvider>
  ),
})
