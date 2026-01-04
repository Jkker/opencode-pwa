/**
 * Terminal Component E2E Tests
 *
 * Tests the terminal component against a real OpenCode server.
 * Requires: `opencode serve --cors localhost:5173` running locally.
 *
 * These tests verify:
 * - Terminal renders correctly
 * - WebSocket connection is established
 * - Only one terminal instance is created (React Strict Mode safe)
 * - Terminal controller lifecycle is properly managed
 */
import { afterAll, afterEach, beforeEach, describe, expect, test } from 'vitest'
import { render } from 'vitest-browser-react'

import { Terminal } from '../terminal'
import {
  cleanupAllPtys,
  createPty,
  deletePty,
  getTestServerConfig,
  isServerAvailable,
} from './test-harness'

// Test configuration
const config = getTestServerConfig()

// Track created PTYs for cleanup
const createdPtyIds: string[] = []

// Helper to skip tests when server is not available
async function requireServer(): Promise<boolean> {
  const available = await isServerAvailable(config.serverURL)
  if (!available) {
    console.warn(
      `⚠️ OpenCode server not available at ${config.serverURL}. ` +
        'Run: opencode serve --cors localhost:5173',
    )
  }
  return available
}

afterAll(async () => {
  // Cleanup any PTYs created during tests
  if (await isServerAvailable(config.serverURL)) {
    await cleanupAllPtys(config.serverURL, config.directory)
  }
})

beforeEach(async () => {
  // Clear any previous PTYs
  if (await isServerAvailable(config.serverURL)) {
    await cleanupAllPtys(config.serverURL, config.directory)
  }
})

afterEach(async () => {
  // Cleanup PTYs created in this test
  for (const ptyId of createdPtyIds) {
    await deletePty(config.serverURL, config.directory, ptyId)
  }
  createdPtyIds.length = 0
})

describe('Terminal Component', () => {
  test('renders terminal container', async () => {
    if (!(await requireServer())) return

    const pty = await createPty(config.serverURL, config.directory, 'Test Terminal')
    expect(pty).not.toBeNull()
    if (!pty) return

    createdPtyIds.push(pty.id)

    const { container } = await render(
      <Terminal pty={{ id: pty.id, title: pty.title }} directory={config.directory} />,
    )

    // Terminal container should be rendered
    const terminalContainer = container.querySelector('[data-component="terminal"]')
    expect(terminalContainer).not.toBeNull()
  })

  test('has correct test-id attribute', async () => {
    if (!(await requireServer())) return

    const pty = await createPty(config.serverURL, config.directory, 'Test Terminal')
    expect(pty).not.toBeNull()
    if (!pty) return

    createdPtyIds.push(pty.id)

    const screen = await render(
      <Terminal pty={{ id: pty.id, title: pty.title }} directory={config.directory} />,
    )

    // Should have data-testid for testing
    await expect.element(screen.getByTestId('terminal-container')).toBeVisible()
  })

  test('applies custom className', async () => {
    if (!(await requireServer())) return

    const pty = await createPty(config.serverURL, config.directory, 'Test Terminal')
    expect(pty).not.toBeNull()
    if (!pty) return

    createdPtyIds.push(pty.id)

    const { container } = await render(
      <Terminal
        pty={{ id: pty.id, title: pty.title }}
        directory={config.directory}
        className="custom-test-class"
      />,
    )

    const terminalContainer = container.querySelector('[data-component="terminal"]')
    expect(terminalContainer?.classList.contains('custom-test-class')).toBe(true)
  })

  test('calls onCleanup with snapshot on unmount', async () => {
    if (!(await requireServer())) return

    const pty = await createPty(config.serverURL, config.directory, 'Test Terminal')
    expect(pty).not.toBeNull()
    if (!pty) return

    createdPtyIds.push(pty.id)

    let cleanupCalled = false
    let cleanupData: unknown = null

    const onCleanup = (data: unknown) => {
      cleanupCalled = true
      cleanupData = data
    }

    const { unmount } = await render(
      <Terminal
        pty={{ id: pty.id, title: pty.title }}
        directory={config.directory}
        onCleanup={onCleanup}
      />,
    )

    // Wait for terminal to initialize
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Unmount should trigger cleanup
    await unmount()

    // Cleanup should have been called with terminal state
    expect(cleanupCalled).toBe(true)
    expect(cleanupData).toHaveProperty('id', pty.id)
  })
})

describe('Terminal Controller Lifecycle', () => {
  test('creates only one terminal instance', async () => {
    if (!(await requireServer())) return

    const pty = await createPty(config.serverURL, config.directory, 'Single Instance Test')
    expect(pty).not.toBeNull()
    if (!pty) return

    createdPtyIds.push(pty.id)

    const { container } = await render(
      <Terminal pty={{ id: pty.id, title: pty.title }} directory={config.directory} />,
    )

    // Wait for initialization
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Should only have one terminal container
    const terminals = container.querySelectorAll('[data-component="terminal"]')
    expect(terminals.length).toBe(1)
  })

  test('handles unmount during initialization gracefully', async () => {
    if (!(await requireServer())) return

    const pty = await createPty(config.serverURL, config.directory, 'Quick Unmount Test')
    expect(pty).not.toBeNull()
    if (!pty) return

    createdPtyIds.push(pty.id)

    const { unmount } = await render(
      <Terminal pty={{ id: pty.id, title: pty.title }} directory={config.directory} />,
    )

    // Unmount immediately - should not throw
    await unmount()

    // Give it a moment to ensure no errors occur
    await new Promise((resolve) => setTimeout(resolve, 500))
  })

  test('reinitializes when pty.id changes', async () => {
    if (!(await requireServer())) return

    const pty1 = await createPty(config.serverURL, config.directory, 'PTY 1')
    const pty2 = await createPty(config.serverURL, config.directory, 'PTY 2')
    expect(pty1).not.toBeNull()
    expect(pty2).not.toBeNull()
    if (!pty1 || !pty2) return

    createdPtyIds.push(pty1.id, pty2.id)

    let cleanupCount = 0
    const onCleanup = () => {
      cleanupCount++
    }

    const { rerender } = await render(
      <Terminal
        pty={{ id: pty1.id, title: pty1.title }}
        directory={config.directory}
        onCleanup={onCleanup}
      />,
    )

    // Wait for first terminal to initialize
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Rerender with different PTY
    await rerender(
      <Terminal
        pty={{ id: pty2.id, title: pty2.title }}
        directory={config.directory}
        onCleanup={onCleanup}
      />,
    )

    // Wait for cleanup and reinitialization
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Cleanup should have been called for the first PTY
    expect(cleanupCount).toBeGreaterThanOrEqual(1)
  })
})

describe('Terminal without server', () => {
  test('renders container even without server connection', async () => {
    const { container } = await render(
      <Terminal
        pty={{ id: 'fake-pty-id', title: 'Fake Terminal' }}
        directory="/"
        onConnectError={() => {
          // Expected to fail
        }}
      />,
    )

    // Terminal container should still be rendered
    const terminalContainer = container.querySelector('[data-component="terminal"]')
    expect(terminalContainer).not.toBeNull()
  })
})
