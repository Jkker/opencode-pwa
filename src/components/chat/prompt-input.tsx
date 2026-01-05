// Feature-rich CodeMirror-based prompt input with:
// - Multiple part types (Text, File, Agent, Image)
// - Image/PDF Attachments (paste, drag & drop, file picker)
// - File/Agent Autocomplete (@ trigger)
// - Slash Commands (/ trigger)
// - Prompt History (Up/Down arrows)
// - Shell Mode (! prefix)
// - Agent Selection
// - Model Selection with thinking effort toggle
// - Auto-accept Toggle
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
  History,
  Terminal,
  Slash,
  AtSign,
  Paperclip,
  X,
  ChevronsRight,
  FileText,
  Bot,
  Brain,
} from 'lucide-react'
import { useRef, useEffect, useState, useTransition } from 'react'
import { Drawer } from 'vaul'

import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useIsMobile } from '@/hooks/use-mobile'
import { useClient } from '@/lib/opencode/client'
import {
  useSendPromptMutation,
  useAbortSessionMutation,
  useProvidersQuery,
  useAgentsQuery,
  useCommandsQuery,
  useShellCommandMutation,
  useCustomCommandMutation,
  type Agent,
  type Provider,
  type Model,
} from '@/lib/opencode/queries'
import { cn } from '@/lib/utils'
import { promptStore, type Prompt, type ImageAttachmentPart } from '@/stores/prompt-store'
import { settingStore } from '@/stores/setting-store'

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
const ACCEPTED_FILE_TYPES = [...ACCEPTED_IMAGE_TYPES, 'application/pdf']

const PLACEHOLDERS = [
  'Fix a TODO in the codebase',
  'What is the tech stack of this project?',
  'Fix broken tests',
  'Explain how authentication works',
  'Find and fix security vulnerabilities',
  'Add unit tests for the user service',
]

// Types for commands and file completions
interface CommandInfo {
  name: string
  description?: string
}

interface AtOption {
  type: 'agent' | 'file'
  name: string
  display: string
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

// Shell mode theme
const shellTheme = EditorView.theme({
  '&': {
    fontFamily: 'var(--font-mono, monospace)',
  },
  '.cm-content': {
    fontFamily: 'var(--font-mono, monospace)',
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

// Create @ file/agent mention completion source
function createAtMentionCompletions(fetchOptions: (query: string) => Promise<AtOption[]>) {
  return async (context: CompletionContext) => {
    const word = context.matchBefore(/@[\w./-]*/)
    if (!word) return null
    if (word.from === word.to && !context.explicit) return null

    const query = word.text.slice(1)
    const options = await fetchOptions(query)

    return {
      from: word.from,
      options: options.map((opt) => ({
        label: `@${opt.display}`,
        detail: opt.type === 'agent' ? 'Agent' : 'File',
        type: opt.type === 'agent' ? 'keyword' : 'variable',
        apply: `@${opt.display} `,
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
  onArrowUp,
  onArrowDown,
  onExclamation,
  placeholder = 'Ask anything...',
  extensions = [],
  className,
  onFocus,
  onBlur,
  isShellMode = false,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onEscape?: () => void
  onArrowUp?: () => boolean
  onArrowDown?: () => boolean
  onExclamation?: () => void
  placeholder?: string
  extensions?: Extension[]
  className?: string
  onFocus?: () => void
  onBlur?: () => void
  isShellMode?: boolean
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onSubmitRef = useRef(onSubmit)
  const onChangeRef = useRef(onChange)
  const onEscapeRef = useRef(onEscape)
  const onArrowUpRef = useRef(onArrowUp)
  const onArrowDownRef = useRef(onArrowDown)
  const onExclamationRef = useRef(onExclamation)

  // Keep refs updated
  onSubmitRef.current = onSubmit
  onChangeRef.current = onChange
  onEscapeRef.current = onEscape
  onArrowUpRef.current = onArrowUp
  onArrowDownRef.current = onArrowDown
  onExclamationRef.current = onExclamation

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
        run: () => false, // Allow default newline behavior
      },
      {
        key: 'Escape',
        run: () => {
          onEscapeRef.current?.()
          return true
        },
      },
      {
        key: 'ArrowUp',
        run: () => onArrowUpRef.current?.() ?? false,
      },
      {
        key: 'ArrowDown',
        run: () => onArrowDownRef.current?.() ?? false,
      },
    ])

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newValue = update.state.doc.toString()
        onChangeRef.current(newValue)

        // Check for ! at start of input
        if (newValue === '!' && onExclamationRef.current) {
          onExclamationRef.current()
        }
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
        ...(isShellMode ? [shellTheme] : []),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShellMode])

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

  // Focus the editor
  const focus = () => viewRef.current?.focus()

  return (
    <div
      ref={containerRef}
      className={cn('min-h-11 max-h-50 overflow-auto', className)}
      onClick={focus}
    />
  )
}

// Image Attachment Preview Component
function ImageAttachmentPreview({
  attachment,
  onRemove,
}: {
  attachment: ImageAttachmentPart
  onRemove: () => void
}) {
  return (
    <div className="relative group">
      {attachment.mime.startsWith('image/') ? (
        <img
          src={attachment.dataUrl}
          alt={attachment.filename}
          className="size-16 rounded-md object-cover border border-border"
        />
      ) : (
        <div className="size-16 rounded-md bg-muted flex items-center justify-center border border-border">
          <FileText className="size-6 text-muted-foreground" />
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-background border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
      >
        <X className="size-3 text-muted-foreground" />
      </button>
      <div className="absolute bottom-0 left-0 right-0 px-1 py-0.5 bg-black/50 rounded-b-md">
        <span className="text-[10px] text-white truncate block">{attachment.filename}</span>
      </div>
    </div>
  )
}

// Agent Selector Component
function AgentSelector({
  agents,
  selectedAgent,
  onSelect,
}: {
  agents: Agent[]
  selectedAgent: string
  onSelect: (agent: string) => void
}) {
  const visibleAgents = agents.filter((a) => !a.hidden && a.mode !== 'subagent')

  return (
    <Combobox value={selectedAgent} onValueChange={(v) => v && onSelect(v)}>
      <ComboboxInput
        className="h-7 min-w-20 max-w-32 text-xs capitalize"
        placeholder="Agent"
        showTrigger
      />
      <ComboboxContent>
        <ComboboxList>
          <ComboboxEmpty>No agents found</ComboboxEmpty>
          {visibleAgents.map((agent) => (
            <ComboboxItem key={agent.name} value={agent.name} className="capitalize">
              <Bot className="size-4 text-primary" />
              {agent.name}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

// Model Selector Component
function ModelSelector({
  providers,
  selectedModel,
  selectedVariant,
  onSelectModel,
  onSelectVariant,
}: {
  providers: Provider[]
  selectedModel: { providerID: string; modelID: string }
  selectedVariant?: string
  onSelectModel: (model: { providerID: string; modelID: string }) => void
  onSelectVariant: (variant: string | undefined) => void
}) {
  const [open, setOpen] = useState(false)

  // Get all available models
  const allModels: Array<{ provider: Provider; model: Model }> = providers.flatMap((p) =>
    Object.values(p.models).map((m) => ({ provider: p, model: m })),
  )

  // Find current model
  const currentModel = allModels.find(
    (m) => m.provider.id === selectedModel.providerID && m.model.id === selectedModel.modelID,
  )

  // Get variants for current model
  const variants = currentModel?.model.variants ? Object.keys(currentModel.model.variants) : []

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={<Button variant="ghost" size="sm" className="h-7 text-xs gap-1 max-w-40" />}
        >
          <span className="truncate">{currentModel?.model.name ?? 'Select model'}</span>
          <ChevronDown className="size-3" />
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          className="w-72 max-h-80 overflow-auto p-1"
          sideOffset={8}
        >
          <div className="space-y-1">
            {providers.map((provider) => (
              <div key={provider.id}>
                <div className="px-2 py-1 text-xs text-muted-foreground font-medium">
                  {provider.name}
                </div>
                {Object.values(provider.models).map((model) => (
                  <button
                    key={`${provider.id}:${model.id}`}
                    className={cn(
                      'w-full text-left px-2 py-1.5 text-sm rounded-md hover:bg-accent',
                      provider.id === selectedModel.providerID &&
                        model.id === selectedModel.modelID &&
                        'bg-accent',
                    )}
                    onClick={() => {
                      onSelectModel({ providerID: provider.id, modelID: model.id })
                      setOpen(false)
                    }}
                  >
                    {model.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {variants.length > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs capitalize"
                  onClick={() => {
                    const currentIndex = selectedVariant ? variants.indexOf(selectedVariant) : -1
                    const nextIndex = (currentIndex + 1) % (variants.length + 1)
                    onSelectVariant(nextIndex === variants.length ? undefined : variants[nextIndex])
                  }}
                />
              }
            >
              <Brain className="size-3 mr-1" />
              {selectedVariant ?? 'Default'}
            </TooltipTrigger>
            <TooltipContent>Thinking effort</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

// Main Prompt Input Component
export function PromptInput({
  sessionId,
  directory,
  onFocus,
  onBlur,
  className,
}: PromptInputProps) {
  const [value, setValue] = useState('')
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [showOptions, setShowOptions] = useState(false)
  const [, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const client = useClient(directory)
  const sendPrompt = useSendPromptMutation()
  const shellCommand = useShellCommandMutation()
  const customCommand = useCustomCommandMutation()
  const abortSession = useAbortSessionMutation()
  const isMobile = useIsMobile()

  // Queries
  const { data: providersData } = useProvidersQuery()
  const { data: agents = [] } = useAgentsQuery(directory)
  const { data: commands = [] } = useCommandsQuery(directory)

  // Store state
  const [autoAcceptEdits, setAutoAcceptEdits] = settingStore.useState('autoAcceptEdits')
  const [selectedAgent, setSelectedAgent] = settingStore.useState('selectedAgent')
  const [selectedModel, setSelectedModel] = settingStore.useState('selectedModel')
  const [selectedVariant, setSelectedVariant] = settingStore.useState('selectedVariant')

  const mode = promptStore.useValue('mode')
  const imageAttachments = promptStore.useValue('imageAttachments')
  const historyIndex = promptStore.useValue('historyIndex')

  const isWorking = sendPrompt.isPending || shellCommand.isPending || customCommand.isPending
  const canSend = (value.trim().length > 0 || imageAttachments.length > 0) && !isWorking
  const isShellMode = mode === 'shell'

  // Connected providers
  const connectedProviders =
    providersData?.all.filter((p) => providersData.connected.includes(p.id)) ?? []

  // Rotate placeholder
  useEffect(() => {
    if (sessionId) return
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length)
    }, 6500)
    return () => clearInterval(interval)
  }, [sessionId])

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

  // @ mention options fetching (files + agents)
  const fetchAtOptions = async (query: string): Promise<AtOption[]> => {
    const agentOptions: AtOption[] = agents
      .filter((a) => !a.hidden && a.mode !== 'subagent')
      .filter((a) => a.name.toLowerCase().includes(query.toLowerCase()))
      .map((a) => ({ type: 'agent', name: a.name, display: a.name }))

    if (query.length < 1) return agentOptions

    try {
      const result = await client.find.files({ query, limit: 20 })
      const fileOptions: AtOption[] = (result.data ?? []).map((path) => ({
        type: 'file',
        name: path,
        display: path,
      }))
      return [...agentOptions, ...fileOptions]
    } catch {
      return agentOptions
    }
  }

  // Create autocomplete extensions
  const autocompleteExtensions = [
    autocompletion({
      override: [
        createCommandCompletions(fetchCommands),
        createAtMentionCompletions(fetchAtOptions),
      ],
      activateOnTyping: true,
      maxRenderedOptions: 10,
    }),
  ]

  // Handle image attachment
  const handleAddImage = async (file: File) => {
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) return

    const reader = new FileReader()
    reader.addEventListener('load', () => {
      const result = reader.result
      if (typeof result !== 'string') return
      const attachment: ImageAttachmentPart = {
        type: 'image',
        id: crypto.randomUUID(),
        filename: file.name,
        mime: file.type,
        dataUrl: result,
      }
      promptStore.actions.addImageAttachment(attachment)
    })
    reader.readAsDataURL(file)
  }

  // Handle paste
  const handlePaste = (event: ClipboardEvent) => {
    const clipboardData = event.clipboardData
    if (!clipboardData) return

    const items = Array.from(clipboardData.items)
    const imageItems = items.filter((item) => ACCEPTED_FILE_TYPES.includes(item.type))

    if (imageItems.length > 0) {
      event.preventDefault()
      for (const item of imageItems) {
        const file = item.getAsFile()
        if (file) void handleAddImage(file)
      }
    }
  }

  // Handle drag & drop - document level handlers
  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    if (event.dataTransfer?.types.includes('Files')) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (event: DragEvent) => {
    if (!event.relatedTarget) {
      setIsDragging(false)
    }
  }

  const handleDrop = async (event: DragEvent) => {
    event.preventDefault()
    setIsDragging(false)

    const dropped = event.dataTransfer?.files
    if (!dropped) return

    for (const file of Array.from(dropped)) {
      if (ACCEPTED_FILE_TYPES.includes(file.type)) {
        await handleAddImage(file)
      }
    }
  }

  // React drag handlers for the container
  const onContainerDragOver: React.DragEventHandler = (event) => {
    event.preventDefault()
    if (event.dataTransfer?.types.includes('Files')) {
      setIsDragging(true)
    }
  }

  const onContainerDragLeave: React.DragEventHandler = (event) => {
    if (!event.relatedTarget) {
      setIsDragging(false)
    }
  }

  const onContainerDrop: React.DragEventHandler = async (event) => {
    event.preventDefault()
    setIsDragging(false)

    const dropped = event.dataTransfer?.files
    if (!dropped) return

    for (const file of Array.from(dropped)) {
      if (ACCEPTED_FILE_TYPES.includes(file.type)) {
        await handleAddImage(file)
      }
    }
  }

  // Set up global listeners for paste and drag/drop
  useEffect(() => {
    document.addEventListener('paste', handlePaste)
    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('drop', handleDrop)
    return () => {
      document.removeEventListener('paste', handlePaste)
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('dragleave', handleDragLeave)
      document.removeEventListener('drop', handleDrop)
    }
  }, [])

  // Handle history navigation
  const handleArrowUp = (): boolean => {
    const trimmed = value.trim()
    if (trimmed.length > 0 && value.includes('\n')) return false

    const currentPrompt: Prompt = [{ type: 'text', content: value, start: 0, end: value.length }]
    const historyPrompt = promptStore.actions.navigateHistory('up', currentPrompt)

    if (historyPrompt) {
      const text = historyPrompt
        .filter((p) => p.type === 'text')
        .map((p) => p.content)
        .join('')
      setValue(text)
      return true
    }
    return false
  }

  const handleArrowDown = (): boolean => {
    const currentPrompt: Prompt = [{ type: 'text', content: value, start: 0, end: value.length }]
    const historyPrompt = promptStore.actions.navigateHistory('down', currentPrompt)

    if (historyPrompt) {
      const text = historyPrompt
        .filter((p) => p.type === 'text')
        .map((p) => p.content)
        .join('')
      setValue(text)
      return true
    }
    return false
  }

  // Handle ! prefix for shell mode
  const handleExclamation = () => {
    if (value === '!') {
      promptStore.actions.setMode('shell')
      setValue('')
    }
  }

  // Handle escape
  const handleEscape = () => {
    if (isShellMode) {
      promptStore.actions.setMode('normal')
      return
    }
    if (isWorking) {
      abortSession.mutate(sessionId)
    }
  }

  // Handle submit
  const handleSubmit = async () => {
    if (!canSend) return

    const text = value.trim()
    const _images = imageAttachments.slice()
    const currentMode = mode

    // Build prompt for history
    const currentPrompt: Prompt = [{ type: 'text', content: text, start: 0, end: text.length }]
    promptStore.actions.addToHistory(currentPrompt, currentMode)

    // Clear input
    setValue('')
    promptStore.actions.clearImageAttachments()
    promptStore.actions.setMode('normal')
    promptStore.actions.resetHistoryNavigation()

    // Handle shell mode
    if (currentMode === 'shell') {
      await shellCommand.mutateAsync({
        sessionId,
        command: text,
        agent: selectedAgent,
        model: selectedModel,
      })
      return
    }

    // Handle custom commands
    if (text.startsWith('/')) {
      const [cmdName, ...args] = text.split(' ')
      const commandName = cmdName.slice(1)
      const customCmd = commands.find((c) => c.name === commandName)
      if (customCmd) {
        await customCommand.mutateAsync({
          sessionId,
          command: commandName,
          args: args.join(' '),
          agent: selectedAgent,
          model: `${selectedModel.providerID}/${selectedModel.modelID}`,
          variant: selectedVariant,
        })
        return
      }
    }

    await sendPrompt.mutateAsync({
      sessionId,
      messageId: `msg_${Date.now()}`,
      text,
      agent: selectedAgent,
      model: selectedModel,
      variant: selectedVariant,
    })
  }

  // Handle value change
  const handleValueChange = (newValue: string) => {
    startTransition(() => {
      setValue(newValue)
      // Reset history navigation when typing
      if (historyIndex >= 0) {
        promptStore.actions.resetHistoryNavigation()
      }
    })
  }

  const editorContent = (
    <div
      className={cn('flex flex-col gap-2 relative', className)}
      onDragOver={onContainerDragOver}
      onDragLeave={onContainerDragLeave}
      onDrop={onContainerDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90 border-2 border-dashed border-primary rounded-xl pointer-events-none">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Paperclip className="size-8" />
            <span className="text-sm">Drop images or PDFs here</span>
          </div>
        </div>
      )}

      {/* Options bar */}
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 transition-all',
          isMobile && !showOptions && 'hidden',
        )}
      >
        {/* Agent selector */}
        {!isShellMode && agents.length > 0 && (
          <AgentSelector
            agents={agents}
            selectedAgent={selectedAgent}
            onSelect={setSelectedAgent}
          />
        )}

        {/* Model selector */}
        {!isShellMode && connectedProviders.length > 0 && (
          <ModelSelector
            providers={connectedProviders}
            selectedModel={selectedModel}
            selectedVariant={selectedVariant}
            onSelectModel={setSelectedModel}
            onSelectVariant={setSelectedVariant}
          />
        )}

        {/* Auto-accept toggle */}
        {!isShellMode && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn('h-7 text-xs', autoAcceptEdits && 'text-green-500')}
                    onClick={() => setAutoAcceptEdits(!autoAcceptEdits)}
                  />
                }
              >
                <ChevronsRight className="size-4" />
              </TooltipTrigger>
              <TooltipContent>
                {autoAcceptEdits ? 'Auto-accept enabled' : 'Auto-accept disabled'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* History indicator */}
        {historyIndex >= 0 && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <History className="size-3" />
            <span className="hidden sm:inline">History {historyIndex + 1}</span>
          </span>
        )}
      </div>

      {/* Image attachments */}
      {imageAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {imageAttachments.map((attachment) => (
            <ImageAttachmentPreview
              key={attachment.id}
              attachment={attachment}
              onRemove={() => promptStore.actions.removeImageAttachment(attachment.id)}
            />
          ))}
        </div>
      )}

      {/* Input container */}
      <div
        className={cn(
          'relative flex items-end gap-2 rounded-xl border bg-card p-3 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-shadow',
          isShellMode && 'border-orange-500/50 bg-orange-500/5',
        )}
      >
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

        {/* Shell mode indicator */}
        {isShellMode && (
          <div className="flex items-center gap-1 text-orange-500 mr-1">
            <Terminal className="size-4" />
          </div>
        )}

        <CodeMirrorEditor
          value={value}
          onChange={handleValueChange}
          onSubmit={handleSubmit}
          onEscape={handleEscape}
          onArrowUp={handleArrowUp}
          onArrowDown={handleArrowDown}
          onExclamation={handleExclamation}
          placeholder={
            isShellMode
              ? 'Enter shell command...'
              : `Ask anything... "${PLACEHOLDERS[placeholderIndex]}"`
          }
          extensions={isShellMode ? [] : autocompleteExtensions}
          className="flex-1"
          onFocus={onFocus}
          onBlur={onBlur}
          isShellMode={isShellMode}
        />

        <div className="flex items-center gap-1">
          {/* File attachment button */}
          {!isShellMode && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FILE_TYPES.join(',')}
                className="hidden"
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0]
                  if (file) void handleAddImage(file)
                  e.currentTarget.value = ''
                }}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => fileInputRef.current?.click()}
                      />
                    }
                  >
                    <Paperclip className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent>Attach file</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}

          {/* Shell mode exit hint */}
          {isShellMode && <span className="text-xs text-muted-foreground mr-2">ESC to exit</span>}

          {/* Send/Stop button */}
          {isWorking ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-10 md:size-8"
                      onClick={() => abortSession.mutate(sessionId)}
                    />
                  }
                >
                  <Square className="size-4" />
                </TooltipTrigger>
                <TooltipContent>Stop (ESC)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      size="icon"
                      className="size-10 md:size-8"
                      onClick={handleSubmit}
                      disabled={!canSend}
                    />
                  }
                >
                  <Send className="size-4" />
                </TooltipTrigger>
                <TooltipContent>Send (Enter)</TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
        <span>files & agents</span>
      </span>
      <span className="flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">!</kbd>
        <span>shell</span>
      </span>
      <span className="hidden sm:flex items-center gap-1">
        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↑↓</kbd>
        <span>history</span>
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
