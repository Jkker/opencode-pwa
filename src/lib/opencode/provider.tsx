import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { GlobalEvent } from '@opencode-ai/sdk/v2/client'
import { createClient, getServerUrl, type OpencodeClient } from './client'
import { useOpencodeStore } from './store'

interface OpencodeContextValue {
  client: OpencodeClient
  url: string
  healthy: boolean | undefined
  version: string | undefined
}

const OpencodeContext = createContext<OpencodeContextValue | null>(null)

interface OpencodeProviderProps {
  children: ReactNode
  /** Override server URL */
  serverUrl?: string
}

/**
 * Provider for opencode SDK client and server connection management.
 * Handles health checks and event streaming.
 */
export function OpencodeProvider({ children, serverUrl }: OpencodeProviderProps) {
  const url = serverUrl ?? getServerUrl()
  const [client] = useState(() => createClient({ baseUrl: url }))
  const [healthy, setHealthy] = useState<boolean | undefined>(undefined)
  const [version, setVersion] = useState<string | undefined>(undefined)

  // Initialize server URL in store
  useEffect(() => {
    useOpencodeStore.getState().setServerUrl(url)
  }, [url])

  // Health check on mount and when URL changes
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await client.global.health()
        if (response.data) {
          setHealthy(response.data.healthy)
          setVersion(response.data.version)
          useOpencodeStore.getState().setServerHealth(response.data.healthy, response.data.version)
          useOpencodeStore.getState().setServerName(url.includes('localhost') ? 'Local' : new URL(url).hostname)
        }
      } catch {
        setHealthy(false)
        useOpencodeStore.getState().setServerHealth(false)
        useOpencodeStore.getState().setServerName('Disconnected')
      }
    }

    void checkHealth()

    // Periodic health check
    const interval = setInterval(() => void checkHealth(), 30000)
    return () => clearInterval(interval)
  }, [client, url])

  // Set up global event stream
  useEffect(() => {
    if (!healthy) return

    const eventSource = new EventSource(`${url}/global/event`)

    const handleMessage = (event: MessageEvent<string>) => {
      try {
        const globalEvent = JSON.parse(event.data) as GlobalEvent
        useOpencodeStore.getState().handleEvent(globalEvent)
      } catch (e) {
        console.error('Failed to parse event:', e)
      }
    }

    const handleError = () => {
      console.error('EventSource connection error')
      // Will auto-reconnect
    }

    eventSource.addEventListener('message', handleMessage)
    eventSource.addEventListener('error', handleError)

    useOpencodeStore.getState().setEventSource(eventSource)

    return () => {
      eventSource.removeEventListener('message', handleMessage)
      eventSource.removeEventListener('error', handleError)
      eventSource.close()
      useOpencodeStore.getState().setEventSource(null)
    }
  }, [url, healthy])

  // Load initial data
  useEffect(() => {
    if (!healthy) return

    const loadInitialData = async () => {
      try {
        const [projectsRes, providersRes] = await Promise.all([
          client.project.list(),
          client.config.providers(),
        ])

        if (projectsRes.data) {
          useOpencodeStore.getState().setProjects(projectsRes.data)
        }
        if (providersRes.data) {
          useOpencodeStore.getState().setProviders(providersRes.data.providers)
        }
      } catch (e) {
        console.error('Failed to load initial data:', e)
      }
    }

    void loadInitialData()
  }, [client, healthy])

  return (
    <OpencodeContext.Provider value={{ client, url, healthy, version }}>
      {children}
    </OpencodeContext.Provider>
  )
}

/**
 * Hook to access the opencode client and connection state.
 * Must be used within OpencodeProvider.
 */
export function useOpencode() {
  const context = useContext(OpencodeContext)
  if (!context) {
    throw new Error('useOpencode must be used within OpencodeProvider')
  }
  return context
}

/**
 * Hook to access just the opencode client.
 * Convenience wrapper around useOpencode.
 */
export function useOpencodeClient() {
  return useOpencode().client
}
