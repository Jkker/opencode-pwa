/**
 * OpenCode project store using Zustand.
 * Manages projects list and current project.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project } from '@opencode-ai/sdk/v2/client'

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  expandedProjects: Set<string>
}

interface ProjectActions {
  setProjects: (projects: Project[]) => void
  setCurrentProject: (project: Project | null) => void
  addProject: (project: Project) => void
  removeProject: (worktree: string) => void
  expandProject: (worktree: string) => void
  collapseProject: (worktree: string) => void
  toggleProject: (worktree: string) => void
}

type ProjectStore = ProjectState & ProjectActions

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, _get) => ({
      projects: [],
      currentProject: null,
      expandedProjects: new Set<string>(),

      setProjects: (projects) => set({ projects }),
      
      setCurrentProject: (project) => set({ currentProject: project }),

      addProject: (project) =>
        set((state) => {
          const exists = state.projects.some((p) => p.worktree === project.worktree)
          if (exists) return state
          return { projects: [...state.projects, project] }
        }),

      removeProject: (worktree) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.worktree !== worktree),
          currentProject:
            state.currentProject?.worktree === worktree ? null : state.currentProject,
        })),

      expandProject: (worktree) =>
        set((state) => {
          const expanded = new Set(state.expandedProjects)
          expanded.add(worktree)
          return { expandedProjects: expanded }
        }),

      collapseProject: (worktree) =>
        set((state) => {
          const expanded = new Set(state.expandedProjects)
          expanded.delete(worktree)
          return { expandedProjects: expanded }
        }),

      toggleProject: (worktree) =>
        set((state) => {
          const expanded = new Set(state.expandedProjects)
          if (expanded.has(worktree)) {
            expanded.delete(worktree)
          } else {
            expanded.add(worktree)
          }
          return { expandedProjects: expanded }
        }),
    }),
    {
      name: 'opencode-projects',
      partialize: (state) => ({
        expandedProjects: Array.from(state.expandedProjects),
      }),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      onRehydrateStorage: () => (state) => {
        if (state) {
          const stored = state as unknown as { expandedProjects?: string[] }
          if (Array.isArray(stored.expandedProjects)) {
            state.expandedProjects = new Set(stored.expandedProjects)
          }
        }
      },
    }
  )
)
