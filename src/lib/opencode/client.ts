/**
 * OpenCode SDK client configuration and factory.
 * Uses @opencode-ai/sdk/v2 for API communication.
 */
import { createOpencodeClient, type OpencodeClient } from '@opencode-ai/sdk/v2/client'

const DEFAULT_SERVER_URL = 'http://localhost:4096'

function getServerUrl(): string {
  // Check URL param first
  const urlParam = new URLSearchParams(window.location.search).get('url')
  if (urlParam) return urlParam

  // Check environment variable
  const envUrl = import.meta.env.VITE_OPENCODE_SERVER_URL
  if (envUrl) return envUrl

  // Default to localhost
  return DEFAULT_SERVER_URL
}

let clientInstance: OpencodeClient | null = null

export function getOpencodeClient(directory?: string): OpencodeClient {
  if (!clientInstance) {
    clientInstance = createOpencodeClient({
      baseUrl: getServerUrl(),
      directory,
    })
  }
  return clientInstance
}

export function createDirectoryClient(directory: string): OpencodeClient {
  return createOpencodeClient({
    baseUrl: getServerUrl(),
    directory,
  })
}

export { type OpencodeClient }
