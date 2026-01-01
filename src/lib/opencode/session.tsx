import { createContext, useContext, useEffect, type ReactNode } from 'react'
import type { OpencodeClient, Session, Message, Part, FileDiff, Agent, SessionStatus } from '@opencode-ai/sdk/v2/client'
import { useOpencodeStore } from './store'
import { useOpencode } from './provider'

interface SessionContextValue {
  directory: string
  client: OpencodeClient

  // Session data
  sessions: Session[]
  currentSession: Session | undefined
  messages: Message[]
  parts: Record<string, Part[]>
  diffs: FileDiff[]
  agents: Agent[]
  status: SessionStatus

  // Actions
  createSession: () => Promise<Session | undefined>
  selectSession: (sessionId: string) => void
  deleteSession: (sessionId: string) => Promise<void>
  sendMessage: (text: string, options?: SendMessageOptions) => Promise<void>
  abort: () => Promise<void>
}

interface SendMessageOptions {
  agent?: string
  model?: { providerID: string; modelID: string }
  files?: { mime: string; url: string; filename?: string }[]
}

const SessionContext = createContext<SessionContextValue | null>(null)

interface SessionProviderProps {
  children: ReactNode
  directory: string
  sessionId?: string
}

// selectSession is a placeholder for router navigation - actual navigation happens via links
const selectSession = (_id: string) => {
  // Navigation is handled by TanStack Router via Link components
}

/**
 * Provider for session management within a specific directory.
 * Handles session CRUD, messaging, and real-time sync.
 */
export function SessionProvider({ children, directory, sessionId }: SessionProviderProps) {
  const { client } = useOpencode()

  // Initialize directory data in store
  useEffect(() => {
    useOpencodeStore.getState().setCurrentDirectory(directory)
  }, [directory])

  // Load directory-specific data
  useEffect(() => {
    const loadDirectoryData = async () => {
      try {
        const [pathRes, configRes, sessionsRes, agentsRes] = await Promise.all([
          client.path.get(),
          client.config.get(),
          client.session.list(),
          client.app.agents(),
        ])

        useOpencodeStore.getState().updateDirectoryData(directory, () => ({
          ready: true,
          path: pathRes.data ?? { home: '', state: '', config: '', worktree: '', directory: '' },
          config: configRes.data ?? {},
          session: sessionsRes.data ?? [],
          agent: agentsRes.data ?? [],
        }))
      } catch (e) {
        console.error('Failed to load directory data:', e)
      }
    }

    void loadDirectoryData()
  }, [client, directory])

  // Sync session messages when session changes
  useEffect(() => {
    if (!sessionId) return

    const syncSession = async () => {
      try {
        const [sessionRes, messagesRes, diffRes] = await Promise.all([
          client.session.get({ sessionID: sessionId }),
          client.session.messages({ sessionID: sessionId, limit: 1000 }),
          client.session.diff({ sessionID: sessionId }),
        ])

        useOpencodeStore.getState().updateDirectoryData(directory, (data) => {
          // Update session in list
          const sessions = [...data.session]
          if (sessionRes.data) {
            const idx = sessions.findIndex((s) => s.id === sessionId)
            if (idx >= 0) {
              sessions[idx] = sessionRes.data
            }
          }

          // Update messages and parts
          const messages: Message[] = []
          const parts: Record<string, Part[]> = { ...data.part }

          for (const msg of messagesRes.data ?? []) {
            if (msg.info) {
              messages.push(msg.info)
              parts[msg.info.id] = msg.parts
            }
          }
          messages.sort((a, b) => a.id.localeCompare(b.id))

          return {
            session: sessions,
            message: { ...data.message, [sessionId]: messages },
            part: parts,
            session_diff: { ...data.session_diff, [sessionId]: diffRes.data ?? [] },
          }
        })
      } catch (e) {
        console.error('Failed to sync session:', e)
      }
    }

    void syncSession()
  }, [client, directory, sessionId])

  // Get current data from store
  const data = useOpencodeStore((state) => state.directory.data[directory])
  const sessions = data?.session ?? []
  const currentSession = sessionId ? sessions.find((s) => s.id === sessionId) : undefined
  const messages = sessionId ? (data?.message[sessionId] ?? []) : []
  const parts = data?.part ?? {}
  const diffs = sessionId ? (data?.session_diff[sessionId] ?? []) : []
  const agents = data?.agent ?? []
  const status = sessionId ? (data?.session_status[sessionId] ?? { type: 'idle' as const }) : { type: 'idle' as const }

  const createSession = async (): Promise<Session | undefined> => {
    try {
      const response = await client.session.create({})
      return response.data
    } catch (e) {
      console.error('Failed to create session:', e)
      return undefined
    }
  }

  const deleteSession = async (id: string) => {
    try {
      await client.session.delete({ sessionID: id })
    } catch (e) {
      console.error('Failed to delete session:', e)
    }
  }

  const sendMessage = async (text: string, options?: SendMessageOptions) => {
    let targetSessionId = sessionId
    
    // Create session if needed
    if (!targetSessionId) {
      const session = await createSession()
      if (!session) return
      targetSessionId = session.id
    }

    const defaultAgent = agents.find((a) => a.default)?.name ?? agents[0]?.name ?? 'build'

    try {
      await client.session.prompt({
        sessionID: targetSessionId,
        agent: options?.agent ?? defaultAgent,
        model: options?.model,
        parts: [
          { type: 'text', text },
          ...(options?.files?.map((f) => ({ type: 'file' as const, ...f })) ?? []),
        ],
      })
    } catch (e) {
      console.error('Failed to send message:', e)
    }
  }

  const abort = async () => {
    if (!sessionId) return
    try {
      await client.session.abort({ sessionID: sessionId })
    } catch (e) {
      console.error('Failed to abort:', e)
    }
  }

  return (
    <SessionContext.Provider
      value={{
        directory,
        client,
        sessions,
        currentSession,
        messages,
        parts,
        diffs,
        agents,
        status,
        createSession,
        selectSession,
        deleteSession,
        sendMessage,
        abort,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

/**
 * Hook to access session context.
 * Must be used within SessionProvider.
 */
export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within SessionProvider')
  }
  return context
}
