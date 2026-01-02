import { useState, useEffect } from 'react'
import { Drawer } from 'vaul'

import { cn } from '@/lib/utils'

const useWindowHeightPixel = () => {
  const [heightPx, setHeightPx] = useState(window.innerHeight)

  useEffect(() => {
    const updateHeight = () => {
      setHeightPx(window.innerHeight)
    }
    window.addEventListener('resize', updateHeight)
    return () => {
      window.removeEventListener('resize', updateHeight)
    }
  }, [])

  return heightPx
}

// display as drawer on mobile. TODO: display as a fixed bottom bar on desktop within the main content area
export function BottomDrawer({ minH = '80px' }) {
  const maxH = useWindowHeightPixel()
  const snapPoints = [minH, 0.9]
  const [snap, setSnap] = useState<number | string | null>(minH)
  const [value, setValue] = useState('')

  const isCollapsed = snap === minH

  const handleExpand = () => setSnap(maxH)

  return (
    <Drawer.Root
      open
      snapPoints={snapPoints}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      modal={false}
      dismissible={false}
    >
      <Drawer.Portal>
        <Drawer.Content
          className={cn(
            'fixed flex flex-col rounded-t-[10px] bottom-0 left-0 right-0 h-full max-h-[97%] -mx-px p-0',
            'acrylic shadow',
          )}
        >
          <Drawer.Title className="sr-only">Input</Drawer.Title>
          <Drawer.Description className="sr-only">Prompt Input Bar</Drawer.Description>
          <textarea
            // 1 line if collapsed, else auto height
            placeholder="Start typing..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            // onFocus={handleExpand}
            className={cn('outline-none px-4 py-2', isCollapsed ? 'h-20' : 'h-[100ch]')}
            rows={isCollapsed ? 1 : undefined}
          />
          {/* TODO: display resize btn top right if > 2 lines */}
          {/* TODO: display toolbar with attachment, model selection, voice, submit btn below the textarea */}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
