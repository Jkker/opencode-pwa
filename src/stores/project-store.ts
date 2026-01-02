import { createStore } from 'zustand-x'

import type { Project } from '@/lib/opencode'

export const projectStore = createStore<{
  projects: Project[]
  currentProject: Project | null
  expandedProjects: Record<string, boolean>
}>(
  {
    projects: [] as Project[],
    currentProject: null as Project | null,
    expandedProjects: {},
  },
  {
    name: 'opencode-projects',
    persist: true,
    devtools: true,
  },
).extendActions(({ set }) => ({
  addProject: (project: Project) =>
    set('projects', (prev) => {
      const exists = prev.some((p) => p.worktree === project.worktree)
      if (!exists) return [...prev, project]
      return prev
    }),
  removeProject: (worktree: string) =>
    set('state', (state) => {
      const updatedProjects = (state.projects || []).filter((p) => p.worktree !== worktree)
      const updatedCurrentProject =
        state.currentProject?.worktree === worktree ? null : state.currentProject
      return {
        ...state,
        projects: updatedProjects,
        currentProject: updatedCurrentProject,
      }
    }),
  expandProject: (projectId: string) =>
    set('expandedProjects', (prev) => ({
      ...prev,
      [projectId]: true,
    })),
  collapseProject: (projectId: string) =>
    set('expandedProjects', (prev) => {
      const { [projectId]: _, ...rest } = prev
      return rest
    }),
  toggleProject: (projectId: string) =>
    set('expandedProjects', (prev) => {
      if (prev[projectId]) {
        const { [projectId]: _, ...rest } = prev
        return rest
      }
      return {
        ...prev,
        [projectId]: true,
      }
    }),
}))
