'use client'

import type { VariantProps } from 'class-variance-authority'
import type React from 'react'

import { useRef } from 'react'

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  type tabsListVariants,
} from '@/components/ui/tabs'
import { useSwipeTabs } from '@/hooks/use-swipe-tabs'
import { cn } from '@/lib/utils'

interface TabConfig<T extends string> {
  /** Unique tab ID */
  id: T
  /** Tab label */
  label: React.ReactNode
  /** Tab icon */
  icon?: React.ReactNode
  /** Tab content */
  content: React.ReactNode
}

export interface SwipeableTabPanelProps<T extends string> {
  /** Array of tab configurations */
  tabs: readonly TabConfig<T>[]
  /** Currently active tab */
  activeTab: T
  /** Callback when tab changes */
  onTabChange: (tab: T) => void
  /** Whether the panel is open (for mobile drawer integration) */
  isOpen?: boolean
  /** Callback to close the panel */
  onClose?: () => void
  /** Callback to open the panel */
  onOpen?: () => void
  /** Whether swipe navigation is enabled */
  swipeEnabled?: boolean
  /** Additional className for the container */
  className?: string
  /** TabsList variant */
  tabsListVariant?: VariantProps<typeof tabsListVariants>['variant']
  /** Additional className for TabsList */
  tabsListClassName?: string
  /** Additional className for TabsContent */
  tabsContentClassName?: string
}

/**
 * A reusable tab panel with swipe navigation support.
 *
 * Features:
 * - Swipe RTL to navigate to next tab (or open panel if closed)
 * - Swipe LTR to navigate to previous tab (or close panel if on first tab)
 * - Smart scroll detection: swipes are blocked if content can scroll in that direction
 *
 * @example
 * ```tsx
 * const [activeTab, setActiveTab] = useState('status')
 * const [isOpen, setIsOpen] = useState(false)
 *
 * <SwipeableTabPanel
 *   tabs={[
 *     { id: 'status', label: 'Status', icon: <ListTodo />, content: <StatusContent /> },
 *     { id: 'changes', label: 'Changes', icon: <FileCode />, content: <ChangesContent /> },
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onOpen={() => setIsOpen(true)}
 * />
 * ```
 */
export function SwipeableTabPanel<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  isOpen = true,
  onClose,
  onOpen,
  swipeEnabled = true,
  className,
  tabsListVariant = 'line',
  tabsListClassName,
  tabsContentClassName,
}: SwipeableTabPanelProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tabIds = tabs.map((t) => t.id)

  useSwipeTabs({
    tabs: tabIds,
    activeTab,
    isOpen,
    onTabChange,
    onClose: onClose ?? (() => {}),
    onOpen,
    enabled: swipeEnabled,
    containerRef,
  })

  return (
    <div ref={containerRef} className={cn('flex h-full w-full flex-col', className)}>
      <Tabs
        value={activeTab}
        onValueChange={(value) => onTabChange(value as T)}
        className="flex h-full flex-col"
      >
        <TabsList
          variant={tabsListVariant}
          className={cn('shrink-0 border-b px-2', tabsListClassName)}
        >
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5">
              {tab.icon}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent
            key={tab.id}
            value={tab.id}
            className={cn('min-h-0 flex-1 overflow-hidden', tabsContentClassName)}
          >
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
