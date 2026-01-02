// OpenCode session store using Zustand X.
// Manages sessions, messages, and real-time sync.
import type { Session, Message, Part } from '@opencode-ai/sdk/v2/client'

import { createStore } from 'zustand-x'

type SessionStatus = { type: 'idle' } | { type: 'busy' } | { type: 'retry'; attempt: number }

export const sessionStore = createStore(
  {
    sessions: {} as Record<string, Session>,
    sessionsByProject: {} as Record<string, Session[]>,
    messages: {} as Record<string, Message[]>,
    parts: {} as Record<string, Part[]>,
    sessionStatus: {} as Record<string, SessionStatus>,
    currentSessionId: null as string | null,
  },
  {
    name: 'opencode-sessions',
  },
).extendActions(({ set, get }) => ({
  setSessions: (projectId: string, sessions: Session[]) => {
    const sessionMap = { ...get('sessions') }
    for (const session of sessions) {
      sessionMap[session.id] = session
    }
    set('state', (state) => ({
      ...state,
      sessions: sessionMap,
      sessionsByProject: {
        ...state.sessionsByProject,
        [projectId]: sessions,
      },
    }))
  },

  setSession: (session: Session) =>
    set('sessions', (prev) => ({
      ...prev,
      [session.id]: session,
    })),

  removeSession: (sessionId: string) =>
    set('state', (state) => {
      const { [sessionId]: _, ...restSessions } = state.sessions
      return {
        ...state,
        sessions: restSessions,
        currentSessionId: state.currentSessionId === sessionId ? null : state.currentSessionId,
      }
    }),

  addMessage: (sessionId: string, message: Message) =>
    set('messages', (prev) => ({
      ...prev,
      [sessionId]: [...(prev[sessionId] || []), message],
    })),

  updateMessage: (sessionId: string, message: Message) =>
    set('messages', (prev) => {
      const messages = prev[sessionId] || []
      return {
        ...prev,
        [sessionId]: messages.map((m) => (m.id === message.id ? message : m)),
      }
    }),

  addPart: (messageId: string, part: Part) =>
    set('parts', (prev) => ({
      ...prev,
      [messageId]: [...(prev[messageId] || []), part],
    })),

  updatePart: (messageId: string, part: Part) =>
    set('parts', (prev) => {
      const parts = prev[messageId] || []
      return {
        ...prev,
        [messageId]: parts.map((p) => (p.id === part.id ? part : p)),
      }
    }),
}))
