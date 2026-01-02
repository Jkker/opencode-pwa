// Project layout route.
// Wraps project-specific routes with project context.
import { createFileRoute, Outlet } from '@tanstack/react-router'

import { useOpencodeEvents } from '@/lib/opencode'

export const Route = createFileRoute('/project/$projectId')({
  component: ProjectLayout,
})

function ProjectLayout() {
  const { projectId } = Route.useParams()

  // Subscribe to real-time events for this project
  useOpencodeEvents(projectId)

  return (
    <div className="flex h-full flex-col">
      <Outlet />
    </div>
  )
}
