/**
 * TanStack Query hooks for OpenCode SDK.
 * Provides reactive data fetching and caching.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { getOpencodeClient, createDirectoryClient } from './client'

// Query keys
export const queryKeys = {
  health: ['opencode', 'health'] as const,
  projects: ['opencode', 'projects'] as const,
  project: (directory: string) => ['opencode', 'project', directory] as const,
  sessions: (directory: string) => ['opencode', 'sessions', directory] as const,
  session: (sessionId: string) => ['opencode', 'session', sessionId] as const,
  messages: (sessionId: string) => ['opencode', 'messages', sessionId] as const,
  diff: (sessionId: string) => ['opencode', 'diff', sessionId] as const,
  config: (directory: string) => ['opencode', 'config', directory] as const,
  providers: ['opencode', 'providers'] as const,
  agents: (directory: string) => ['opencode', 'agents', directory] as const,
  mcpStatus: (directory: string) => ['opencode', 'mcp', directory] as const,
  lspStatus: (directory: string) => ['opencode', 'lsp', directory] as const,
  permissions: (sessionId: string) => ['opencode', 'permissions', sessionId] as const,
}

// Health check
export function useHealthQuery() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: async () => {
      try {
        const client = getOpencodeClient()
        const result = await client.global.health()
        return result.data ?? null
      } catch {
        return null
      }
    },
    refetchInterval: 30000,
    retry: false,
  })
}

// Projects
export function useProjectsQuery() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: async () => {
      try {
        const client = getOpencodeClient()
        const result = await client.project.list()
        return result.data ?? []
      } catch {
        return []
      }
    },
    retry: false,
  })
}

// Sessions for a project
export function useSessionsQuery(directory: string | undefined) {
  return useQuery({
    queryKey: queryKeys.sessions(directory ?? ''),
    queryFn: async () => {
      if (!directory) return []
      try {
        const client = createDirectoryClient(directory)
        const result = await client.session.list()
        return result.data ?? []
      } catch {
        return []
      }
    },
    enabled: !!directory,
    retry: false,
  })
}

// Single session
export function useSessionQuery(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.session(sessionId ?? ''),
    queryFn: async () => {
      if (!sessionId) return null
      try {
        const client = getOpencodeClient()
        const result = await client.session.get({ sessionID: sessionId })
        return result.data ?? null
      } catch {
        return null
      }
    },
    enabled: !!sessionId,
    retry: false,
  })
}

// Session messages
export function useMessagesQuery(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.messages(sessionId ?? ''),
    queryFn: async () => {
      if (!sessionId) return []
      try {
        const client = getOpencodeClient()
        const result = await client.session.messages({ sessionID: sessionId, limit: 1000 })
        return result.data ?? []
      } catch {
        return []
      }
    },
    enabled: !!sessionId,
    retry: false,
  })
}

// Session diff
export function useDiffQuery(sessionId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.diff(sessionId ?? ''),
    queryFn: async () => {
      if (!sessionId) return []
      try {
        const client = getOpencodeClient()
        const result = await client.session.diff({ sessionID: sessionId })
        return result.data ?? []
      } catch {
        return []
      }
    },
    enabled: !!sessionId,
    retry: false,
  })
}

// Config
export function useConfigQuery(directory: string | undefined) {
  return useQuery({
    queryKey: queryKeys.config(directory ?? ''),
    queryFn: async () => {
      if (!directory) return null
      const client = createDirectoryClient(directory)
      const result = await client.config.get()
      return result.data
    },
    enabled: !!directory,
  })
}

// Providers
export function useProvidersQuery() {
  return useQuery({
    queryKey: queryKeys.providers,
    queryFn: async () => {
      const client = getOpencodeClient()
      const result = await client.provider.list()
      return result.data ?? []
    },
  })
}

// Agents
export function useAgentsQuery(directory: string | undefined) {
  return useQuery({
    queryKey: queryKeys.agents(directory ?? ''),
    queryFn: async () => {
      if (!directory) return []
      const client = createDirectoryClient(directory)
      const result = await client.app.agents()
      return result.data ?? []
    },
    enabled: !!directory,
  })
}

// MCP Status
export function useMcpStatusQuery(directory: string | undefined) {
  return useQuery({
    queryKey: queryKeys.mcpStatus(directory ?? ''),
    queryFn: async () => {
      if (!directory) return []
      const client = createDirectoryClient(directory)
      const result = await client.mcp.status()
      return result.data ?? []
    },
    enabled: !!directory,
  })
}

// Create session mutation
export function useCreateSessionMutation(directory: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const client = createDirectoryClient(directory)
      const result = await client.session.create()
      return result.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions(directory) })
    },
  })
}

// Send prompt mutation
export function useSendPromptMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      messageId,
      text,
      agent,
      model,
      variant,
    }: {
      sessionId: string
      messageId: string
      text: string
      agent: string
      model: { providerID: string; modelID: string }
      variant?: string
    }) => {
      const client = getOpencodeClient()
      const result = await client.session.prompt({
        sessionID: sessionId,
        messageID: messageId,
        agent,
        model,
        variant,
        parts: [
          {
            id: `${messageId}-text`,
            type: 'text',
            text,
          },
        ],
      })
      return result.data
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages(variables.sessionId) })
    },
  })
}

// Abort session mutation
export function useAbortSessionMutation() {
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const client = getOpencodeClient()
      await client.session.abort({ sessionID: sessionId })
    },
  })
}

// Archive session mutation
export function useArchiveSessionMutation(directory: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const client = getOpencodeClient()
      await client.session.update({
        sessionID: sessionId,
        directory,
        time: { archived: Date.now() },
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions(directory) })
    },
  })
}
