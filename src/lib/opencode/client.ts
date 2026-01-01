/**
 * OpenCode SDK client configuration and factory.
 * Uses @opencode-ai/sdk/v2 for API communication.
 */
import { createOpencodeClient, type OpencodeClient } from '@opencode-ai/sdk/v2/client'

const DEFAULT_SERVER_URL = 'http://localhost:4096'
const STORAGE_KEY = 'opencode-server-storage'

function getServerUrl(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (
        parsed &&
        typeof parsed === 'object' &&
        'state' in parsed &&
        parsed.state &&
        typeof parsed.state === 'object' &&
        'url' in parsed.state &&
        typeof parsed.state.url === 'string'
      ) {
        return parsed.state.url
      }
    }
  } catch {}

  const envUrl = import.meta.env.VITE_OPENCODE_SERVER_URL
  if (envUrl) return envUrl

  return DEFAULT_SERVER_URL
}

export function getOpencodeClient(directory?: string): OpencodeClient {
  return createOpencodeClient({
    baseUrl: getServerUrl(),
    directory,
  })
}

export function createDirectoryClient(directory: string): OpencodeClient {
  return createOpencodeClient({
    baseUrl: getServerUrl(),
    directory,
  })
}

export { type OpencodeClient }
