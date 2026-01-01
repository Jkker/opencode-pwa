import { RouterProvider, createRouter } from '@tanstack/react-router'

import { routeTree } from '../routeTree.gen'
import { tanstackQueryClient } from './tanstack-query'

const createTanstackRouter = (options?: Partial<Parameters<typeof createRouter>[0]>) =>
  createRouter({
    routeTree,
    context: { queryClient: tanstackQueryClient },
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultStructuralSharing: true,
    defaultViewTransition: true,
    defaultHashScrollIntoView: true,
    ...options,
  })
const router = createTanstackRouter()

export const TanstackRouterProvider = () => <RouterProvider router={router} />

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
  // https://tanstack.com/router/latest/docs/framework/react/guide/static-route-data
  interface StaticDataRouteOption {
    title?: string
    icon?: React.ComponentType<{ className?: string }>
  }
}
