import { describe, expect, test } from 'vitest'

import { terminalStore, type LocalPTY } from './terminal-store'

describe('terminalStore', () => {
  test('should add a terminal', () => {
    const terminal: LocalPTY = {
      id: 'test-1',
      title: 'Test Terminal',
    }

    terminalStore.actions.addTerminal(terminal)

    const state = terminalStore.store.getState()
    expect(state.terminals.some((t) => t.id === 'test-1')).toBe(true)
  })

  test('should not add duplicate terminals', () => {
    const terminal: LocalPTY = {
      id: 'test-2',
      title: 'Test Terminal',
    }

    const initialState = terminalStore.store.getState()
    const initialCount = initialState.terminals.length

    terminalStore.actions.addTerminal(terminal)
    terminalStore.actions.addTerminal(terminal)

    const finalState = terminalStore.store.getState()
    expect(finalState.terminals.length).toBe(initialCount + 1)
  })

  test('should update terminal', () => {
    const terminal: LocalPTY = {
      id: 'test-3',
      title: 'Test Terminal',
    }

    terminalStore.actions.addTerminal(terminal)
    terminalStore.actions.updateTerminal({
      id: 'test-3',
      title: 'Updated Title',
      buffer: 'test buffer',
    })

    const found = terminalStore.actions.getTerminal('test-3')
    expect(found?.title).toBe('Updated Title')
    expect(found?.buffer).toBe('test buffer')
  })

  test('should set active terminal', () => {
    terminalStore.actions.setActiveTerminal('test-4')

    const state = terminalStore.store.getState()
    expect(state.activeTerminalId).toBe('test-4')
  })

  test('should get terminal by id', () => {
    const terminal: LocalPTY = {
      id: 'test-5',
      title: 'Test Terminal',
    }

    terminalStore.actions.addTerminal(terminal)

    const found = terminalStore.actions.getTerminal('test-5')
    expect(found).toBeDefined()
    expect(found?.id).toBe('test-5')
  })

  test('should get active terminal', () => {
    const terminal: LocalPTY = {
      id: 'test-6',
      title: 'Test Terminal',
    }

    terminalStore.actions.addTerminal(terminal)
    terminalStore.actions.setActiveTerminal('test-6')

    const active = terminalStore.actions.getActiveTerminal()
    expect(active).toBeDefined()
    expect(active?.id).toBe('test-6')
  })

  test('should move terminal', () => {
    const terminal1: LocalPTY = { id: 'test-move-1', title: 'Terminal 1' }
    const terminal2: LocalPTY = { id: 'test-move-2', title: 'Terminal 2' }
    const terminal3: LocalPTY = { id: 'test-move-3', title: 'Terminal 3' }

    terminalStore.actions.addTerminal(terminal1)
    terminalStore.actions.addTerminal(terminal2)
    terminalStore.actions.addTerminal(terminal3)

    terminalStore.actions.moveTerminal('test-move-3', 0)

    const state = terminalStore.store.getState()
    const index = state.terminals.findIndex((t) => t.id === 'test-move-3')
    const index1 = state.terminals.findIndex((t) => t.id === 'test-move-1')
    expect(index).toBeLessThan(index1)
  })
})
