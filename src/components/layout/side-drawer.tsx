'use client'

import type React from 'react'

import { XIcon } from 'lucide-react'
import { Drawer } from 'vaul'

import { cn } from '@/lib/utils'

import { Button } from '../ui/button'

interface SideDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  side: 'left' | 'right'
  title: string
  children: React.ReactNode
  className?: string
}

export function SideDrawer({
  open,
  onOpenChange,
  side,
  title,
  children,
  className,
}: SideDrawerProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction={side}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Drawer.Content
          className={cn(
            'fixed top-0 bottom-0 z-50 flex flex-col acrylic min-w-70 max-w-screen max-h-dvh outline-none',

            'w-screen sm:min-w-fit overflow-x-hidden flex-1 overflow-y-auto',
            side === 'left' ? 'left-0 border-r rounded-r-lg' : 'right-0 border-l rounded-l-lg',
            className,
          )}
        >
          <Drawer.Title className="p-3 text-lg font-semibold text-foreground flex items-center justify-between">
            {title}
            <Drawer.Close asChild>
              <Button variant="ghost" size="icon" title="Close">
                <XIcon />
              </Button>
            </Drawer.Close>
          </Drawer.Title>
          <Drawer.Description className="sr-only">{title}</Drawer.Description>
          {children}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
