import { useEffect, useRef } from 'react'

interface UseSwipeDrawerOptions {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  threshold?: number
  enabled?: boolean
}
const isInScrollableContainer = (element: EventTarget | null): boolean => {
  while (element) {
    if (!(element instanceof HTMLElement)) return false
    const overflowX = window.getComputedStyle(element).overflowX
    if (
      (overflowX === 'auto' || overflowX === 'scroll') &&
      element.scrollWidth > element.clientWidth
    ) {
      return true
    }
    element = element.parentElement
  }
  return false
}

export function useSwipeDrawer({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
  enabled = true,
}: UseSwipeDrawerOptions) {
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const isHorizontalSwipe = useRef<boolean | null>(null)

  useEffect(() => {
    if (!enabled) return

    const handleTouchStart = ({ target, touches }: TouchEvent) => {
      if (!(target instanceof HTMLElement)) return
      if (isInScrollableContainer(target)) {
        touchStartX.current = null
        return
      }
      touchStartX.current = touches[0].clientX
      touchStartY.current = touches[0].clientY
      isHorizontalSwipe.current = null
    }

    const handleTouchMove = ({ touches }: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return

      const deltaX = touches[0].clientX - touchStartX.current
      const deltaY = touches[0].clientY - touchStartY.current

      // Determine swipe direction on first significant movement
      if (isHorizontalSwipe.current === null) {
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
          isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY)
        }
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || !isHorizontalSwipe.current) {
        touchStartX.current = null
        touchStartY.current = null
        isHorizontalSwipe.current = null
        return
      }

      const touchEndX = e.changedTouches[0].clientX
      const deltaX = touchEndX - touchStartX.current

      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) onSwipeRight()
        else onSwipeLeft()
      }

      touchStartX.current = null
      touchStartY.current = null
      isHorizontalSwipe.current = null
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, threshold, onSwipeLeft, onSwipeRight])
}
