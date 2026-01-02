import { useNavigate } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
import { useCreateSessionMutation } from '@/lib/opencode/queries'
import { cn } from '@/lib/utils'

interface CreateSessionDialogProps {
  directory: string
  trigger?: React.ReactNode
  className?: string
}

export function CreateSessionDialog({ directory, trigger, className }: CreateSessionDialogProps) {
  const [open, setOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const navigate = useNavigate()
  const createSession = useCreateSessionMutation(directory)
  const isMobile = useIsMobile()

  const handleCreate = async () => {
    setIsCreating(true)
    try {
      const session = await createSession.mutateAsync()
      if (session?.id) {
        setOpen(false)
        void navigate({
          to: `/project/${encodeURIComponent(directory)}/session/${session.id}`,
        })
      }
    } finally {
      setIsCreating(false)
    }
  }

  // Quick create without dialog on desktop
  const handleQuickCreate = async () => {
    if (isMobile) {
      setOpen(true)
    } else {
      await handleCreate()
    }
  }

  const defaultTrigger = (
    <Button
      variant="ghost"
      size={isMobile ? 'default' : 'sm'}
      className={cn('gap-2', className)}
      onClick={handleQuickCreate}
    >
      <Plus className="size-4" />
      <span className="hidden sm:inline">New Session</span>
    </Button>
  )

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{trigger ?? defaultTrigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>New Session</DrawerTitle>
          <DrawerDescription>
            Start a new coding session. You can ask questions about your codebase, request changes,
            or debug issues.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 py-2">
          <p className="text-sm text-muted-foreground">
            Sessions are automatically titled based on your first message.
          </p>
        </div>

        <DrawerFooter>
          <Button onClick={handleCreate} disabled={isCreating} className="h-11">
            {isCreating ? 'Creating...' : 'Create Session'}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)} className="h-11">
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
