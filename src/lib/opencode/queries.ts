// TanStack Query hooks for OpenCode SDK.
// Provides reactive data fetching and caching.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import { settingStore } from '@/stores/setting-store'

import { useClient } from './client'

// Types based on OpenAPI spec
export interface ModelCapabilities {
  temperature: boolean
  reasoning: boolean
  attachment: boolean
  toolcall: boolean
  input: { text: boolean; audio: boolean; image: boolean; video: boolean; pdf: boolean }
  output: { text: boolean; audio: boolean; image: boolean; video: boolean; pdf: boolean }
  interleaved: boolean | { field: 'reasoning_content' | 'reasoning_details' }
}

export interface ModelCost {
  input: number
  output: number
  cache: { read: number; write: number }
}

export interface ModelLimit {
  context: number
  output: number
}

export interface Model {
  id: string
  providerID: string
  name: string
  family: string
  status?: 'active' | 'alpha' | 'beta' | 'deprecated'
  cost: ModelCost
  limit: ModelLimit
  capabilities: ModelCapabilities
  release_date: string
  variants?: Record<string, Record<string, unknown>>
}

export interface Provider {
  id: string
  name: string
  env: string[]
  models: Record<string, Model>
  source?: string
}

export interface ProvidersResponse {
  all: Provider[]
  default: Record<string, string>
  connected: string[]
}

export interface Agent {
  name: string
  description?: string
  mode: 'primary' | 'subagent' | 'all'
  native: boolean
  hidden?: boolean
  model?: { providerID: string; modelID: string }
}

export interface ProviderAuthMethod {
  type: 'api_key' | 'oauth'
  name?: string
  oauth?: {
    clientId: string
    authUrl: string
    tokenUrl: string
    scope: string
  }
}

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
  providerAuth: (url: string) => ['opencode', 'providerAuth', url] as const,
  agents: (url: string, directory: string) => ['opencode', 'agents', url, directory] as const,
  mcpStatus: (url: string, directory: string) => ['opencode', 'mcp', url, directory] as const,
  lspStatus: (url: string, directory: string) => ['opencode', 'lsp', url, directory] as const,
  permissions: (url: string, sessionId: string) =>
    ['opencode', 'permissions', url, sessionId] as const,
  commands: (url: string, directory: string) => ['opencode', 'commands', url, directory] as const,
  ptyList: (url: string, directory: string) => ['opencode', 'pty', url, directory] as const,
  pty: (url: string, ptyId: string) => ['opencode', 'pty', url, ptyId] as const,
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

// Commands
export function useCommandsQuery(directory: string | undefined) {
  const url = settingStore.useValue('serverURL')
  const client = useClient(directory)

  return useQuery({
    queryKey: queryKeys.commands(url, directory ?? ''),
    queryFn: async () => {
      if (!directory) return []
      const result = await client.command.list({ directory })
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

// PTY Types
export interface Pty {
  id: string
  title: string
  command: string
  args: string[]
  cwd: string
  status: 'running' | 'exited'
  pid: number
}

// PTY List
export function usePtyListQuery(directory: string | undefined) {
  const url = settingStore.useValue('serverURL')
  const client = useClient(directory)

  return useQuery({
    queryKey: queryKeys.ptyList(url, directory ?? ''),
    queryFn: async () => {
      if (!directory) return []
      try {
        const result = await client.pty.list({ directory })
        return (result.data ?? []) as Pty[]
      } catch {
        return []
      }
    },
    enabled: !!directory,
    retry: false,
  })
}

// Create PTY mutation
export function useCreatePtyMutation(directory: string) {
  const url = settingStore.useValue('serverURL')
  const client = useClient(directory)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (options?: { title?: string; command?: string; args?: string[] }) => {
      const result = await client.pty.create({
        directory,
        title: options?.title,
        command: options?.command,
        args: options?.args,
      })
      return result.data as Pty | undefined
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ptyList(url, directory) })
    },
  })
}

// Update PTY mutation
export function useUpdatePtyMutation(directory: string) {
  const url = settingStore.useValue('serverURL')
  const client = useClient(directory)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      ptyID,
      title,
      size,
    }: {
      ptyID: string
      title?: string
      size?: { rows: number; cols: number }
    }) => {
      const result = await client.pty.update({
        ptyID,
        directory,
        title,
        size,
      })
      return result.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ptyList(url, directory) })
    },
  })
}

// Remove PTY mutation
export function useRemovePtyMutation(directory: string) {
  const url = settingStore.useValue('serverURL')
  const client = useClient(directory)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ptyID: string) => {
      await client.pty.remove({ ptyID, directory })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ptyList(url, directory) })
    },
  })
}

// Providers
export function useProvidersQuery() {
  const url = settingStore.useValue('serverURL')
  const client = useClient()

  return useQuery({
    queryKey: queryKeys.providers(url),
    queryFn: async () => {
      try {
        const result = await client.config.providers()
        return (result.data ?? { all: [], default: {}, connected: [] }) as ProvidersResponse
      } catch {
        return { all: [], default: {}, connected: [] } as ProvidersResponse
      }
    },
    retry: false,
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
      try {
        const result = await client.app.agents()
        return (result.data ?? []) as Agent[]
      } catch {
        return []
      }
    },
    enabled: !!directory,
    retry: false,
  })
}

// File search
export function useFileSearchQuery(directory: string | undefined, query: string) {
  const url = settingStore.useValue('serverURL')
  const client = useClient(directory)

  return useQuery({
    queryKey: ['opencode', 'files', url, directory, query] as const,
    queryFn: async () => {
      if (!directory || query.length < 1) return []
      try {
        const result = await client.find.files({ query, limit: 20 })
        return result.data ?? []
      } catch {
        return []
      }
    },
    enabled: !!directory && query.length >= 1,
    staleTime: 5000,
  })
}

// Shell command mutation
export function useShellCommandMutation() {
  const client = useClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      command,
      agent,
      model,
    }: {
      sessionId: string
      command: string
      agent: string
      model: { providerID: string; modelID: string }
    }) => {
      const result = await client.session.shell({
        sessionID: sessionId,
        agent,
        model,
        command,
      })
      return result.data
    },
  })
}

// Custom command mutation
export function useCustomCommandMutation() {
  const client = useClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      command,
      args,
      agent,
      model,
      variant,
    }: {
      sessionId: string
      command: string
      args: string
      agent: string
      model: string
      variant?: string
    }) => {
      const result = await client.session.command({
        sessionID: sessionId,
        command,
        arguments: args,
        agent,
        model,
        variant,
      })
      return result.data
    },
  })
}
