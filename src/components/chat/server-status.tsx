import { useServerState } from '@/lib/opencode'
import { cn } from '@/lib/utils'

interface ServerStatusProps {
  className?: string
  showLabel?: boolean
}

/**
 * Server connection status indicator.
 * Shows a colored dot indicating the connection state.
 */
export function ServerStatus({ className, showLabel = true }: ServerStatusProps) {
  const server = useServerState()

  const statusColor =
    server.healthy === true
      ? 'bg-green-500'
      : server.healthy === false
        ? 'bg-red-500'
        : 'bg-yellow-500'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'h-2 w-2 rounded-full',
          statusColor,
          server.healthy === undefined && 'animate-pulse'
        )}
      />
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          {server.name}
          {server.version && server.healthy && (
            <span className="text-xs ml-1">v{server.version}</span>
          )}
        </span>
      )}
    </div>
  )
}
