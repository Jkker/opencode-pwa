import { createFileRoute, Outlet } from '@tanstack/react-router'
import { LayoutDashboard } from 'lucide-react'

export const Route = createFileRoute('/app')({
  staticData: {
    icon: LayoutDashboard,
  },
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div>
      Hello "/app"!
      <Outlet />
    </div>
  )
}
