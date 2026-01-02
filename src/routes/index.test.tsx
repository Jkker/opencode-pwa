import type { UseQueryResult } from '@tanstack/react-query'

import { expect, test, vi, describe, afterEach } from 'vitest'
import { render, cleanup } from 'vitest-browser-react'

import type { Project } from '@/lib/opencode'

import * as queries from '@/lib/opencode/queries'

import { HomePage } from './index'

// Mock the queries
vi.mock('@/lib/opencode/queries', async () => {
  return {
    useHealthQuery: vi.fn(),
    useProjectsQuery: vi.fn(),
  }
})

// Mock Link from router
vi.mock('@tanstack/react-router', () => ({
  Link: (props: any) => (
    <a href={props.to} {...props}>
      {props.children}
    </a>
  ),
  createFileRoute: () => () => null, // irrelevant for component test
}))

// Mock ServerSettingsDialog to avoid complex logic if any
vi.mock('@/components/server-settings-dialog', () => ({
  ServerSettingsDialog: () => <button>Server Settings</button>,
}))

describe('HomePage', () => {
  afterEach(async () => {
    await cleanup()
    vi.clearAllMocks()
  })

  test('app loads and shows title', async () => {
    // Setup default mocks
    vi.mocked(queries.useHealthQuery).mockReturnValue({
      data: true,
      isLoading: false,
    } as unknown as UseQueryResult<any, Error>)
    vi.mocked(queries.useProjectsQuery).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as UseQueryResult<Project[], Error>)

    const screen = await render(<HomePage />)
    await expect.element(screen.getByText('OpenCode')).toBeVisible()
  })

  test('checks server connection status - connected', async () => {
    vi.mocked(queries.useHealthQuery).mockReturnValue({
      data: true,
      isLoading: false,
    } as unknown as UseQueryResult<any, Error>)
    vi.mocked(queries.useProjectsQuery).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as UseQueryResult<Project[], Error>)

    const screen = await render(<HomePage />)
    await expect.element(screen.getByText('Connected')).toBeVisible()
  })

  test('checks server connection status - connecting', async () => {
    vi.mocked(queries.useHealthQuery).mockReturnValue({
      data: null,
      isLoading: true,
    } as unknown as UseQueryResult<any, Error>)
    vi.mocked(queries.useProjectsQuery).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as UseQueryResult<Project[], Error>)

    const screen = await render(<HomePage />)
    await expect.element(screen.getByText('Connecting...')).toBeVisible()
  })

  test('shows recent projects or empty state - empty', async () => {
    vi.mocked(queries.useHealthQuery).mockReturnValue({
      data: true,
      isLoading: false,
    } as unknown as UseQueryResult<any, Error>)
    vi.mocked(queries.useProjectsQuery).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as UseQueryResult<Project[], Error>)

    const screen = await render(<HomePage />)
    await expect.element(screen.getByText('Recent Projects', { exact: true })).toBeVisible()
    await expect.element(screen.getByText('No recent projects', { exact: true })).toBeVisible()
  })

  test('shows recent projects - populated', async () => {
    const projects = [
      { id: '1', worktree: '/path/to/project1', time: { updated: Date.now() } },
    ] as unknown as Project[]
    vi.mocked(queries.useHealthQuery).mockReturnValue({
      data: true,
      isLoading: false,
    } as unknown as UseQueryResult<any, Error>)
    vi.mocked(queries.useProjectsQuery).mockReturnValue({
      data: projects,
      isLoading: false,
    } as unknown as UseQueryResult<Project[], Error>)

    const screen = await render(<HomePage />)
    await expect.element(screen.getByText('project1', { exact: true })).toBeVisible()
    await expect
      .element(screen.getByText('No recent projects', { exact: true }))
      .not.toBeInTheDocument()
  })
})
