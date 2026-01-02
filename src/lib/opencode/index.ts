// OpenCode module exports
export { projectStore } from '@/stores/project-store'
export { sessionStore } from '../../stores/session-store'
export { layoutStore } from '../../stores/layout-store'
export { useOpencodeEvents } from './events'

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
