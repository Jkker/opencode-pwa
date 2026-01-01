/**
 * Review Panel component for viewing file changes and diffs.
 * Shows modified files in the current session with diff views.
 */
import { useState } from 'react'
import { 
  X, 
  FileCode, 
  Plus, 
  Minus, 
  Maximize2,
  Minimize2,
  SplitSquareVertical,
  AlignJustify,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { FileDiff } from '@/lib/opencode'

type DiffViewMode = 'unified' | 'split'

interface ReviewPanelProps {
  isOpen: boolean
  onClose: () => void
  diffs: FileDiff[]
  sessionId: string
}

export function ReviewPanel({ isOpen, onClose, diffs, sessionId: _sessionId }: ReviewPanelProps) {
  const [activeFile, setActiveFile] = useState<string | null>(diffs[0]?.file ?? null)
  const [viewMode, setViewMode] = useState<DiffViewMode>('unified')
  const [isMaximized, setIsMaximized] = useState(false)

  const activeDiff = diffs.find((d) => d.file === activeFile)
  
  // Calculate total stats
  const totalAdditions = diffs.reduce((sum, d) => sum + d.additions, 0)
  const totalDeletions = diffs.reduce((sum, d) => sum + (d.before.length > d.after.length ? 1 : 0), 0)

  if (!isOpen) return null

  return (
    <div 
      className={cn(
        'flex flex-col border-l bg-background',
        isMaximized ? 'fixed inset-0 z-50' : 'w-[400px] shrink-0'
      )}
    >
      {/* Header */}
      <div className="flex h-10 items-center justify-between border-b px-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Review</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
            {diffs.length} file{diffs.length !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1 text-xs text-green-600">
            <Plus className="size-3" />
            {totalAdditions}
          </span>
          <span className="flex items-center gap-1 text-xs text-red-600">
            <Minus className="size-3" />
            {totalDeletions}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setViewMode(viewMode === 'unified' ? 'split' : 'unified')}
            title={viewMode === 'unified' ? 'Split view' : 'Unified view'}
          >
            {viewMode === 'unified' ? (
              <SplitSquareVertical className="size-4" />
            ) : (
              <AlignJustify className="size-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setIsMaximized(!isMaximized)}
          >
            {isMaximized ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* File Tabs */}
      {diffs.length > 0 && (
        <div className="flex overflow-x-auto border-b">
          {diffs.map((diff) => {
            const fileName = diff.file.split('/').at(-1) ?? diff.file
            const isActive = diff.file === activeFile
            
            return (
              <button
                key={diff.file}
                onClick={() => setActiveFile(diff.file)}
                className={cn(
                  'flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm whitespace-nowrap',
                  isActive 
                    ? 'border-primary text-foreground' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <FileCode className="size-3.5" />
                <span>{fileName}</span>
                <span className="text-xs text-green-600">+{diff.additions}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Diff Content */}
      <div className="flex-1 overflow-auto">
        {activeDiff ? (
          <DiffView diff={activeDiff} mode={viewMode} />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <p>No file selected</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface DiffViewProps {
  diff: FileDiff
  mode: DiffViewMode
}

function DiffView({ diff, mode }: DiffViewProps) {
  const beforeLines = diff.before.split('\n')
  const afterLines = diff.after.split('\n')

  if (mode === 'split') {
    return (
      <div className="flex divide-x text-xs font-mono">
        {/* Before */}
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-max">
            {beforeLines.map((line, i) => (
              <div
                key={i}
                className={cn(
                  'flex',
                  afterLines[i] !== line && 'bg-red-500/10'
                )}
              >
                <span className="w-10 shrink-0 border-r bg-muted px-2 py-0.5 text-right text-muted-foreground">
                  {i + 1}
                </span>
                <pre className="flex-1 px-2 py-0.5 whitespace-pre">{line}</pre>
              </div>
            ))}
          </div>
        </div>
        {/* After */}
        <div className="flex-1 overflow-x-auto">
          <div className="min-w-max">
            {afterLines.map((line, i) => (
              <div
                key={i}
                className={cn(
                  'flex',
                  beforeLines[i] !== line && 'bg-green-500/10'
                )}
              >
                <span className="w-10 shrink-0 border-r bg-muted px-2 py-0.5 text-right text-muted-foreground">
                  {i + 1}
                </span>
                <pre className="flex-1 px-2 py-0.5 whitespace-pre">{line}</pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Unified view - simple line-by-line comparison
  return (
    <div className="text-xs font-mono">
      {afterLines.map((line, i) => {
        const beforeLine = beforeLines[i]
        const isAdded = beforeLine === undefined || beforeLine !== line
        const isRemoved = beforeLine !== undefined && beforeLine !== line
        
        return (
          <div key={i}>
            {isRemoved && beforeLine && (
              <div className="flex bg-red-500/10">
                <span className="w-10 shrink-0 border-r bg-red-500/20 px-2 py-0.5 text-right text-red-600">
                  -
                </span>
                <pre className="flex-1 px-2 py-0.5 whitespace-pre text-red-600">{beforeLine}</pre>
              </div>
            )}
            <div className={cn('flex', isAdded && 'bg-green-500/10')}>
              <span className={cn(
                'w-10 shrink-0 border-r px-2 py-0.5 text-right',
                isAdded ? 'bg-green-500/20 text-green-600' : 'bg-muted text-muted-foreground'
              )}>
                {isAdded ? '+' : i + 1}
              </span>
              <pre className={cn(
                'flex-1 px-2 py-0.5 whitespace-pre',
                isAdded && 'text-green-600'
              )}>{line}</pre>
            </div>
          </div>
        )
      })}
    </div>
  )
}
