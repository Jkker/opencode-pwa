import { useEffect, useRef } from 'react'

/**
 * Swipe direction for tab navigation
 * - 'next': swipe RTL (right-to-left) to move to next tab
 * - 'prev': swipe LTR (left-to-right) to move to previous tab
 */
export type SwipeDirection = 'next' | 'prev'

/**
 * Result of a swipe action
 * - 'navigated': successfully moved to another tab
 * - 'closed': panel was closed (swiped back from first tab)
 * - 'blocked': swipe was blocked (e.g., by scrollable content)
 * - 'ignored': swipe didn't meet threshold or wasn't horizontal
 */
export type SwipeResult = 'navigated' | 'closed' | 'blocked' | 'ignored'

export interface UseSwipeTabsOptions<T extends string> {
  /** Ordered array of tab IDs */
  tabs: readonly T[]
  /** Current active tab */
  activeTab: T
  /** Whether the panel is currently open */
  isOpen: boolean
  /** Callback to change the active tab */
  onTabChange: (tab: T) => void
  /** Callback to close the panel (called when swiping LTR on first tab) */
  onClose: () => void
  /** Callback to open the panel (called when swiping RTL while closed) */
  onOpen?: () => void
  /** Minimum distance in pixels to trigger a swipe (default: 50) */
  threshold?: number
  /** Whether swipe is enabled (default: true) */
  enabled?: boolean
  /** Ref to the container element to scope touch events (default: document) */
  containerRef?: React.RefObject<HTMLElement | null>
}

export interface UseSwipeTabsReturn {
  /** Check if an element can scroll in a direction */
  canScrollInDirection: (element: HTMLElement, direction: SwipeDirection) => boolean
  /** Get the swipe handlers for manual attachment */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: (e: React.TouchEvent) => void
  }
}

/**
 * Determines if an element (or its ancestors) can scroll horizontally in a given direction.
 * This is used to prevent swipe navigation when the user is scrolling content.
 */
function canElementScrollInDirection(
  element: HTMLElement | null,
  direction: SwipeDirection,
): boolean {
  while (element) {
    const style = window.getComputedStyle(element)
    const overflowX = style.overflowX

    // Check if element has horizontal scroll capability
    if (
      (overflowX === 'auto' || overflowX === 'scroll') &&
      element.scrollWidth > element.clientWidth
    ) {
      const { scrollLeft, scrollWidth, clientWidth } = element
      const maxScroll = scrollWidth - clientWidth

      // For 'prev' (LTR swipe), check if can scroll left
      if (direction === 'prev' && scrollLeft > 0) {
        return true
      }
      // For 'next' (RTL swipe), check if can scroll right
      if (direction === 'next' && scrollLeft < maxScroll - 1) {
        // -1 for rounding tolerance
        return true
      }
    }

    element = element.parentElement
  }
  return false
}

/**
 * Hook for multi-tab swipe navigation with smart scrollable content detection.
 *
 * Swipe behavior:
 * - RTL (right-to-left): Opens panel (if closed) or navigates to next tab
 * - LTR (left-to-right): Navigates to previous tab or closes panel (if on first tab)
 *
 * Smart scroll detection:
 * - If the swipe starts on a horizontally scrollable element, the swipe is blocked
 *   only if that element can still scroll in the swipe direction.
 * - Once the scrollable content reaches its edge, further swipes cascade to tab navigation.
 *
 * @example
 * ```tsx
 * const tabs = ['status', 'changes', 'terminal'] as const
 * const [activeTab, setActiveTab] = useState(tabs[0])
 * const [isOpen, setIsOpen] = useState(false)
 *
 * useSwipeTabs({
 *   tabs,
 *   activeTab,
 *   isOpen,
 *   onTabChange: setActiveTab,
 *   onClose: () => setIsOpen(false),
 *   onOpen: () => setIsOpen(true),
 * })
 * ```
 */
export function useSwipeTabs<T extends string>({
  tabs,
  activeTab,
  isOpen,
  onTabChange,
  onClose,
  onOpen,
  threshold = 50,
  enabled = true,
  containerRef,
}: UseSwipeTabsOptions<T>): UseSwipeTabsReturn {
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const touchStartElement = useRef<HTMLElement | null>(null)
  const isHorizontalSwipe = useRef<boolean | null>(null)
  const swipeHandled = useRef(false)

  // Stable refs for callbacks to avoid effect re-runs
  const callbacksRef = useRef({ onTabChange, onClose, onOpen })
  callbacksRef.current = { onTabChange, onClose, onOpen }

  const configRef = useRef({ tabs, activeTab, isOpen, threshold })
  configRef.current = { tabs, activeTab, isOpen, threshold }

  const handleSwipe = (direction: SwipeDirection): SwipeResult => {
    const { tabs, activeTab, isOpen } = configRef.current
    const { onTabChange, onClose, onOpen } = callbacksRef.current

    // Check if the touch started on a scrollable element
    if (touchStartElement.current) {
      if (canElementScrollInDirection(touchStartElement.current, direction)) {
        return 'blocked'
      }
    }

    const currentIndex = tabs.indexOf(activeTab)

    if (direction === 'next') {
      // RTL swipe: open panel or go to next tab
      if (!isOpen) {
        onOpen?.()
        return 'navigated'
      }
      if (currentIndex < tabs.length - 1) {
        onTabChange(tabs[currentIndex + 1])
        return 'navigated'
      }
      return 'ignored'
    }

    // direction === 'prev'
    // LTR swipe: go to previous tab or close panel
    if (!isOpen) {
      return 'ignored'
    }
    if (currentIndex > 0) {
      onTabChange(tabs[currentIndex - 1])
      return 'navigated'
    }
    // On first tab, close the panel
    onClose()
    return 'closed'
  }

  const handleTouchStart = (clientX: number, clientY: number, target: EventTarget | null) => {
    touchStartX.current = clientX
    touchStartY.current = clientY
    touchStartElement.current = target instanceof HTMLElement ? target : null
    isHorizontalSwipe.current = null
    swipeHandled.current = false
  }

  const handleTouchMove = (clientX: number, clientY: number) => {
    if (touchStartX.current === null || touchStartY.current === null) return

    const deltaX = clientX - touchStartX.current
    const deltaY = clientY - touchStartY.current

    // Determine swipe direction on first significant movement
    if (isHorizontalSwipe.current === null) {
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY)
      }
    }
  }

  const handleTouchEnd = (clientX: number) => {
    if (touchStartX.current === null || !isHorizontalSwipe.current || swipeHandled.current) {
      resetTouchState()
      return
    }

    const deltaX = clientX - touchStartX.current
    const { threshold } = configRef.current

    if (Math.abs(deltaX) > threshold) {
      const direction: SwipeDirection = deltaX > 0 ? 'prev' : 'next'
      handleSwipe(direction)
      swipeHandled.current = true
    }

    resetTouchState()
  }

  const resetTouchState = () => {
    touchStartX.current = null
    touchStartY.current = null
    touchStartElement.current = null
    isHorizontalSwipe.current = null
  }

  // React event handlers for manual attachment
  const handlers = {
    onTouchStart: (e: React.TouchEvent) => {
      const touch = e.touches[0]
      handleTouchStart(touch.clientX, touch.clientY, e.target)
    },
    onTouchMove: (e: React.TouchEvent) => {
      const touch = e.touches[0]
      handleTouchMove(touch.clientX, touch.clientY)
    },
    onTouchEnd: (e: React.TouchEvent) => {
      const touch = e.changedTouches[0]
      handleTouchEnd(touch.clientX)
    },
  }

  useEffect(() => {
    if (!enabled) return

    const container = containerRef?.current ?? document

    const onTouchStart = (e: Event) => {
      if (!(e instanceof TouchEvent)) return
      const touch = e.touches[0]
      handleTouchStart(touch.clientX, touch.clientY, e.target)
    }

    const onTouchMove = (e: Event) => {
      if (!(e instanceof TouchEvent)) return
      const touch = e.touches[0]
      handleTouchMove(touch.clientX, touch.clientY)
    }

    const onTouchEnd = (e: Event) => {
      if (!(e instanceof TouchEvent)) return
      const touch = e.changedTouches[0]
      handleTouchEnd(touch.clientX)
    }

    container.addEventListener('touchstart', onTouchStart, { passive: true })
    container.addEventListener('touchmove', onTouchMove, { passive: true })
    container.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
    }
  }, [enabled, containerRef])

  return {
    canScrollInDirection: canElementScrollInDirection,
    handlers,
  }
}
