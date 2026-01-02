import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { PromptInput, PromptInputDrawer } from '@/components/chat/prompt-input'

import preview from '../.storybook/preview'

// Mock query client for stories
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

// Wrapper component to provide React Query context
function StoryWrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

const meta = preview.meta({
  title: 'Chat/PromptInput',
  component: PromptInput,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <StoryWrapper>
        <div className="p-4 max-w-3xl mx-auto">
          <Story />
        </div>
      </StoryWrapper>
    ),
  ],
  argTypes: {
    sessionId: {
      control: 'text',
      description: 'The session ID for the current chat',
    },
    directory: {
      control: 'text',
      description: 'The project directory path',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the input',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
A feature-rich prompt input component built on CodeMirror with:
- **Slash commands** - Type \`/\` to trigger command autocomplete
- **File mentions** - Type \`@\` to search and mention files
- **Markdown syntax highlighting** - Full markdown support with highlighting
- **Mobile-friendly** - Drawer mode with swipe gestures on mobile
- **Model/Agent selection** - Choose AI model and agent type
- **History** - Navigate through prompt history
        `,
      },
    },
  },
})

export default meta

// Default desktop view
export const Default = meta.story({
  args: {
    sessionId: 'test-session-123',
    directory: '/home/user/project',
    placeholder: 'Ask anything... (/ for commands, @ for files)',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default prompt input with CodeMirror editor, slash commands, and file mentions.',
      },
    },
  },
})

// With custom placeholder
export const CustomPlaceholder = meta.story({
  args: {
    sessionId: 'test-session-123',
    directory: '/home/user/project',
    placeholder: 'What would you like me to help you with today?',
  },
})

// Drawer variant for mobile
export const DrawerVariant = meta.story({
  render: (args) => (
    <div className="h-[400px] relative border rounded-lg overflow-hidden">
      <div className="p-4">
        <p className="text-sm text-muted-foreground mb-2">
          On mobile, the input renders inside a bottom drawer with swipe gestures.
        </p>
      </div>
      <PromptInputDrawer {...args} />
    </div>
  ),
  args: {
    sessionId: 'test-session-123',
    directory: '/home/user/project',
  },
  parameters: {
    docs: {
      description: {
        story: 'Mobile-optimized drawer variant that collapses at the bottom.',
      },
    },
  },
})

// Slash commands demo
export const SlashCommands = meta.story({
  render: (args) => (
    <div className="space-y-4">
      <div className="p-4 bg-muted/50 rounded-lg text-sm">
        <p className="font-medium mb-2">Slash Command Demo</p>
        <p className="text-muted-foreground">
          Type <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">/</kbd> to trigger
          autocomplete.
        </p>
      </div>
      <PromptInput {...args} />
    </div>
  ),
  args: {
    sessionId: 'test-session-123',
    directory: '/home/user/project',
    placeholder: 'Type / to see available commands...',
  },
})

// File mentions demo
export const FileMentions = meta.story({
  render: (args) => (
    <div className="space-y-4">
      <div className="p-4 bg-muted/50 rounded-lg text-sm">
        <p className="font-medium mb-2">File Mention Demo</p>
        <p className="text-muted-foreground">
          Type <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">@</kbd> followed by a
          filename.
        </p>
      </div>
      <PromptInput {...args} />
    </div>
  ),
  args: {
    sessionId: 'test-session-123',
    directory: '/home/user/project',
    placeholder: 'Type @ to search for files...',
  },
})

// Markdown highlighting
export const MarkdownSupport = meta.story({
  render: (args) => (
    <div className="space-y-4">
      <div className="p-4 bg-muted/50 rounded-lg text-sm">
        <p className="font-medium mb-2">Markdown Support</p>
        <p className="text-muted-foreground">
          Supports <code>**bold**</code>, <code>*italic*</code>, <code>`code`</code>, and more.
        </p>
      </div>
      <PromptInput {...args} />
    </div>
  ),
  args: {
    sessionId: 'test-session-123',
    directory: '/home/user/project',
    placeholder: 'Try typing some **markdown** here...',
  },
})

// Keyboard shortcuts demo
export const KeyboardShortcuts = meta.story({
  render: (args) => (
    <div className="space-y-4">
      <div className="p-4 bg-muted/50 rounded-lg text-sm">
        <p className="font-medium mb-2">Keyboard Shortcuts</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>
            <kbd className="px-1.5 py-0.5 bg-muted rounded">Enter</kbd> - Send
          </div>
          <div>
            <kbd className="px-1.5 py-0.5 bg-muted rounded">Shift+Enter</kbd> - New line
          </div>
          <div>
            <kbd className="px-1.5 py-0.5 bg-muted rounded">Escape</kbd> - Abort
          </div>
          <div>
            <kbd className="px-1.5 py-0.5 bg-muted rounded">!</kbd> - Shell command
          </div>
        </div>
      </div>
      <PromptInput {...args} />
    </div>
  ),
  args: {
    sessionId: 'test-session-123',
    directory: '/home/user/project',
  },
})

// Shell command demo
export const ShellCommands = meta.story({
  render: (args) => (
    <div className="space-y-4">
      <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg text-sm">
        <p className="font-medium mb-2 text-orange-600 dark:text-orange-400">Shell Command Mode</p>
        <p className="text-muted-foreground">
          Prefix with <kbd className="px-1.5 py-0.5 bg-orange-500/20 rounded">!</kbd> to run shell
          commands.
        </p>
      </div>
      <PromptInput {...args} />
    </div>
  ),
  args: {
    sessionId: 'test-session-123',
    directory: '/home/user/project',
    placeholder: 'Type !git status to run a command...',
  },
})

// Full featured demo
export const FullFeatured = meta.story({
  render: (args) => (
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
        <h3 className="font-semibold mb-2">Full-Featured Prompt Input</h3>
        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
          <ul className="space-y-1">
            <li>- Slash commands (/command)</li>
            <li>- File mentions (@file)</li>
            <li>- Markdown highlighting</li>
            <li>- Shell commands (!cmd)</li>
          </ul>
          <ul className="space-y-1">
            <li>- Model selection</li>
            <li>- Agent selection</li>
            <li>- Auto-accept toggle</li>
            <li>- History navigation</li>
          </ul>
        </div>
      </div>
      <PromptInput {...args} />
    </div>
  ),
  args: {
    sessionId: 'test-session-123',
    directory: '/home/user/project',
  },
})

// Dark mode preview
export const DarkMode = meta.story({
  render: (args) => (
    <div className="dark bg-background p-6 rounded-lg border">
      <PromptInput {...args} />
    </div>
  ),
  args: {
    sessionId: 'test-session-123',
    directory: '/home/user/project',
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'The prompt input adapts to dark mode using CSS variables.',
      },
    },
  },
})
