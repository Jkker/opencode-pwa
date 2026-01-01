// Client
export { createClient, getServerUrl, type OpencodeClient } from './client'

// Store
export {
  useOpencodeStore,
  useCurrentDirectoryData,
  useServerState,
  useProjects,
  useProviders,
} from './store'

// Provider
export { OpencodeProvider, useOpencode, useOpencodeClient } from './provider'

// Session
export { SessionProvider, useSession } from './session'

// Re-export SDK types
export type {
  Agent,
  AssistantMessage,
  Command,
  Config,
  Event,
  FileDiff,
  FileNode,
  GlobalEvent,
  Message,
  Model,
  Part,
  Path,
  Permission,
  Project,
  Provider,
  Pty,
  Session,
  SessionStatus,
  TextPart,
  ToolPart,
  ToolState,
  Todo,
  UserMessage,
  VcsInfo,
} from '@opencode-ai/sdk/v2/client'
