import { CheckIcon, ServerIcon, TestTubeIcon, XIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useServerStore } from '@/lib/opencode/server-store'

export function ServerSettingsDialog() {
  const { url, healthy, setUrl } = useServerStore()
  const [open, setOpen] = useState(false)
  const [inputUrl, setInputUrl] = useState(url)
  const [testing, setTesting] = useState(false)

  const handleSave = () => {
    setUrl(inputUrl)
    setOpen(false)
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      const client = (await import('@/lib/opencode/client')).getOpencodeClient()
      await client.global.health()
    } catch {
    } finally {
      setTesting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="sm" className="gap-2">
            <ServerIcon className="size-4" />
            Server Settings
          </Button>
        }
      />
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Server Connection</SheetTitle>
          <SheetDescription>
            Configure your OpenCode server connection. Changes will be saved automatically.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="server-url">Server URL</Label>
            <div className="flex gap-2">
              <Input
                id="server-url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="http://localhost:4096"
              />
              <Button variant="outline" size="icon" onClick={handleTest} disabled={testing}>
                {testing ? (
                  <TestTubeIcon className="animate-spin size-4" />
                ) : (
                  <TestTubeIcon className="size-4" />
                )}
              </Button>
            </div>
            {healthy !== undefined && (
              <div className="flex items-center gap-2 text-sm">
                {healthy ? (
                  <>
                    <CheckIcon className="text-green-500 size-4" />
                    <span className="text-green-500">Connected</span>
                  </>
                ) : (
                  <>
                    <XIcon className="text-red-500 size-4" />
                    <span className="text-red-500">Connection failed</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <SheetFooter>
          <Button onClick={handleSave}>Save</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
