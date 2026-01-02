'use client'

import type React from 'react'

import { PanelLeft, PanelRight } from 'lucide-react'
import { useState, useCallback } from 'react'

import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { useSwipeDrawer } from '@/hooks/use-swipe-drawer'

import { BottomDrawer } from './bottom-drawer'
import { SideDrawer } from './side-drawer'

interface HolyGrailLayoutProps {
  header?: React.ReactNode
  leftSidebar?: React.ReactNode
  rightSidebar?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
}

export function HolyGrailLayout({
  header,
  leftSidebar,
  rightSidebar,
  children,
}: HolyGrailLayoutProps) {
  const isMobile = useIsMobile()
  const [leftOpen, setLeftOpen] = useState(false)
  const [rightOpen, setRightOpen] = useState(false)

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
        <aside className="w-64 border-r border-border bg-sidebar flex-col max-h-dvh shrink-0 hidden md:flex">
          <div className="p-4 flex-1 overflow-y-auto">
            <h2 className="font-semibold text-sidebar-foreground mb-4">Navigation</h2>
            {leftSidebar || <DefaultLeftSidebar />}
          </div>
        </aside>
      )}

      {/* Center Area - contains header, main content, footer, and bottom drawer on mobile */}
      <div className="flex-1 flex flex-col h-dvh overflow-auto">
        {/* Header - inside center area */}
        <header className="sticky top-0 z-30 border-b acrylic shrink-0 flex items-center justify-between h-(--header-height) px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLeftOpen(!leftOpen)}
            className={!isMobile ? 'md:flex' : ''}
          >
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle left sidebar</span>
          </Button>
          <div className="flex-1 text-center">
            {header || <span className="font-semibold">Holy Grail</span>}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRightOpen(!rightOpen)}
            className={!isMobile ? 'lg:flex' : ''}
          >
            <PanelRight className="h-5 w-5" />
            <span className="sr-only">Toggle right sidebar</span>
          </Button>
        </header>

        {/* Main Content - gray-50 background */}
        <main className={`relative flex-1 shrink p-4 md:p-6 bg-gray-50 dark:bg-gray-900/50`}>
          {children}
          <BottomDrawer />
        </main>

        {/* Mobile Bottom Drawer - inside center area */}
      </div>

      {/* Desktop Right Sidebar */}
      {!isMobile && (
        <aside className="w-64 border-l border-border bg-sidebar flex flex-col max-h-dvh shrink-0 hidden lg:flex">
          <div className="p-4 flex-1 overflow-y-auto">
            <h2 className="font-semibold text-sidebar-foreground mb-4">Details</h2>
            {rightSidebar || <DefaultRightSidebar />}
          </div>
        </aside>
      )}

      {/* Mobile Side Drawers */}
      {isMobile && (
        <>
          <SideDrawer open={leftOpen} onOpenChange={setLeftOpen} side="left" title="Navigation">
            {leftSidebar || <DefaultLeftSidebar />}
          </SideDrawer>

          <SideDrawer open={rightOpen} onOpenChange={setRightOpen} side="right" title="Details">
            {rightSidebar || <DefaultRightSidebar />}
          </SideDrawer>
        </>
      )}
    </div>
  )
}

function DefaultLeftSidebar() {
  return (
    <nav className="space-y-2">
      {['Home', 'Dashboard', 'Projects', 'Settings'].map((item) => (
        <a
          key={item}
          href="#"
          className="block px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {item}
        </a>
      ))}
    </nav>
  )
}

function DefaultRightSidebar() {
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-muted">
        <h3 className="font-medium text-sm mb-1">Quick Stats</h3>
        <p className="text-xs text-muted-foreground">View your activity</p>
      </div>
      <div className="p-3 rounded-lg bg-muted">
        <h3 className="font-medium text-sm mb-1">Recent Items</h3>
        <p className="text-xs text-muted-foreground">No recent items</p>
      </div>
    </div>
  )
}
