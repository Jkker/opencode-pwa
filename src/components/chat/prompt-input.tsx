// Feature-rich CodeMirror-based prompt input with:
// - Slash command autocomplete (/command)
// - @ file lookup (@file)
// - Markdown syntax highlighting
// - Mobile-friendly drawer with swipe gesture
import { autocompletion, closeBrackets, type CompletionContext } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { bracketMatching, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { EditorState, type Extension } from '@codemirror/state'
import { EditorView, keymap, placeholder as cmPlaceholder } from '@codemirror/view'
import {
  Send,
  Square,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
  History,
  Terminal,
  Slash,
  AtSign,
} from 'lucide-react'
import { useRef, useEffect, useState } from 'react'
import { Drawer } from 'vaul'

import { SelectAgentDialog } from '@/components/ai-elements/select-agent-dialog'
import { SelectModelDialog } from '@/components/ai-elements/select-model-dialog'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { useSelectedModel } from '@/hooks/use-selected-model'
import { useClient } from '@/lib/opencode/client'
import { useSendPromptMutation, useAbortSessionMutation } from '@/lib/opencode/queries'
import { cn } from '@/lib/utils'
import { settingStore } from '@/stores/setting-store'

// Types for commands and file completions
interface CommandInfo {
  name: string
  description?: string
}

// CodeMirror theme for chat input
const chatTheme = EditorView.theme({
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
  // Autocomplete popup styling
  '.cm-tooltip-autocomplete': {
    backgroundColor: 'var(--popover)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    overflow: 'hidden',
    padding: '4px',
  },
  '.cm-tooltip-autocomplete ul': {
    fontFamily: 'inherit',
    maxHeight: '240px',
  },
  '.cm-tooltip-autocomplete ul li': {
    padding: '8px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderRadius: '8px',
    margin: '2px 0',
    cursor: 'pointer',
  },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: 'var(--accent)',
    color: 'var(--accent-foreground)',
  },
  '.cm-tooltip-autocomplete ul li:hover:not([aria-selected])': {
    backgroundColor: 'var(--muted)',
  },
  '.cm-completionIcon': {
    width: '18px',
    height: '18px',
    opacity: '0.8',
    flexShrink: '0',
  },
  '.cm-completionIcon-keyword': {
    color: 'var(--primary)',
  },
  '.cm-completionIcon-variable': {
    color: 'var(--chart-2)',
  },
  '.cm-completionLabel': {
    flex: '1',
    fontWeight: '500',
  },
  '.cm-completionDetail': {
    fontSize: '12px',
    opacity: '0.6',
    marginLeft: 'auto',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  // Markdown syntax highlighting improvements
  '.cm-header': {
    fontWeight: 'bold',
  },
  '.cm-strong': {
    fontWeight: 'bold',
  },
  '.cm-emphasis': {
    fontStyle: 'italic',
  },
  '.cm-strikethrough': {
    textDecoration: 'line-through',
  },
  '.cm-link': {
    color: 'var(--primary)',
    textDecoration: 'underline',
  },
  '.cm-url': {
    color: 'var(--muted-foreground)',
  },
  '.cm-inlineCode, .cm-monospace': {
    backgroundColor: 'var(--muted)',
    borderRadius: '4px',
    padding: '0 4px',
    fontFamily: 'var(--font-mono, monospace)',
    fontSize: '0.9em',
  },
})

// Create slash command completion source
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

// Create @ file mention completion source
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

interface PromptInputProps {
  sessionId: string
  directory: string
  onFocus?: () => void
  onBlur?: () => void
  placeholder?: string
  className?: string
}

// CodeMirror Editor Component
function CodeMirrorEditor({
  value,
  onChange,
  onSubmit,
  onEscape,
  placeholder = 'Ask anything...',
  extensions = [],
  className,
  onFocus,
  onBlur,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onEscape?: () => void
  placeholder?: string
  extensions?: Extension[]
  className?: string
  onFocus?: () => void
  onBlur?: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onSubmitRef = useRef(onSubmit)
  const onChangeRef = useRef(onChange)
  const onEscapeRef = useRef(onEscape)

  // Keep refs updated
  onSubmitRef.current = onSubmit
  onChangeRef.current = onChange
  onEscapeRef.current = onEscape

  useEffect(() => {
    if (!containerRef.current) return

    const submitKeymap = keymap.of([
      {
        key: 'Enter',
        run: () => {
          onSubmitRef.current()
          return true
        },
      },
      {
        key: 'Shift-Enter',
        run: () => {
          return false // Allow default newline behavior
        },
      },
      {
        key: 'Escape',
        run: () => {
          onEscapeRef.current?.()
          return true
        },
      },
    ])

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChangeRef.current(update.state.doc.toString())
      }
      if (update.focusChanged) {
        if (update.view.hasFocus) {
          onFocus?.()
        } else {
          onBlur?.()
        }
      }
    })

    const state = EditorState.create({
      doc: value,
      extensions: [
        chatTheme,
        cmPlaceholder(placeholder),
        history(),
        bracketMatching(),
        closeBrackets(),
        syntaxHighlighting(defaultHighlightStyle),
        markdown({ base: markdownLanguage }),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        submitKeymap,
        updateListener,
        EditorView.lineWrapping,
        ...extensions,
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
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    <div ref={containerRef} className={cn('min-h-[44px] max-h-[200px] overflow-auto', className)} />
  )
}

// Main Prompt Input Component
export function PromptInput({
  sessionId,
  directory,
  onFocus,
  onBlur,
  placeholder = 'Ask anything... (/ for commands, @ for files)',
  className,
}: PromptInputProps) {
  const [value, setValue] = useState('')
  const [promptHistory, setPromptHistory] = useState<string[]>([])
  const [showOptions, setShowOptions] = useState(false)

  const client = useClient(directory)
  const sendPrompt = useSendPromptMutation()
  const abortSession = useAbortSessionMutation()
  const autoAcceptEdits = settingStore.useState('autoAcceptEdits')
  const isMobile = useIsMobile()

  // Use hooks for model/agent selection from persistent store
  const { selectedModel, selectedVariant, setModel, setVariant, displayName } = useSelectedModel()
  const selectedAgent = settingStore.useValue('selectedAgent')
  const setSelectedAgent = settingStore.actions.setSelectedAgent

  const isWorking = sendPrompt.isPending
  const canSend = value.trim().length > 0 && !isWorking
  const isShellCommand = value.trim().startsWith('!')

  // Command fetching
  const fetchCommands = async (): Promise<CommandInfo[]> => {
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

  // File fetching
  const fetchFiles = async (query: string): Promise<string[]> => {
    if (query.length < 1) return []
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
    if (!canSend) return

    const text = value.trim()
    const actualText = isShellCommand ? text.slice(1).trim() : text

    setPromptHistory((prev) => [...prev.slice(-49), text])
    setValue('')

    await sendPrompt.mutateAsync({
      sessionId,
      messageId: `msg_${Date.now()}`,
      text: isShellCommand ? `Run this shell command: ${actualText}` : actualText,
      agent: selectedAgent,
      model: selectedModel,
      variant: selectedVariant,
    })
  }

  const editorContent = (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Options bar */}
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 transition-all',
          isMobile && !showOptions && 'hidden',
        )}
      >
        {/* Model selector */}
        <SelectModelDialog
          selectedModel={selectedModel}
          onSelectModel={setModel}
          selectedVariant={selectedVariant}
          onSelectVariant={setVariant}
          variant="popover"
        >
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
            <Sparkles className="size-3" />
            <span className="max-w-24 truncate">{displayName}</span>
            <ChevronDown className="size-3" />
          </Button>
        </SelectModelDialog>

        {/* Agent selector */}
        <SelectAgentDialog
          selectedAgent={selectedAgent}
          onSelectAgent={setSelectedAgent}
          directory={directory}
          variant="popover"
        />

        {/* Auto-accept toggle */}
        <Button
          variant={autoAcceptEdits ? 'default' : 'outline'}
          size="sm"
          className="gap-1.5 text-xs h-7"
          onClick={settingStore.actions.toggleAutoAcceptEdits}
        >
          <Check className="size-3" />
          <span className="hidden sm:inline">Auto-accept</span>
        </Button>

        {/* History indicator */}
        {promptHistory.length > 0 && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <History className="size-3" />
            <span className="hidden sm:inline">{promptHistory.length} in history</span>
          </span>
        )}
      </div>

      {/* Input container */}
      <div className="relative flex items-end gap-2 rounded-xl border bg-card p-3 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-shadow">
        {/* Mobile options toggle */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => setShowOptions(!showOptions)}
          >
            {showOptions ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </Button>
        )}

        {/* Shell command indicator */}
        {isShellCommand && (
          <div className="absolute left-3 top-3 flex items-center gap-1 text-orange-500">
            <Terminal className="size-4" />
          </div>
        )}

        <CodeMirrorEditor
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          onEscape={isWorking ? () => abortSession.mutate(sessionId) : undefined}
          placeholder={placeholder}
          extensions={autocompleteExtensions}
          className={cn('flex-1', isShellCommand && 'pl-6')}
          onFocus={onFocus}
          onBlur={onBlur}
        />

        <div className="flex items-center gap-1">
          {isWorking ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-10 md:size-8"
              onClick={() => abortSession.mutate(sessionId)}
            >
              <Square className="size-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              className="size-10 md:size-8"
              onClick={handleSubmit}
              disabled={!canSend}
            >
              <Send className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  return editorContent
}

// Keyboard shortcut hints for the input
function KeyboardHints({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground',
        className,
      )}
    >
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">/</kbd>
        <span>commands</span>
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">@</kbd>
        <span>files</span>
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">!</kbd>
        <span>shell</span>
      </span>
      <span className="hidden sm:flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd>
        <span>send</span>
      </span>
      <span className="hidden sm:flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Shift+Enter</kbd>
        <span>newline</span>
      </span>
    </div>
  )
}

// Mobile Drawer Wrapper Component
export function PromptInputDrawer({ sessionId, directory, className }: PromptInputProps) {
  const [open, setOpen] = useState(true)
  const [snap, setSnap] = useState<number | string | null>('148px')
  const isMobile = useIsMobile()

  // Snap points: collapsed (148px for trigger UI), half, expanded
  const snapPoints = ['148px', 0.5, 1]

  // For desktop, render inline with keyboard hints
  if (!isMobile) {
    return (
      <div className={cn('border-t bg-background p-3 md:p-4', className)}>
        <div className="mx-auto max-w-3xl space-y-2">
          <PromptInput sessionId={sessionId} directory={directory} />
          <KeyboardHints className="justify-center" />
        </div>
      </div>
    )
  }

  // For mobile, render in a Vaul drawer with snap points
  return (
    <Drawer.Root
      open={open}
      onOpenChange={setOpen}
      snapPoints={snapPoints}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      modal={false}
      dismissible={false}
    >
      <Drawer.Portal>
        <Drawer.Content
          className={cn(
            'fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-xl border-t bg-background outline-none',
            // Dynamic height based on snap point
            snap === 1 && 'h-[100dvh]',
            snap === 0.5 && 'h-[50dvh]',
            snap === '148px' && 'h-[148px]',
            className,
          )}
          aria-describedby={undefined}
        >
          {/* Accessible title for screen readers */}
          <Drawer.Title className="sr-only">Chat Input</Drawer.Title>

          {/* Drawer handle for swipe gesture */}
          <Drawer.Handle className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-muted" />

          {/* Collapsed state - show trigger UI */}
          {snap === '148px' && (
            <div
              className="flex flex-col items-center gap-2 p-3 cursor-pointer"
              onClick={() => setSnap(0.5)}
            >
              <div className="flex w-full items-center gap-2 rounded-xl border bg-card p-3 shadow-sm">
                <span className="text-muted-foreground text-sm flex-1">
                  Ask anything... (swipe up)
                </span>
                <div className="flex items-center gap-1.5">
                  <Slash className="size-3 text-muted-foreground" />
                  <AtSign className="size-3 text-muted-foreground" />
                  <Send className="size-4 text-primary" />
                </div>
              </div>
            </div>
          )}

          {/* Expanded states - show full input */}
          {snap !== '148px' && (
            <div className="mx-auto w-full max-w-3xl flex-1 overflow-auto px-4 pt-2 pb-safe">
              <PromptInput sessionId={sessionId} directory={directory} onFocus={() => setSnap(1)} />
              <KeyboardHints className="mt-3 justify-center" />
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

export default PromptInputDrawer
