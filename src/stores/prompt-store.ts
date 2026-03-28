// Prompt store for managing prompt input state
// Handles prompt history, image attachments, and shell mode
import { createStore } from 'zustand-x'

// Part types for rich prompt content
interface PartBase {
  content: string
  start: number
  end: number
}

export interface TextPart extends PartBase {
  type: 'text'
}

export interface FileAttachmentPart extends PartBase {
  type: 'file'
  path: string
  selection?: { startLine: number; endLine: number }
}

export interface AgentPart extends PartBase {
  type: 'agent'
  name: string
}

// ImageAttachmentPart doesn't extend PartBase because attachments are stored
// separately from text content and don't have position info in the input
export interface ImageAttachmentPart {
  type: 'image'
  id: string
  filename: string
  mime: string
  dataUrl: string
}

export type ContentPart = TextPart | FileAttachmentPart | AgentPart | ImageAttachmentPart
export type Prompt = ContentPart[]

export const DEFAULT_PROMPT: Prompt = [{ type: 'text', content: '', start: 0, end: 0 }]

const MAX_HISTORY = 100

export const promptStore = createStore(
  {
    mode: 'normal' as 'normal' | 'shell',
    historyIndex: -1,
    savedPrompt: null as Prompt | null,
    promptHistory: [] as Prompt[],
    shellHistory: [] as Prompt[],
    imageAttachments: [] as ImageAttachmentPart[],
  },
  {
    name: 'prompt-store',
    persist: true,
    devtools: true,
  },
).extendActions(({ set, get }) => ({
  setMode: (mode: 'normal' | 'shell') => set('mode', mode),

  addImageAttachment: (attachment: ImageAttachmentPart) =>
    set('imageAttachments', (attachments) => [...attachments, attachment]),

  removeImageAttachment: (id: string) =>
    set('imageAttachments', (attachments) => attachments.filter((a) => a.id !== id)),

  clearImageAttachments: () => set('imageAttachments', []),

  addToHistory: (prompt: Prompt, mode: 'normal' | 'shell') => {
    const text = prompt
      .map((p) => ('content' in p ? p.content : ''))
      .join('')
      .trim()
    if (!text) return

    const entry = structuredClone(prompt)
    const key = mode === 'shell' ? 'shellHistory' : 'promptHistory'
    const currentHistory = get(key) as Prompt[]
    const lastEntry = currentHistory[0]

    if (lastEntry) {
      const lastText = lastEntry.map((p) => ('content' in p ? p.content : '')).join('')
      if (lastText === text) return
    }

    set(key, [entry, ...currentHistory].slice(0, MAX_HISTORY))
  },

  navigateHistory: (direction: 'up' | 'down', currentPrompt: Prompt): Prompt | null => {
    const state = get('state')
    const entries = state.mode === 'shell' ? state.shellHistory : state.promptHistory
    const current = state.historyIndex

    if (direction === 'up') {
      if (entries.length === 0) return null
      if (current === -1) {
        set('savedPrompt', structuredClone(currentPrompt))
        set('historyIndex', 0)
        return structuredClone(entries[0])
      }
      if (current < entries.length - 1) {
        const next = current + 1
        set('historyIndex', next)
        return structuredClone(entries[next])
      }
      return null
    }

    // direction === 'down'
    if (current > 0) {
      const next = current - 1
      set('historyIndex', next)
      return structuredClone(entries[next])
    }
    if (current === 0) {
      set('historyIndex', -1)
      const saved = state.savedPrompt
      if (saved) {
        set('savedPrompt', null)
        return structuredClone(saved)
      }
      return structuredClone(DEFAULT_PROMPT)
    }

    return null
  },

  resetHistoryNavigation: () => {
    set('historyIndex', -1)
    set('savedPrompt', null)
  },

  reset: () => {
    set('mode', 'normal')
    set('historyIndex', -1)
    set('savedPrompt', null)
    set('imageAttachments', [])
  },
}))
