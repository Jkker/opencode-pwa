import type {
  Message,
  Part,
  ToolPart,
} from '@opencode-ai/sdk/v2/client'

/** Get the status text for a tool call */
export function getToolStatus(state: ToolPart['state']): string {
  switch (state.status) {
    case 'pending':
      return 'Pending...'
    case 'running':
      return state.title ?? 'Running...'
    case 'completed':
      return state.title
    case 'error':
      return `Error: ${state.error}`
  }
}

/** Check if a message is currently streaming */
export function isMessageStreaming(message: Message): boolean {
  if (message.role === 'user') return false
  if (message.role === 'assistant') {
    return !message.time.completed && !message.error
  }
  return false
}

/** Extract text content from message parts */
export function extractTextContent(parts: Part[]): string {
  return parts
    .filter((p) => p.type === 'text' && !p.ignored)
    .map((p) => (p.type === 'text' ? p.text : ''))
    .join('')
}

/** Extract tool calls from message parts */
export function extractToolCalls(parts: Part[]): ToolPart[] {
  return parts.filter((p): p is ToolPart => p.type === 'tool')
}

/** Check if message has an error */
export function hasMessageError(message: Message): boolean {
  if (message.role === 'assistant') {
    return !!message.error
  }
  return false
}

/** Get error details from message */
export function getMessageError(message: Message): { name: string; message?: string } | null {
  if (message.role === 'assistant') {
    const { error } = message
    if (error) {
      const data = 'data' in error ? error.data : null
      return {
        name: error.name,
        message: data && typeof data === 'object' && 'message' in data
          ? String(data.message)
          : undefined,
      }
    }
  }
  return null
}
