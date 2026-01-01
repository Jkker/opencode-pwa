/**
 * OpenCode module exports
 */
export { getOpencodeClient, createDirectoryClient, type OpencodeClient } from './client'
export { useServerStore } from './server-store'
export { useProjectStore } from './project-store'
export { useSessionStore } from './session-store'
export { useLayoutStore } from './layout-store'

// Re-export SDK types
export type {
  Session,
  Message,
  UserMessage,
  AssistantMessage,
  Part,
  TextPart,
  ToolPart,
  FilePart,
  ReasoningPart,
  ToolState,
  Project,
  FileDiff,
} from '@opencode-ai/sdk/v2/client'
