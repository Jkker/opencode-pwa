/**
 * Tool UI components for rendering OpenCode tool calls.
 * Uses assistant-ui's makeAssistantToolUI for type-safe tool rendering.
 */
import { makeAssistantToolUI } from '@assistant-ui/react'
import { FileCode, GitBranch, Search, Terminal, FileEdit, Folder, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToolUIWrapperProps {
  icon: React.ReactNode
  title: string
  status: 'pending' | 'running' | 'completed' | 'error'
  children: React.ReactNode
}

function ToolUIWrapper({ icon, title, status, children }: ToolUIWrapperProps) {
  return (
    <div className="my-2 rounded-lg border bg-card">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm font-medium">{title}</span>
        <span className="ml-auto">
          {status === 'running' && <Loader2 className="size-4 animate-spin text-primary" />}
          {status === 'completed' && <Check className="size-4 text-green-500" />}
          {status === 'error' && <X className="size-4 text-destructive" />}
        </span>
      </div>
      <div className="p-3 text-sm">{children}</div>
    </div>
  )
}

// File Read Tool
export const FileReadToolUI = makeAssistantToolUI<
  { path: string },
  { content: string }
>({
  toolName: 'file_read',
  render: ({ args, result, status }) => {
    const isRunning = status.type === 'running'
    return (
      <ToolUIWrapper
        icon={<FileCode className="size-4" />}
        title={`Read: ${args.path}`}
        status={isRunning ? 'running' : result ? 'completed' : 'pending'}
      >
        {isRunning && <p className="text-muted-foreground">Reading file...</p>}
        {result && (
          <pre className="max-h-48 overflow-auto rounded bg-muted p-2 text-xs">
            {result.content.slice(0, 500)}
            {result.content.length > 500 && '...'}
          </pre>
        )}
      </ToolUIWrapper>
    )
  },
})

// File Write Tool
export const FileWriteToolUI = makeAssistantToolUI<
  { path: string; content: string },
  { success: boolean }
>({
  toolName: 'file_write',
  render: ({ args, result, status }) => {
    const isRunning = status.type === 'running'
    return (
      <ToolUIWrapper
        icon={<FileEdit className="size-4" />}
        title={`Write: ${args.path}`}
        status={isRunning ? 'running' : result?.success ? 'completed' : 'pending'}
      >
        {isRunning && <p className="text-muted-foreground">Writing file...</p>}
        {result && (
          <p className={cn(result.success ? 'text-green-600' : 'text-destructive')}>
            {result.success ? 'File written successfully' : 'Failed to write file'}
          </p>
        )}
      </ToolUIWrapper>
    )
  },
})

// Search Tool
export const SearchToolUI = makeAssistantToolUI<
  { query: string; path?: string },
  { results: Array<{ file: string; line: number; content: string }> }
>({
  toolName: 'search',
  render: ({ args, result, status }) => {
    const isRunning = status.type === 'running'
    return (
      <ToolUIWrapper
        icon={<Search className="size-4" />}
        title={`Search: "${args.query}"`}
        status={isRunning ? 'running' : result ? 'completed' : 'pending'}
      >
        {isRunning && <p className="text-muted-foreground">Searching...</p>}
        {result && (
          <div className="space-y-1">
            <p className="text-muted-foreground">{result.results.length} results found</p>
            {result.results.slice(0, 5).map((r, i) => (
              <div key={i} className="rounded bg-muted p-2 text-xs">
                <span className="font-mono text-primary">{r.file}:{r.line}</span>
                <pre className="mt-1 overflow-x-auto">{r.content}</pre>
              </div>
            ))}
          </div>
        )}
      </ToolUIWrapper>
    )
  },
})

// Shell Command Tool
export const ShellToolUI = makeAssistantToolUI<
  { command: string },
  { stdout: string; stderr: string; exitCode: number }
>({
  toolName: 'shell',
  render: ({ args, result, status }) => {
    const isRunning = status.type === 'running'
    return (
      <ToolUIWrapper
        icon={<Terminal className="size-4" />}
        title={`$ ${args.command}`}
        status={isRunning ? 'running' : result ? (result.exitCode === 0 ? 'completed' : 'error') : 'pending'}
      >
        {isRunning && <p className="text-muted-foreground animate-pulse">Running command...</p>}
        {result && (
          <pre className="max-h-48 overflow-auto rounded bg-black p-2 text-xs text-green-400">
            {result.stdout || result.stderr}
          </pre>
        )}
      </ToolUIWrapper>
    )
  },
})

// Git Tool
export const GitToolUI = makeAssistantToolUI<
  { command: string },
  { output: string }
>({
  toolName: 'git',
  render: ({ args, result, status }) => {
    const isRunning = status.type === 'running'
    return (
      <ToolUIWrapper
        icon={<GitBranch className="size-4" />}
        title={`git ${args.command}`}
        status={isRunning ? 'running' : result ? 'completed' : 'pending'}
      >
        {isRunning && <p className="text-muted-foreground">Running git command...</p>}
        {result && (
          <pre className="max-h-32 overflow-auto rounded bg-muted p-2 text-xs">
            {result.output}
          </pre>
        )}
      </ToolUIWrapper>
    )
  },
})

// List Directory Tool
export const ListDirectoryToolUI = makeAssistantToolUI<
  { path: string },
  { entries: Array<{ name: string; type: 'file' | 'directory' }> }
>({
  toolName: 'list_directory',
  render: ({ args, result, status }) => {
    const isRunning = status.type === 'running'
    return (
      <ToolUIWrapper
        icon={<Folder className="size-4" />}
        title={`List: ${args.path}`}
        status={isRunning ? 'running' : result ? 'completed' : 'pending'}
      >
        {isRunning && <p className="text-muted-foreground">Listing directory...</p>}
        {result && (
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
            {result.entries.slice(0, 20).map((entry, i) => (
              <div key={i} className="flex items-center gap-1 text-xs">
                {entry.type === 'directory' ? (
                  <Folder className="size-3 text-primary" />
                ) : (
                  <FileCode className="size-3 text-muted-foreground" />
                )}
                <span className="truncate">{entry.name}</span>
              </div>
            ))}
          </div>
        )}
      </ToolUIWrapper>
    )
  },
})

// Export all tool UIs
export const toolUIs = [
  FileReadToolUI,
  FileWriteToolUI,
  SearchToolUI,
  ShellToolUI,
  GitToolUI,
  ListDirectoryToolUI,
]
