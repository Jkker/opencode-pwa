import type {
  Agent,
  Config,
  FileDiff,
  GlobalEvent,
  Message,
  Part,
  Path,
  Permission,
  Project,
  Provider,
  Session,
  SessionStatus,
  Todo,
  VcsInfo,
} from '@opencode-ai/sdk/v2/client'
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

/** Data synchronized from the opencode server */
interface SyncData {
  ready: boolean
  project: string
  path: Path
  vcs?: VcsInfo
  config: Config
  session: Session[]
  agent: Agent[]
  command: { name: string; description?: string; template: string }[]
  message: Record<string, Message[]>
  part: Record<string, Part[]>
  todo: Record<string, Todo[]>
  permission: Record<string, Permission[]>
  session_status: Record<string, SessionStatus>
  session_diff: Record<string, FileDiff[]>
  limit: number
}

function createDefaultSyncData(): SyncData {
  return {
    ready: false,
    project: '',
    path: { home: '', state: '', config: '', worktree: '', directory: '' },
    config: {},
    session: [],
    agent: [],
    command: [],
    message: {},
    part: {},
    todo: {},
    permission: {},
    session_status: {},
    session_diff: {},
    limit: 30,
  }
}

/** Server connection state */
interface ServerState {
  url: string
  name: string
  healthy: boolean | undefined
  version: string | undefined
}

/** Active directory/project state */
interface DirectoryState {
  current: string | undefined
  data: Record<string, SyncData>
}

interface OpencodeState {
  server: ServerState
  directory: DirectoryState
  providers: Provider[]
  projects: Project[]
  eventSource: EventSource | null
}

interface OpencodeActions {
  setServerUrl: (url: string) => void
  setServerHealth: (healthy: boolean, version?: string) => void
  setServerName: (name: string) => void
  setCurrentDirectory: (directory: string) => void
  setProjects: (projects: Project[]) => void
  setProviders: (providers: Provider[]) => void
  initDirectoryData: (directory: string) => void
  updateDirectoryData: (directory: string, updater: (data: SyncData) => Partial<SyncData>) => void
  setEventSource: (source: EventSource | null) => void
  handleEvent: (event: GlobalEvent) => void
}

export type OpencodeStore = OpencodeState & OpencodeActions

export const useOpencodeStore = create<OpencodeStore>()(
  subscribeWithSelector((set, get) => ({
    server: {
      url: '',
      name: 'Connecting...',
      healthy: undefined,
      version: undefined,
    },
    directory: {
      current: undefined,
      data: {},
    },
    providers: [],
    projects: [],
    eventSource: null,

    setServerUrl: (url) => set((state) => ({ server: { ...state.server, url } })),

    setServerHealth: (healthy, version) =>
      set((state) => ({ server: { ...state.server, healthy, version } })),

    setServerName: (name) => set((state) => ({ server: { ...state.server, name } })),

    setCurrentDirectory: (directory) => {
      const state = get()
      // Initialize data for directory if not exists
      if (!state.directory.data[directory]) {
        set((s) => ({
          directory: {
            ...s.directory,
            current: directory,
            data: { ...s.directory.data, [directory]: createDefaultSyncData() },
          },
        }))
      } else {
        set((s) => ({ directory: { ...s.directory, current: directory } }))
      }
    },

    setProjects: (projects) => set({ projects }),

    setProviders: (providers) => set({ providers }),

    initDirectoryData: (directory) => {
      set((state) => ({
        directory: {
          ...state.directory,
          data: {
            ...state.directory.data,
            [directory]: createDefaultSyncData(),
          },
        },
      }))
    },

    updateDirectoryData: (directory, updater) => {
      set((state) => {
        const existing = state.directory.data[directory] ?? createDefaultSyncData()
        const updates = updater(existing)
        return {
          directory: {
            ...state.directory,
            data: {
              ...state.directory.data,
              [directory]: { ...existing, ...updates },
            },
          },
        }
      })
    },

    setEventSource: (source) => {
      const current = get().eventSource
      if (current) {
        current.close()
      }
      set({ eventSource: source })
    },

    handleEvent: (globalEvent: GlobalEvent) => {
      const { directory, payload } = globalEvent
      const state = get()

      // Handle global events
      switch (payload.type) {
        case 'project.updated':
          set((s) => {
            const projects = [...s.projects]
            const idx = projects.findIndex((p) => p.id === payload.properties.id)
            if (idx >= 0) {
              projects[idx] = payload.properties
            } else {
              projects.push(payload.properties)
            }
            return { projects }
          })
          return

        case 'installation.updated':
        case 'installation.update-available':
          // Could trigger update notifications
          return
      }

      // Handle directory-scoped events
      if (!directory) return

      const update = (updater: (data: SyncData) => Partial<SyncData>) => {
        state.updateDirectoryData(directory, updater)
      }

      switch (payload.type) {
        case 'session.created':
        case 'session.updated':
          update((data) => {
            const sessions = [...data.session]
            const idx = sessions.findIndex((s) => s.id === payload.properties.info.id)
            if (idx >= 0) {
              sessions[idx] = payload.properties.info
            } else {
              sessions.push(payload.properties.info)
              sessions.sort((a, b) => a.id.localeCompare(b.id))
            }
            return { session: sessions }
          })
          break

        case 'session.deleted':
          update((data) => ({
            session: data.session.filter((s) => s.id !== payload.properties.info.id),
          }))
          break

        case 'session.status':
          update((data) => ({
            session_status: {
              ...data.session_status,
              [payload.properties.sessionID]: payload.properties.status,
            },
          }))
          break

        case 'session.diff':
          update((data) => ({
            session_diff: {
              ...data.session_diff,
              [payload.properties.sessionID]: payload.properties.diff,
            },
          }))
          break

        case 'message.updated':
          update((data) => {
            const { info } = payload.properties
            const sessionMessages = [...(data.message[info.sessionID] ?? [])]
            const idx = sessionMessages.findIndex((m) => m.id === info.id)
            if (idx >= 0) {
              sessionMessages[idx] = info
            } else {
              sessionMessages.push(info)
              sessionMessages.sort((a, b) => a.id.localeCompare(b.id))
            }
            return { message: { ...data.message, [info.sessionID]: sessionMessages } }
          })
          break

        case 'message.removed':
          update((data) => {
            const { sessionID, messageID } = payload.properties
            return {
              message: {
                ...data.message,
                [sessionID]: (data.message[sessionID] ?? []).filter((m) => m.id !== messageID),
              },
            }
          })
          break

        case 'message.part.updated':
          update((data) => {
            const { part } = payload.properties
            const messageParts = [...(data.part[part.messageID] ?? [])]
            const idx = messageParts.findIndex((p) => p.id === part.id)
            if (idx >= 0) {
              messageParts[idx] = part
            } else {
              messageParts.push(part)
              messageParts.sort((a, b) => a.id.localeCompare(b.id))
            }
            return { part: { ...data.part, [part.messageID]: messageParts } }
          })
          break

        case 'message.part.removed':
          update((data) => {
            const { messageID, partID } = payload.properties
            return {
              part: {
                ...data.part,
                [messageID]: (data.part[messageID] ?? []).filter((p) => p.id !== partID),
              },
            }
          })
          break

        case 'permission.updated':
          update((data) => {
            const permission = payload.properties
            const sessionPermissions = [...(data.permission[permission.sessionID] ?? [])]
            const idx = sessionPermissions.findIndex((p) => p.id === permission.id)
            if (idx >= 0) {
              sessionPermissions[idx] = permission
            } else {
              sessionPermissions.push(permission)
            }
            return {
              permission: { ...data.permission, [permission.sessionID]: sessionPermissions },
            }
          })
          break

        case 'permission.replied':
          update((data) => {
            const { sessionID, permissionID } = payload.properties
            return {
              permission: {
                ...data.permission,
                [sessionID]: (data.permission[sessionID] ?? []).filter(
                  (p) => p.id !== permissionID
                ),
              },
            }
          })
          break

        case 'todo.updated':
          update(() => ({
            todo: { [payload.properties.sessionID]: payload.properties.todos },
          }))
          break

        case 'vcs.branch.updated':
          update(() => ({
            vcs: payload.properties.branch ? { branch: payload.properties.branch } : undefined,
          }))
          break
      }
    },
  }))
)

/** Selector for current directory's sync data */
export function useCurrentDirectoryData() {
  return useOpencodeStore((state) => {
    const dir = state.directory.current
    if (!dir) return null
    return state.directory.data[dir] ?? null
  })
}

/** Selector for server connection state */
export function useServerState() {
  return useOpencodeStore((state) => state.server)
}

/** Selector for projects */
export function useProjects() {
  return useOpencodeStore((state) => state.projects)
}

/** Selector for providers */
export function useProviders() {
  return useOpencodeStore((state) => state.providers)
}
