import { RouterProvider, createRouter } from '@tanstack/react-router'
import { expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { ReactI18nextProvider } from '@/lib/i18next'
import { TanstackQueryProvider, tanstackQueryClient } from '@/lib/tanstack-query'
import { routeTree } from '@/routeTree.gen'

const createTestRouter = () =>
  createRouter({ routeTree, context: { queryClient: tanstackQueryClient } })

test('renders breadcrumbs correctly for home path', async () => {
  const router = createTestRouter()
  const screen = await render(
    <ReactI18nextProvider>
      <TanstackQueryProvider>
        <RouterProvider router={router} />
      </TanstackQueryProvider>
    </ReactI18nextProvider>,
  )

  await router.navigate({ to: '/' })

  await expect.element(screen.getByText('Home')).toBeVisible()
})

test('renders translated breadcrumbs for nested paths', async () => {
  const router = createTestRouter()
  const screen = await render(
    <ReactI18nextProvider>
      <TanstackQueryProvider>
        <RouterProvider router={router} />
      </TanstackQueryProvider>
    </ReactI18nextProvider>,
  )

  await router.navigate({ to: '/app/childrenRoute' })

  await expect.element(screen.getByRole('link', { name: 'Home', exact: true })).toBeVisible()
  await expect.element(screen.getByRole('link', { name: 'App', exact: true })).toBeVisible()
  await expect.element(screen.getByText('App Children')).toBeVisible()
})

test('renders startCase fallback for unknown segments', async () => {
  const router = createTestRouter()
  const screen = await render(
    <ReactI18nextProvider>
      <TanstackQueryProvider>
        <RouterProvider router={router} />
      </TanstackQueryProvider>
    </ReactI18nextProvider>,
  )

  await router.navigate({ to: '/deep/nested' })

  await expect.element(screen.getByRole('link', { name: 'Home', exact: true })).toBeVisible()
  await expect.element(screen.getByRole('link', { name: 'Deep', exact: true })).toBeVisible()
  await expect.element(screen.getByText('Deep Nested Route')).toBeVisible()
})
