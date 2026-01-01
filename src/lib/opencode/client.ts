import { createOpencodeClient, type OpencodeClient } from '@opencode-ai/sdk/v2/client'

/** Determines the opencode server URL based on environment and URL params */
function getServerUrl(): string {
  const urlParam = new URLSearchParams(window.location.search).get('url')
  if (urlParam) return urlParam

  // Check for injected config from desktop app
  const injectedConfig = (window as { __OPENCODE__?: { port?: number } }).__OPENCODE__
  if (injectedConfig?.port) {
    return `http://127.0.0.1:${injectedConfig.port}`
  }

  // In development, use configured or default port
  if (import.meta.env.DEV) {
    const host = import.meta.env.VITE_OPENCODE_SERVER_HOST ?? 'localhost'
    const port = import.meta.env.VITE_OPENCODE_SERVER_PORT ?? '4096'
    return `http://${host}:${port}`
  }

  // In production on opencode.ai, connect to localhost
  if (window.location.hostname.includes('opencode.ai')) {
    return 'http://localhost:4096'
  }

  // Same origin fallback
  return window.location.origin
}

interface ClientOptions {
  /** Override base URL for the server */
  baseUrl?: string
  /** Directory context for API calls */
  directory?: string
  /** AbortSignal for cancellation */
  signal?: AbortSignal
}

/** Creates an opencode API client */
export function createClient(options: ClientOptions = {}): OpencodeClient {
  const baseUrl = options.baseUrl ?? getServerUrl()

  return createOpencodeClient({
    baseUrl,
    directory: options.directory,
    signal: options.signal ?? AbortSignal.timeout(1000 * 60 * 10), // 10 min timeout
    throwOnError: true,
  })
}

export { type OpencodeClient }
export { getServerUrl }
