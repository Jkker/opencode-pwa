'use client'

import type React from 'react'

import { PanelLeft, PanelRight } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'

import { LeftPanel } from './left-panel'
import { PromptPanel } from './prompt-panel'
import { RightPanel, RIGHT_PANEL_TABS, type RightPanelTab } from './right-panel'
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
  const [rightActiveTab, setRightActiveTab] = useState<RightPanelTab>(RIGHT_PANEL_TABS[0])
  const [_settingsOpen, setSettingsOpen] = useState(false)

  /**
   * Handle opening the right panel.
   * On mobile, this is triggered by swipe RTL when panel is closed.
   */
  const handleOpenRightPanel = () => {
    setRightActiveTab(RIGHT_PANEL_TABS[0])
    setRightOpen(true)
  }

  /**
   * Handle closing the right panel.
   * On mobile, this is triggered by swipe LTR when on first tab.
   */
  const handleCloseRightPanel = () => {
    setRightOpen(false)
  }

  return (
    <div className="flex h-dvh bg-background">
      {/* Desktop Left Sidebar */}
      {!isMobile && (
        <aside className="hidden w-72 max-h-dvh shrink-0 flex-col border-r border-border bg-sidebar md:flex">
          <LeftPanel onSettingsClick={() => setSettingsOpen(true)} />
        </aside>
      )}

      {/* Center Area - contains header, main content, and prompt panel */}
      <div className="flex h-dvh flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="acrylic sticky top-0 z-30 flex h-(--header-height) shrink-0 items-center justify-between border-b px-4">
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
        <aside className="hidden w-80 max-h-dvh shrink-0 flex-col border-l border-border bg-sidebar lg:flex">
          <RightPanel
            activeTab={rightActiveTab}
            onTabChange={setRightActiveTab}
            isOpen={true}
            swipeEnabled={false}
          />
        </aside>
      )}

      {/* Mobile Side Drawers */}
      {isMobile && (
        <>
          <SideDrawer open={leftOpen} onOpenChange={setLeftOpen} side="left" title="Projects">
            <LeftPanel onSettingsClick={() => setSettingsOpen(true)} />
          </SideDrawer>

          <SideDrawer open={rightOpen} onOpenChange={setRightOpen} side="right" title="Status">
            <RightPanel
              activeTab={rightActiveTab}
              onTabChange={setRightActiveTab}
              isOpen={rightOpen}
              onClose={handleCloseRightPanel}
              onOpen={handleOpenRightPanel}
              swipeEnabled={true}
            />
          </SideDrawer>
        </>
      )}
    </div>
  )
}
