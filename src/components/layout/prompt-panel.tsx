'use client'

import { autocompletion, closeBrackets, type CompletionContext } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { bracketMatching, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, placeholder as cmPlaceholder } from '@codemirror/view'
import { Send, Square } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { useClient } from '@/lib/opencode/client'
import { useSendPromptMutation, useAbortSessionMutation } from '@/lib/opencode/queries'
import { cn } from '@/lib/utils'

// Minimum and maximum row heights
const MIN_ROWS = 1
const MAX_AUTO_ROWS = 8

// CodeMirror theme for prompt input
const promptTheme = EditorView.theme({
  '&': {
    fontSize: '14px',
    backgroundColor: 'transparent',
  },
  '.cm-content': {
    padding: '8px 0',
    fontFamily: 'inherit',
    caretColor: 'var(--foreground)',
  },
  '.cm-line': {
    padding: '0',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-placeholder': {
    color: 'var(--muted-foreground)',
    fontStyle: 'normal',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
  '.cm-tooltip-autocomplete': {
    backgroundColor: 'var(--popover)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.15)',
    overflow: 'hidden',
    padding: '4px',
  },
  '.cm-tooltip-autocomplete ul li': {
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: 'var(--accent)',
  },
})

interface PromptPanelProps {
  sessionId?: string
  directory?: string
}

interface CommandInfo {
  name: string
  description?: string
}

interface ProviderInfo {
  id: string
  name: string
  models: { id: string; name: string }[]
}

// Create slash command completions
function createCommandCompletions(fetchCommands: () => Promise<CommandInfo[]>) {
  return async (context: CompletionContext) => {
    const word = context.matchBefore(/\/\w*/)
    if (!word) return null
    if (word.from === word.to && !context.explicit) return null

    const commands = await fetchCommands()
    const query = word.text.slice(1).toLowerCase()

    const filteredCommands = commands.filter(
      (cmd) =>
        cmd.name.toLowerCase().includes(query) || cmd.description?.toLowerCase().includes(query),
    )

    return {
      from: word.from,
      options: filteredCommands.map((cmd) => ({
        label: `/${cmd.name}`,
        detail: cmd.description,
        type: 'keyword',
        apply: `/${cmd.name} `,
      })),
      filter: false,
    }
  }
}

// Create @ file mention completions
function createFileMentionCompletions(fetchFiles: (query: string) => Promise<string[]>) {
  return async (context: CompletionContext) => {
    const word = context.matchBefore(/@[\w./-]*/)
    if (!word) return null
    if (word.from === word.to && !context.explicit) return null

    const query = word.text.slice(1)
    const files = await fetchFiles(query)

    return {
      from: word.from,
      options: files.map((file) => ({
        label: `@${file}`,
        detail: 'File',
        type: 'variable',
        apply: `@${file} `,
      })),
      filter: false,
    }
  }
}

export function PromptPanel({ sessionId, directory }: PromptPanelProps) {
  const [value, setValue] = useState('')
  const [manualHeight, setManualHeight] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  const client = useClient(directory)
  const sendPrompt = useSendPromptMutation()
  const abortSession = useAbortSessionMutation()
  const isMobile = useIsMobile()

  // Selection state
  const [selectedModel, setSelectedModel] = useState({
    providerID: 'anthropic',
    modelID: 'claude-sonnet-4-20250514',
  })
  const [selectedAgent, setSelectedAgent] = useState('code')
  const [reasoningLevel, setReasoningLevel] = useState<'low' | 'medium' | 'high'>('medium')

  const isWorking = sendPrompt.isPending
  const canSend = value.trim().length > 0 && !isWorking && sessionId

  // Calculate line count for auto-sizing
  const lineCount = value.split('\n').length
  const autoRows = Math.min(Math.max(lineCount, MIN_ROWS), MAX_AUTO_ROWS)
  const lineHeight = 24 // approx line height in px
  const autoHeight = autoRows * lineHeight + 32 // padding

  // Use manual height if set, otherwise auto height
  const currentHeight = manualHeight ?? autoHeight

  // Command and file fetching
  const fetchCommands = async (): Promise<CommandInfo[]> => {
    if (!directory) return []
    try {
      const result = await client.command.list({ directory })
      return (result.data ?? []).map((cmd) => ({
        name: cmd.name,
        description: cmd.description,
      }))
    } catch {
      return []
    }
  }

  const fetchFiles = async (query: string): Promise<string[]> => {
    if (!directory || query.length < 1) return []
    try {
      const result = await client.find.files({ query, limit: 20 })
      return result.data ?? []
    } catch {
      return []
    }
  }

  // Create autocomplete extensions
  const autocompleteExtensions = [
    autocompletion({
      override: [createCommandCompletions(fetchCommands), createFileMentionCompletions(fetchFiles)],
      activateOnTyping: true,
      maxRenderedOptions: 10,
    }),
  ]

  const handleSubmit = async () => {
    if (!canSend || !sessionId) return

    const text = value.trim()
    setValue('')

    await sendPrompt.mutateAsync({
      sessionId,
      messageId: `msg_${Date.now()}`,
      text,
      agent: selectedAgent,
      model: selectedModel,
      variant: reasoningLevel,
    })
  }

  // Initialize CodeMirror
  useEffect(() => {
    if (!containerRef.current) return

    const submitKeymap = keymap.of([
      {
        key: 'Enter',
        run: () => {
          void handleSubmit()
          return true
        },
      },
      {
        key: 'Shift-Enter',
        run: () => false, // Allow newline
      },
      {
        key: 'Escape',
        run: () => {
          if (isWorking && sessionId) {
            abortSession.mutate(sessionId)
          }
          return true
        },
      },
    ])

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        setValue(update.state.doc.toString())
      }
    })

    const state = EditorState.create({
      doc: value,
      extensions: [
        promptTheme,
        cmPlaceholder('Ask anything... (/ for commands, @ for files)'),
        history(),
        bracketMatching(),
        closeBrackets(),
        syntaxHighlighting(defaultHighlightStyle),
        markdown({ base: markdownLanguage }),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        submitKeymap,
        updateListener,
        EditorView.lineWrapping,
        ...autocompleteExtensions,
      ],
    })

    const view = new EditorView({
      state,
      parent: containerRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  // Sync external value changes
  useEffect(() => {
    const view = viewRef.current
    if (!view) return

    const currentValue = view.state.doc.toString()
    if (currentValue !== value) {
      view.dispatch({
        changes: { from: 0, to: currentValue.length, insert: value },
      })
    }
  }, [value])

  return (
    <div className="relative border-t bg-background">
      <div className="mx-auto max-w-4xl p-3 md:p-4">
        {/* Input area */}
        <div className="flex items-end gap-2 rounded-xl border bg-card p-3 shadow-sm focus-within:ring-2 focus-within:ring-primary/20">
          <div
            ref={containerRef}
            style={{ height: currentHeight, minHeight: lineHeight + 32 }}
            className="flex-1 overflow-auto"
          />
          <div className="flex shrink-0 items-center gap-1">
            {isWorking ? (
              <Button
                variant="ghost"
                size="icon"
                className={cn('size-10', isMobile ? 'size-10' : 'size-8')}
                onClick={() => sessionId && abortSession.mutate(sessionId)}
              >
                <Square className="size-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                className={cn('size-10', isMobile ? 'size-10' : 'size-8')}
                onClick={handleSubmit}
                disabled={!canSend}
              >
                <Send className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Keyboard hints */}
        {!isMobile && (
          <div className="mt-2 flex justify-center gap-4 text-xs text-muted-foreground">
            <span>
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">/</kbd> commands
            </span>
            <span>
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">@</kbd> files
            </span>
            <span>
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">Enter</kbd> send
            </span>
            <span>
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">Shift+Enter</kbd> newline
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
