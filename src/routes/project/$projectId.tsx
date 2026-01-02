// Project layout route.
// Wraps project-specific routes with project context.
import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/project/$projectId')({
  component: ProjectLayout,
})

function ProjectLayout() {
  const { projectId: _projectId } = Route.useParams()

  return (
    <div className="flex h-full flex-col">
      <Outlet />
    </div>
  )
}
