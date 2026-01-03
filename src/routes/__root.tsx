import type { QueryClient } from '@tanstack/react-query'

import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

import { ThemeProvider } from '@/components/ui/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'

interface RootRouteContext {
  queryClient: QueryClient
  isProtected?: boolean
}

export const Route = createRootRouteWithContext<RootRouteContext>()({
  component: () => (
    <ThemeProvider>
      <TooltipProvider>
        <Outlet />

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
    </ThemeProvider>
  ),
})
