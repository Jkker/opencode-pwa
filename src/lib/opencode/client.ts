// OpenCode SDK client configuration and factory.
// Uses @opencode-ai/sdk/v2 for API communication.
import { createOpencodeClient } from '@opencode-ai/sdk/v2/client'

import { settingStore } from '@/stores/setting-store'

export const useClient = (directory?: string) => {
  const baseUrl = settingStore.useValue('serverURL')
  return createOpencodeClient({ baseUrl, directory, throwOnError: true })
}
