/**
 * Terminal Panel component.
 * Provides an integrated terminal emulator with tabs.
 */
import { useState } from 'react'
import { 
  X, 
  Plus, 
  Terminal as TerminalIcon,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TerminalTab {
  id: string
  name: string
  content: string
}

interface TerminalPanelProps {
  isOpen: boolean
  onClose: () => void
  onToggle: () => void
}

export function TerminalPanel({ isOpen, onClose, onToggle }: TerminalPanelProps) {
  const [tabs, setTabs] = useState<TerminalTab[]>([
    { id: '1', name: 'Terminal 1', content: '' },
  ])
  const [activeTabId, setActiveTabId] = useState('1')
  const [isMaximized, setIsMaximized] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const activeTab = tabs.find((t) => t.id === activeTabId)

  const createTab = () => {
    const newId = String(Date.now())
    const newTab: TerminalTab = {
      id: newId,
      name: `Terminal ${tabs.length + 1}`,
      content: '',
    }
    setTabs([...tabs, newTab])
    setActiveTabId(newId)
  }

  const closeTab = (id: string) => {
    if (tabs.length === 1) {
      onClose()
      return
    }
    
    const newTabs = tabs.filter((t) => t.id !== id)
    setTabs(newTabs)
    
    if (activeTabId === id) {
      setActiveTabId(newTabs[0].id)
    }
  }

  const handleCommand = (command: string) => {
    if (!command.trim()) return
    
    // Simulate command output
    const output = `$ ${command}\nCommand executed (simulation mode - connect to OpenCode server for real terminal)\n\n`
    
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? { ...t, content: t.content + output }
          : t
      )
    )
    setInputValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(inputValue)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground shadow-lg hover:bg-primary/90"
      >
        <TerminalIcon className="size-4" />
        <span>Terminal</span>
        <ChevronUp className="size-4" />
      </button>
    )
  }

  return (
    <div 
      className={cn(
        'flex flex-col border-t bg-background',
        isMaximized ? 'fixed inset-0 z-50' : 'h-[300px]'
      )}
    >
      {/* Header */}
      <div className="flex h-9 items-center justify-between border-b bg-muted/50 px-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={cn(
                'group flex items-center gap-1 rounded-t px-2 py-1 text-xs',
                tab.id === activeTabId
                  ? 'bg-background text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <button
                onClick={() => setActiveTabId(tab.id)}
                className="flex items-center gap-1"
              >
                <TerminalIcon className="size-3" />
                <span>{tab.name}</span>
              </button>
              <button
                onClick={() => closeTab(tab.id)}
                className="ml-1 rounded p-0.5 opacity-0 hover:bg-muted group-hover:opacity-100"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={createTab}
          >
            <Plus className="size-3" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => setIsMaximized(!isMaximized)}
          >
            {isMaximized ? (
              <Minimize2 className="size-3" />
            ) : (
              <Maximize2 className="size-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={onToggle}
          >
            <ChevronDown className="size-3" />
          </Button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 overflow-auto bg-black p-2 font-mono text-sm text-green-400">
        <pre className="whitespace-pre-wrap">{activeTab?.content}</pre>
        
        {/* Input Line */}
        <div className="flex items-center gap-1">
          <span className="text-cyan-400">$</span>
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none"
            placeholder="Type a command..."
            autoFocus
          />
        </div>
      </div>
    </div>
  )
}
