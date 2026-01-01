import type { QueryClient } from '@tanstack/react-query'

import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import { SessionSidebar } from '@/components/chat/session-sidebar'
import { CommandPalette } from '@/components/command-palette'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CommandProvider } from '@/lib/context/command'
import { ThemeProvider } from '@/components/ui/theme-provider'
import { useDefaultCommands } from '@/hooks/use-default-commands'

interface RootRouteContext {
  queryClient: QueryClient
  isProtected?: boolean
}

/** Inner component that uses sidebar context */
function AppShell() {
  // Register default commands (needs to be inside SidebarProvider)
  useDefaultCommands()

  return (
    <>
      <SessionSidebar />
      <SidebarInset className="h-dvh overflow-hidden">
        <Outlet />
      </SidebarInset>
      <CommandPalette />
    </>
  )
}

export const Route = createRootRouteWithContext<RootRouteContext>()({
  component: () => (
    <ThemeProvider defaultTheme="system" storageKey="opencode-theme">
      <TooltipProvider>
        <CommandProvider>
          <SidebarProvider
            style={{
              '--sidebar-width': 'calc(var(--spacing) * 64)',
            }}
          >
            <AppShell />
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
        </CommandProvider>
      </TooltipProvider>
    </ThemeProvider>
  ),
})
