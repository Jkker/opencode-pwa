// Real-time event subscription hook for OpenCode SDK.
// Uses Server-Sent Events to receive live updates.
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import { sessionStore } from '@/stores/session-store'
import { settingStore } from '@/stores/setting-store'

import { useClient } from './client'
import { queryKeys } from './queries'

interface EventCallbacks {
  onSessionCreated?: (sessionId: string) => void
  onSessionUpdated?: (sessionId: string) => void
  onMessageUpdated?: (sessionId: string, messageId: string) => void
  onError?: (error: Error) => void
}

// Hook for subscribing to OpenCode events for a specific directory.
export function useOpencodeEvents(directory: string | undefined, _callbacks?: EventCallbacks) {
  const queryClient = useQueryClient()
  const url = settingStore.useValue('serverURL')
  const client = useClient() // Use global client for subscription

  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    // Abort previous connection if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    const connect = async () => {
      try {
        // Subscribe to global events
        const events = await client.global.event({ signal: controller.signal })

        for await (const event of events.stream) {
          if (controller.signal.aborted) break

          const { directory: eventDirectory, payload } = event

          // Filter events by directory if specified, or handle global events
          if (directory && eventDirectory !== directory && eventDirectory !== 'global') {
            continue
          }

          const { type, properties } = payload as { type: string; properties: any } // eslint-disable-line @typescript-eslint/no-explicit-any

          switch (type) {
            case 'message.updated':
              if (properties.info) {
                sessionStore.actions.updateMessage(properties.info.sessionID, properties.info)
              }
              break

            case 'message.part.updated':
              if (properties.part) {
                sessionStore.actions.updatePart(properties.part.messageID, properties.part)
              }
              break

            case 'message.part.removed':
              if (properties.messageID && properties.partID) {
                sessionStore.actions.removePart(properties.messageID, properties.partID)
              }
              break

            case 'session.updated':
              void queryClient.invalidateQueries({
                queryKey: queryKeys.sessions(url, eventDirectory || directory || ''),
              })
              if (properties.id) {
                void queryClient.invalidateQueries({
                  queryKey: queryKeys.session(url, properties.id),
                })
              }
              break

            case 'session.status':
              if (properties.sessionID && properties.status) {
                sessionStore.actions.updateSessionStatus(properties.sessionID, properties.status)
              }
              break
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error('SSE Error:', err)
          // Retry logic: wait 5s then reconnect
          setTimeout(connect, 5000)
        }
      }
    }

    void connect()

    return () => {
      controller.abort()
    }
  }, [directory, client, queryClient, url])
}
