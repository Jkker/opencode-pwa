/**
 * OpenCode session store using Zustand.
 * Manages sessions, messages, and real-time sync.
 */
import type { Session, Message, Part } from '@opencode-ai/sdk/v2/client'

import { create } from 'zustand'

interface SessionState {
  sessions: Map<string, Session>
  sessionsByProject: Map<string, Session[]>
  messages: Map<string, Message[]>
  parts: Map<string, Part[]>
  sessionStatus: Map<string, SessionStatus>
  currentSessionId: string | null
}

type SessionStatus = { type: 'idle' } | { type: 'busy' } | { type: 'retry'; attempt: number }

interface SessionActions {
  setSessions: (projectId: string, sessions: Session[]) => void
  setSession: (session: Session) => void
  removeSession: (sessionId: string) => void
  setMessages: (sessionId: string, messages: Message[]) => void
  addMessage: (sessionId: string, message: Message) => void
  updateMessage: (sessionId: string, message: Message) => void
  setParts: (messageId: string, parts: Part[]) => void
  addPart: (messageId: string, part: Part) => void
  updatePart: (messageId: string, part: Part) => void
  setSessionStatus: (sessionId: string, status: SessionStatus) => void
  setCurrentSession: (sessionId: string | null) => void
}

type SessionStore = SessionState & SessionActions

export const useSessionStore = create<SessionStore>()((set, _get) => ({
  sessions: new Map(),
  sessionsByProject: new Map(),
  messages: new Map(),
  parts: new Map(),
  sessionStatus: new Map(),
  currentSessionId: null,

  setSessions: (projectId, sessions) =>
    set((state) => {
      const newSessions = new Map(state.sessions)
      const newByProject = new Map(state.sessionsByProject)

      for (const session of sessions) {
        newSessions.set(session.id, session)
      }
      newByProject.set(projectId, sessions)

      return { sessions: newSessions, sessionsByProject: newByProject }
    }),

  setSession: (session) =>
    set((state) => {
      const newSessions = new Map(state.sessions)
      newSessions.set(session.id, session)
      return { sessions: newSessions }
    }),

  removeSession: (sessionId) =>
    set((state) => {
      const newSessions = new Map(state.sessions)
      newSessions.delete(sessionId)
      return {
        sessions: newSessions,
        currentSessionId: state.currentSessionId === sessionId ? null : state.currentSessionId,
      }
    }),

  setMessages: (sessionId, messages) =>
    set((state) => {
      const newMessages = new Map(state.messages)
      newMessages.set(sessionId, messages)
      return { messages: newMessages }
    }),

  addMessage: (sessionId, message) =>
    set((state) => {
      const newMessages = new Map(state.messages)
      const existing = newMessages.get(sessionId) ?? []
      newMessages.set(sessionId, [...existing, message])
      return { messages: newMessages }
    }),

  updateMessage: (sessionId, message) =>
    set((state) => {
      const newMessages = new Map(state.messages)
      const existing = newMessages.get(sessionId) ?? []
      const updated = existing.map((m) => (m.id === message.id ? message : m))
      newMessages.set(sessionId, updated)
      return { messages: newMessages }
    }),

  setParts: (messageId, parts) =>
    set((state) => {
      const newParts = new Map(state.parts)
      newParts.set(messageId, parts)
      return { parts: newParts }
    }),

  addPart: (messageId, part) =>
    set((state) => {
      const newParts = new Map(state.parts)
      const existing = newParts.get(messageId) ?? []
      newParts.set(messageId, [...existing, part])
      return { parts: newParts }
    }),

  updatePart: (messageId, part) =>
    set((state) => {
      const newParts = new Map(state.parts)
      const existing = newParts.get(messageId) ?? []
      const updated = existing.map((p) => (p.id === part.id ? part : p))
      newParts.set(messageId, updated)
      return { parts: newParts }
    }),

  setSessionStatus: (sessionId, status) =>
    set((state) => {
      const newStatus = new Map(state.sessionStatus)
      newStatus.set(sessionId, status)
      return { sessionStatus: newStatus }
    }),

  setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),
}))
