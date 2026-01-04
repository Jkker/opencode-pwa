/**
 * Terminal E2E Test Harness
 * Provides utilities for testing the terminal component with a real OpenCode server.
 */

export interface TestServerConfig {
  serverURL: string
  directory: string
}

/**
 * Default test server configuration.
 * In CI, use environment variable; locally default to standard port.
 */
export function getTestServerConfig(): TestServerConfig {
  return {
    serverURL: import.meta.env.VITE_OPENCODE_SERVER_URL ?? 'http://127.0.0.1:4096',
    directory: '/',
  }
}

/**
 * Check if the OpenCode server is available
 */
export async function isServerAvailable(serverURL: string): Promise<boolean> {
  try {
    const response = await fetch(`${serverURL}/global/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return false
    const data = (await response.json()) as { healthy: boolean }
    return data.healthy === true
  } catch {
    return false
  }
}

/**
 * Create a PTY session on the server
 */
export async function createPty(
  serverURL: string,
  directory: string,
  title: string,
): Promise<{ id: string; title: string } | null> {
  try {
    const response = await fetch(`${serverURL}/pty?directory=${encodeURIComponent(directory)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    if (!response.ok) return null
    return (await response.json()) as { id: string; title: string }
  } catch {
    return null
  }
}

/**
 * Delete a PTY session on the server
 */
export async function deletePty(
  serverURL: string,
  directory: string,
  ptyId: string,
): Promise<boolean> {
  try {
    const response = await fetch(
      `${serverURL}/pty/${ptyId}?directory=${encodeURIComponent(directory)}`,
      { method: 'DELETE' },
    )
    return response.ok
  } catch {
    return false
  }
}

/**
 * List all PTY sessions on the server
 */
export async function listPtys(
  serverURL: string,
  directory: string,
): Promise<Array<{ id: string; title: string }>> {
  try {
    const response = await fetch(`${serverURL}/pty?directory=${encodeURIComponent(directory)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return []
    return (await response.json()) as Array<{ id: string; title: string }>
  } catch {
    return []
  }
}

/**
 * Clean up all PTY sessions for testing
 */
export async function cleanupAllPtys(serverURL: string, directory: string): Promise<void> {
  const ptys = await listPtys(serverURL, directory)
  await Promise.all(ptys.map((pty) => deletePty(serverURL, directory, pty.id)))
}
