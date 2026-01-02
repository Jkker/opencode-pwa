import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react'

import { useSwipeTabs } from './use-swipe-tabs'

/**
 * Helper to simulate a complete swipe gesture
 */
async function simulateSwipe(
  handlers: ReturnType<typeof useSwipeTabs>['handlers'],
  act: (fn: () => void) => Promise<void>,
  options: {
    startX: number
    startY: number
    endX: number
    endY?: number
    target?: EventTarget
  },
) {
  const { startX, startY, endX, endY = startY, target = document.body } = options

  await act(() => {
    handlers.onTouchStart({
      touches: [{ clientX: startX, clientY: startY }],
      target,
    } as unknown as React.TouchEvent)
  })

  await act(() => {
    handlers.onTouchMove({
      touches: [{ clientX: endX, clientY: endY }],
    } as unknown as React.TouchEvent)
  })

  await act(() => {
    handlers.onTouchEnd({
      changedTouches: [{ clientX: endX }],
    } as unknown as React.TouchEvent)
  })
}

describe('useSwipeTabs', () => {
  const defaultTabs = ['status', 'changes', 'terminal'] as const

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('tab navigation', () => {
    test('swipe RTL navigates to next tab', async () => {
      const onTabChange = vi.fn()
      const onClose = vi.fn()

      const { result, act } = await renderHook(() =>
        useSwipeTabs({
          tabs: defaultTabs,
          activeTab: 'status',
          isOpen: true,
          onTabChange,
          onClose,
        }),
      )

      // Simulate swipe RTL (negative delta)
      await simulateSwipe(result.current.handlers, act, {
        startX: 200,
        startY: 100,
        endX: 50,
      })

      expect(onTabChange).toHaveBeenCalledWith('changes')
      expect(onClose).not.toHaveBeenCalled()
    })

    test('swipe LTR navigates to previous tab', async () => {
      const onTabChange = vi.fn()
      const onClose = vi.fn()

      const { result, act } = await renderHook(() =>
        useSwipeTabs({
          tabs: defaultTabs,
          activeTab: 'changes',
          isOpen: true,
          onTabChange,
          onClose,
        }),
      )

      // Simulate swipe LTR (positive delta)
      await simulateSwipe(result.current.handlers, act, {
        startX: 100,
        startY: 100,
        endX: 250,
      })

      expect(onTabChange).toHaveBeenCalledWith('status')
      expect(onClose).not.toHaveBeenCalled()
    })

    test('swipe LTR on first tab closes panel', async () => {
      const onTabChange = vi.fn()
      const onClose = vi.fn()

      const { result, act } = await renderHook(() =>
        useSwipeTabs({
          tabs: defaultTabs,
          activeTab: 'status',
          isOpen: true,
          onTabChange,
          onClose,
        }),
      )

      // Simulate swipe LTR (positive delta)
      await simulateSwipe(result.current.handlers, act, {
        startX: 100,
        startY: 100,
        endX: 200,
      })

      expect(onClose).toHaveBeenCalled()
      expect(onTabChange).not.toHaveBeenCalled()
    })

    test('swipe RTL on last tab does nothing', async () => {
      const onTabChange = vi.fn()
      const onClose = vi.fn()

      const { result, act } = await renderHook(() =>
        useSwipeTabs({
          tabs: defaultTabs,
          activeTab: 'terminal',
          isOpen: true,
          onTabChange,
          onClose,
        }),
      )

      // Simulate swipe RTL
      await simulateSwipe(result.current.handlers, act, {
        startX: 200,
        startY: 100,
        endX: 50,
      })

      expect(onTabChange).not.toHaveBeenCalled()
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('panel open/close', () => {
    test('swipe RTL opens closed panel', async () => {
      const onTabChange = vi.fn()
      const onClose = vi.fn()
      const onOpen = vi.fn()

      const { result, act } = await renderHook(() =>
        useSwipeTabs({
          tabs: defaultTabs,
          activeTab: 'status',
          isOpen: false,
          onTabChange,
          onClose,
          onOpen,
        }),
      )

      // Simulate swipe RTL
      await simulateSwipe(result.current.handlers, act, {
        startX: 200,
        startY: 100,
        endX: 50,
      })

      expect(onOpen).toHaveBeenCalled()
      expect(onTabChange).not.toHaveBeenCalled()
    })

    test('swipe LTR on closed panel does nothing', async () => {
      const onTabChange = vi.fn()
      const onClose = vi.fn()
      const onOpen = vi.fn()

      const { result, act } = await renderHook(() =>
        useSwipeTabs({
          tabs: defaultTabs,
          activeTab: 'status',
          isOpen: false,
          onTabChange,
          onClose,
          onOpen,
        }),
      )

      // Simulate swipe LTR
      await simulateSwipe(result.current.handlers, act, {
        startX: 100,
        startY: 100,
        endX: 200,
      })

      expect(onOpen).not.toHaveBeenCalled()
      expect(onClose).not.toHaveBeenCalled()
      expect(onTabChange).not.toHaveBeenCalled()
    })
  })

  describe('threshold', () => {
    test('swipe below threshold is ignored', async () => {
      const onTabChange = vi.fn()
      const onClose = vi.fn()

      const { result, act } = await renderHook(() =>
        useSwipeTabs({
          tabs: defaultTabs,
          activeTab: 'status',
          isOpen: true,
          onTabChange,
          onClose,
          threshold: 100,
        }),
      )

      // Simulate small swipe (delta = 40, below threshold of 100)
      await simulateSwipe(result.current.handlers, act, {
        startX: 100,
        startY: 100,
        endX: 140,
      })

      expect(onTabChange).not.toHaveBeenCalled()
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('vertical swipe detection', () => {
    test('vertical swipe is ignored', async () => {
      const onTabChange = vi.fn()
      const onClose = vi.fn()

      const { result, act } = await renderHook(() =>
        useSwipeTabs({
          tabs: defaultTabs,
          activeTab: 'status',
          isOpen: true,
          onTabChange,
          onClose,
        }),
      )

      // Simulate vertical swipe (larger Y delta than X delta)
      await simulateSwipe(result.current.handlers, act, {
        startX: 100,
        startY: 100,
        endX: 120,
        endY: 200,
      })

      expect(onTabChange).not.toHaveBeenCalled()
      expect(onClose).not.toHaveBeenCalled()
    })
  })

  describe('scrollable content detection', () => {
    test('canScrollInDirection detects scrollable elements', async () => {
      const { result } = await renderHook(() =>
        useSwipeTabs({
          tabs: defaultTabs,
          activeTab: 'status',
          isOpen: true,
          onTabChange: vi.fn(),
          onClose: vi.fn(),
        }),
      )

      // Create a scrollable element
      const scrollableEl = document.createElement('div')
      scrollableEl.style.overflowX = 'auto'
      scrollableEl.style.width = '100px'
      Object.defineProperty(scrollableEl, 'scrollWidth', { value: 200, configurable: true })
      Object.defineProperty(scrollableEl, 'clientWidth', { value: 100, configurable: true })
      Object.defineProperty(scrollableEl, 'scrollLeft', { value: 50, configurable: true })
      document.body.appendChild(scrollableEl)

      // Can scroll both directions when in the middle
      expect(result.current.canScrollInDirection(scrollableEl, 'prev')).toBe(true)
      expect(result.current.canScrollInDirection(scrollableEl, 'next')).toBe(true)

      // At the start, can only scroll right
      Object.defineProperty(scrollableEl, 'scrollLeft', { value: 0, configurable: true })
      expect(result.current.canScrollInDirection(scrollableEl, 'prev')).toBe(false)
      expect(result.current.canScrollInDirection(scrollableEl, 'next')).toBe(true)

      // At the end, can only scroll left
      Object.defineProperty(scrollableEl, 'scrollLeft', { value: 100, configurable: true })
      expect(result.current.canScrollInDirection(scrollableEl, 'prev')).toBe(true)
      expect(result.current.canScrollInDirection(scrollableEl, 'next')).toBe(false)

      document.body.removeChild(scrollableEl)
    })
  })

  describe('enabled option', () => {
    test('handlers work independently of enabled flag', async () => {
      const onTabChange = vi.fn()
      const onClose = vi.fn()

      const { result, act } = await renderHook(() =>
        useSwipeTabs({
          tabs: defaultTabs,
          activeTab: 'status',
          isOpen: true,
          onTabChange,
          onClose,
          enabled: false,
        }),
      )

      // Simulate swipe RTL using handlers directly
      await simulateSwipe(result.current.handlers, act, {
        startX: 200,
        startY: 100,
        endX: 50,
      })

      // When using handlers directly, they still work (enabled only affects document listeners)
      // This is by design - handlers can be used independently
      expect(onTabChange).toHaveBeenCalledWith('changes')
    })
  })
})
