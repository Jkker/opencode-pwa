import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/childrenRoute')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/childrenRoute"!</div>
}
