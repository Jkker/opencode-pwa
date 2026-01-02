'use client'

import type React from 'react'

import { Drawer } from 'vaul'

import { cn } from '@/lib/utils'

interface SideDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  side: 'left' | 'right'
  title: string
  children: React.ReactNode
}

export function SideDrawer({ open, onOpenChange, side, title, children }: SideDrawerProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction={side}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content
          className={cn(
            'fixed top-0 bottom-0 z-50 flex flex-col acrylic min-w-70 max-w-screen max-h-dvh outline-none',
            side === 'left' ? 'left-0 border-r rounded-r-lg' : 'right-0 border-l rounded-l-lg',
          )}
        >
          <div className="p-4 flex-1 overflow-y-auto">
            <Drawer.Title className="text-lg font-semibold text-foreground mb-4">
              {title}
            </Drawer.Title>
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
