// Terminal store for multi-tab PTY state management using Zustand X.
// Manages terminal instances, tabs, and persistence.
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
    active: null as string | null,
    all: [] as LocalPTY[],
  },
  {
    name: 'opencode-terminal',
    persist: true,
    devtools: true,
  },
).extendActions(({ set, get }) => ({
  addTerminal: (pty: LocalPTY) =>
    set('state', (state) => ({
      ...state,
      all: [...state.all, pty],
      active: pty.id,
    })),

  updateTerminal: (pty: Partial<LocalPTY> & { id: string }) =>
    set('all', (all) => all.map((t) => (t.id === pty.id ? { ...t, ...pty } : t))),

  removeTerminal: (id: string) =>
    set('state', (state) => {
      const all = state.all.filter((t) => t.id !== id)
      let active = state.active
      if (active === id) {
        const index = state.all.findIndex((t) => t.id === id)
        const previous = state.all[Math.max(0, index - 1)]
        active = previous?.id ?? all[0]?.id ?? null
      }
      return { ...state, all, active }
    }),

  setActive: (id: string) => set('active', id),

  moveTerminal: (id: string, toIndex: number) =>
    set('all', (all) => {
      const fromIndex = all.findIndex((t) => t.id === id)
      if (fromIndex === -1) return all
      const newAll = [...all]
      const [item] = newAll.splice(fromIndex, 1)
      newAll.splice(toIndex, 0, item)
      return newAll
    }),

  replaceTerminal: (oldId: string, newPty: LocalPTY) =>
    set('state', (state) => {
      const index = state.all.findIndex((t) => t.id === oldId)
      if (index === -1) return state
      const newAll = [...state.all]
      newAll[index] = newPty
      return {
        ...state,
        all: newAll,
        active: state.active === oldId ? newPty.id : state.active,
      }
    }),

  clearAll: () =>
    set('state', () => ({
      active: null,
      all: [],
    })),

  getTerminalById: (id: string) => get('all').find((t) => t.id === id),

  getActiveTerminal: () => {
    const active = get('active')
    if (!active) return undefined
    return get('all').find((t) => t.id === active)
  },
}))
