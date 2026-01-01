import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/deep/nested')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/deep/nested"!</div>
}
