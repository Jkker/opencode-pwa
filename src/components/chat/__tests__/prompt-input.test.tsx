import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { PromptInput } from '../prompt-input'

// Mock the opencode client
vi.mock('@/lib/opencode/client', () => ({
  useClient: () => ({
    command: { list: vi.fn().mockResolvedValue({ data: [] }) },
    find: { files: vi.fn().mockResolvedValue({ data: [] }) },
    session: {
      prompt: vi.fn().mockResolvedValue({ data: {} }),
      abort: vi.fn().mockResolvedValue({}),
      shell: vi.fn().mockResolvedValue({ data: {} }),
      command: vi.fn().mockResolvedValue({ data: {} }),
    },
    config: {
      providers: vi.fn().mockResolvedValue({ data: { all: [], default: {}, connected: [] } }),
    },
    app: { agents: vi.fn().mockResolvedValue({ data: [] }) },
  }),
}))

// Create a test wrapper with required providers
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('PromptInput', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('rendering', () => {
    test('renders input container with border', async () => {
      const screen = await render(<PromptInput sessionId="test-session" directory="/test/dir" />, {
        wrapper: createWrapper(),
      })

      // Should render the input area with rounded borders
      const container = screen.container.querySelector('.rounded-xl')
      expect(container).not.toBeNull()
    })

    test('renders a button', async () => {
      const screen = await render(<PromptInput sessionId="test-session" directory="/test/dir" />, {
        wrapper: createWrapper(),
      })

      // Should have buttons
      const buttons = screen.container.querySelectorAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('image attachments', () => {
    test('renders file input for attachments', async () => {
      const screen = await render(<PromptInput sessionId="test-session" directory="/test/dir" />, {
        wrapper: createWrapper(),
      })

      // Should have a hidden file input
      const fileInput = screen.container.querySelector('input[type="file"]')
      expect(fileInput).not.toBeNull()
    })

    test('file input accepts correct types', async () => {
      const screen = await render(<PromptInput sessionId="test-session" directory="/test/dir" />, {
        wrapper: createWrapper(),
      })

      const fileInput = screen.container.querySelector('input[type="file"]')
      expect(fileInput?.getAttribute('accept')).toContain('image/png')
      expect(fileInput?.getAttribute('accept')).toContain('image/jpeg')
      expect(fileInput?.getAttribute('accept')).toContain('application/pdf')
    })
  })
})
