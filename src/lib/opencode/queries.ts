// TanStack Query hooks for OpenCode SDK.
// Provides reactive data fetching and caching.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { settingStore } from '@/stores/setting-store'

import { useClient } from './client'

// Query keys
export const queryKeys = {
  health: (url: string) => ['opencode', 'health', url] as const,
  projects: (url: string) => ['opencode', 'projects', url] as const,
  project: (url: string, directory: string) => ['opencode', 'project', url, directory] as const,
  sessions: (url: string, directory: string) => ['opencode', 'sessions', url, directory] as const,
  session: (url: string, sessionId: string) => ['opencode', 'session', url, sessionId] as const,
  messages: (url: string, sessionId: string) => ['opencode', 'messages', url, sessionId] as const,
  diff: (url: string, sessionId: string) => ['opencode', 'diff', url, sessionId] as const,
  config: (url: string, directory: string) => ['opencode', 'config', url, directory] as const,
  providers: (url: string) => ['opencode', 'providers', url] as const,
  agents: (url: string, directory: string) => ['opencode', 'agents', url, directory] as const,
  mcpStatus: (url: string, directory: string) => ['opencode', 'mcp', url, directory] as const,
  lspStatus: (url: string, directory: string) => ['opencode', 'lsp', url, directory] as const,
  permissions: (url: string, sessionId: string) =>
    ['opencode', 'permissions', url, sessionId] as const,
}

// Health check
export function useHealthQuery() {
  const url = settingStore.useValue('serverURL')
  const client = useClient()

  return useQuery({
    queryKey: queryKeys.health(url),
    queryFn: async () => {
      try {
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
  const url = settingStore.useValue('serverURL')
  const client = useClient()

  return useQuery({
    queryKey: queryKeys.projects(url),
    queryFn: async () => {
      try {
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
  const url = settingStore.useValue('serverURL')
  const client = useClient(directory)

  return useQuery({
    queryKey: queryKeys.sessions(url, directory ?? ''),
    queryFn: async () => {
      if (!directory) return []
      try {
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
  const url = settingStore.useValue('serverURL')
  const client = useClient()

  return useQuery({
    queryKey: queryKeys.session(url, sessionId ?? ''),
    queryFn: async () => {
      if (!sessionId) return null
      try {
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
  const url = settingStore.useValue('serverURL')
  const client = useClient()

  return useQuery({
    queryKey: queryKeys.messages(url, sessionId ?? ''),
    queryFn: async () => {
      if (!sessionId) return []
      try {
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
  const url = settingStore.useValue('serverURL')
  const client = useClient()

  return useQuery({
    queryKey: queryKeys.diff(url, sessionId ?? ''),
    queryFn: async () => {
      if (!sessionId) return []
      try {
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
  const url = settingStore.useValue('serverURL')
  const client = useClient(directory)

  return useQuery({
    queryKey: queryKeys.config(url, directory ?? ''),
    queryFn: async () => {
      if (!directory) return null
      const result = await client.config.get()
      return result.data
    },
    enabled: !!directory,
  })
}

// Providers
export function useProvidersQuery() {
  const url = settingStore.useValue('serverURL')
  const client = useClient()

  return useQuery({
    queryKey: queryKeys.providers(url),
    queryFn: async () => {
      const result = await client.provider.list()
      return result.data ?? []
    },
  })
}

// Agents
export function useAgentsQuery(directory: string | undefined) {
  const url = settingStore.useValue('serverURL')
  const client = useClient(directory)

  return useQuery({
    queryKey: queryKeys.agents(url, directory ?? ''),
    queryFn: async () => {
      if (!directory) return []
      const result = await client.app.agents()
      return result.data ?? []
    },
    enabled: !!directory,
  })
}

// MCP Status
export function useMcpStatusQuery(directory: string | undefined) {
  const url = settingStore.useValue('serverURL')
  const client = useClient(directory)

  return useQuery({
    queryKey: queryKeys.mcpStatus(url, directory ?? ''),
    queryFn: async () => {
      if (!directory) return []
      const result = await client.mcp.status()
      return result.data ?? []
    },
    enabled: !!directory,
  })
}

// Create session mutation
export function useCreateSessionMutation(directory: string) {
  const url = settingStore.useValue('serverURL')
  const client = useClient(directory)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async () => {
      const result = await client.session.create()
      return result.data
    },
    onSuccess: (session) => {
      if (!session) return
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions(url, directory) })
      void navigate({
        to: '/project/$projectId/$sessionId',
        params: {
          projectId: directory,
          sessionId: session.id,
        },
      })
    },
  })
}

// Send prompt mutation
export function useSendPromptMutation() {
  const url = settingStore.useValue('serverURL')
  const client = useClient()
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
    onSuccess: (_, { sessionId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages(url, sessionId) })
    },
  })
}

// Abort session mutation
export function useAbortSessionMutation() {
  const client = useClient()

  return useMutation({
    mutationFn: async (sessionId: string) => {
      await client.session.abort({ sessionID: sessionId })
    },
  })
}

// Archive session mutation
export function useArchiveSessionMutation(directory: string) {
  const url = settingStore.useValue('serverURL')
  const client = useClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sessionId: string) => {
      await client.session.update({
        sessionID: sessionId,
        directory,
        time: { archived: Date.now() },
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sessions(url, directory) })
    },
  })
}
