/**
 * Real-time event subscription hook for OpenCode SDK.
 * Uses Server-Sent Events to receive live updates.
 *
 * Note: SSE subscription is handled differently in the SDK.
 * This is a simplified placeholder that will need to be updated
 * based on the actual SDK's event stream implementation.
 */
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useCallback } from 'react'

import { queryKeys } from './queries'

interface EventCallbacks {
  onSessionCreated?: (sessionId: string) => void
  onSessionUpdated?: (sessionId: string) => void
  onMessageUpdated?: (sessionId: string, messageId: string) => void
  onError?: (error: Error) => void
}

/**
 * Hook for subscribing to OpenCode events for a specific directory.
 * Currently uses polling as a fallback until SSE is properly integrated.
 */
export function useOpencodeEvents(directory: string | undefined, _callbacks?: EventCallbacks) {
  const queryClient = useQueryClient()

  // Memoize the refetch function
  const refetchQueries = useCallback(() => {
    if (!directory) return
    void queryClient.invalidateQueries({ queryKey: queryKeys.sessions(directory) })
    void queryClient.invalidateQueries({ queryKey: queryKeys.projects })
  }, [directory, queryClient])

  useEffect(() => {
    if (!directory) return

    // Poll for updates every 10 seconds as a fallback
    // This will be replaced with SSE when the SDK's event stream is properly integrated
    // Using a longer interval to reduce network requests
    const POLL_INTERVAL_MS = 10000
    const pollInterval = setInterval(() => {
      refetchQueries()
    }, POLL_INTERVAL_MS)

    return () => {
      clearInterval(pollInterval)
    }
  }, [directory, refetchQueries])
}
