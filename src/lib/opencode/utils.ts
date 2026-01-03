import type { Project, Session } from '@opencode-ai/sdk/v2/client'

import { formatDateTime, getTz } from '../temporal-utils'

export const formatSessionTitle = ({ title }: Session): string => {
  if (title.match(/^New session - \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)) {
    const dateStr = title.replace('New session - ', '')
    const dt = Temporal.Instant.from(dateStr).toZonedDateTimeISO(getTz())
    return formatDateTime(dt)
  }
  return title || 'Untitled'
}

export const formatProjectName = ({ name, worktree }: Project): string => {
  return name || worktree.split('/').at(-1) || worktree
}
