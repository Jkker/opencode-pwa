import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export const tanstackQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      throwOnError: import.meta.env.DEV,
    },
  },
})

export const TanstackQueryProvider = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={tanstackQueryClient}>{children}</QueryClientProvider>
)
