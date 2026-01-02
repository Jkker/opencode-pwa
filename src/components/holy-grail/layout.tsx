'use client'

import type React from 'react'

import { PanelLeft, PanelRight } from 'lucide-react'
import { useState, useCallback } from 'react'

import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { useSwipeDrawer } from '@/hooks/use-swipe-drawer'

import { LeftPanel } from './left-panel'
import { PromptPanel } from './prompt-panel'
import { RightPanel } from './right-panel'
import { SideDrawer } from './side-drawer'

interface HolyGrailLayoutProps {
  header?: React.ReactNode
  sessionId?: string
  directory?: string
  children: React.ReactNode
  showPrompt?: boolean
}

export function HolyGrailLayout({
  header,
  sessionId,
  directory,
  children,
  showPrompt = true,
}: HolyGrailLayoutProps) {
  const isMobile = useIsMobile()
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)
  const [_settingsOpen, setSettingsOpen] = useState(false)

  const handleSwipeLeft = useCallback(() => {
    if (!leftOpen) setRightOpen(true)
  }, [leftOpen])

  const handleSwipeRight = useCallback(() => {
    if (!rightOpen) setLeftOpen(true)
  }, [rightOpen])

  useSwipeDrawer({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    enabled: isMobile && !leftOpen && !rightOpen,
    threshold: 60,
  })

  return (
    <div className="h-dvh flex bg-background">
      {/* Desktop Left Sidebar */}
      {!isMobile && (
        <aside className="w-72 border-r border-border bg-sidebar flex-col max-h-dvh shrink-0 hidden md:flex">
          <LeftPanel onSettingsClick={() => setSettingsOpen(true)} />
        </aside>
      )}

      {/* Center Area - contains header, main content, and prompt panel */}
      <div className="flex-1 flex flex-col h-dvh overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b acrylic shrink-0 flex items-center justify-between h-(--header-height) px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLeftOpen(!leftOpen)}
            className={!isMobile ? 'md:hidden' : ''}
          >
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle left sidebar</span>
          </Button>
          <div className="flex-1 text-center">
            {header || <span className="font-semibold">OpenCode</span>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRightOpen(!rightOpen)}
            className={!isMobile ? 'lg:hidden' : ''}
          >
            <PanelRight className="h-5 w-5" />
            <span className="sr-only">Toggle right sidebar</span>
          </Button>
        </header>

        {/* Main Content */}
        <main className="relative flex-1 overflow-auto bg-gray-50 dark:bg-gray-900/50">
          {children}
        </main>

        {/* Prompt Panel at Bottom */}
        {showPrompt && <PromptPanel sessionId={sessionId} directory={directory} />}
      </div>

      {/* Desktop Right Sidebar */}
      {!isMobile && (
        <aside className="w-80 border-l border-border bg-sidebar flex flex-col max-h-dvh shrink-0 hidden lg:flex">
          <RightPanel />
        </aside>
      )}

      {/* Mobile Side Drawers */}
      {isMobile && (
        <>
          <SideDrawer open={leftOpen} onOpenChange={setLeftOpen} side="left" title="Projects">
            <LeftPanel onSettingsClick={() => setSettingsOpen(true)} />
          </SideDrawer>

          <SideDrawer open={rightOpen} onOpenChange={setRightOpen} side="right" title="Status">
            <RightPanel />
          </SideDrawer>
        </>
      )}
    </div>
  )
}
