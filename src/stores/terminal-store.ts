import { createStore } from 'zustand-x'

export interface LocalPTY {
  id: string
  title: string
  rows?: number
  cols?: number
  buffer?: string
  scrollY?: number
}

export const terminalStore = createStore(
  {
    terminals: [] as LocalPTY[],
    activeTerminalId: null as string | null,
  },
  {
    name: 'opencode-terminals',
    persist: {
      enabled: true,
    },
  },
).extendActions(({ set, get }) => ({
  addTerminal: (terminal: LocalPTY) =>
    set('terminals', (prev) => {
      const exists = prev.some((t) => t.id === terminal.id)
      if (exists) return prev
      return [...prev, terminal]
    }),

  updateTerminal: (terminal: Partial<LocalPTY> & { id: string }) =>
    set('terminals', (prev) => prev.map((t) => (t.id === terminal.id ? { ...t, ...terminal } : t))),

  removeTerminal: (id: string) =>
    set('state', (state) => {
      const updatedTerminals = state.terminals.filter((t) => t.id !== id)
      const updatedActiveId = state.activeTerminalId === id ? null : state.activeTerminalId
      return {
        ...state,
        terminals: updatedTerminals,
        activeTerminalId: updatedActiveId,
      }
    }),

  setActiveTerminal: (id: string | null) => set('activeTerminalId', id),

  getTerminal: (id: string) => get('terminals').find((t) => t.id === id),

  getActiveTerminal: () => {
    const { terminals, activeTerminalId } = get('state')
    if (!activeTerminalId) return null
    return terminals.find((t) => t.id === activeTerminalId) ?? null
  },

  moveTerminal: (id: string, toIndex: number) =>
    set('terminals', (prev) => {
      const fromIndex = prev.findIndex((t) => t.id === id)
      if (fromIndex === -1) return prev
      const newTerminals = [...prev]
      const [terminal] = newTerminals.splice(fromIndex, 1)
      newTerminals.splice(toIndex, 0, terminal)
      return newTerminals
    }),
}))
