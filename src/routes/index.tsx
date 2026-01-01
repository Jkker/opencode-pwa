import { createFileRoute } from '@tanstack/react-router'
import {
  PlusIcon,
  BluetoothIcon,
  Home,
  CalendarIcon,
  ClockIcon,
  TimerIcon,
  ZapIcon,
} from 'lucide-react'

import { CopyToClipboardExample } from '@/components/copy-to-clipboard-example'
import { FormExample } from '@/components/form-example'
import { TaskListExample } from '@/components/task-list-example'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  formatCurrency,
  formatDateTime,
  formatDuration,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  getDaysUntil,
  isOverdue,
  isDueSoon,
} from '@/lib/temporal-utils'

export const Route = createFileRoute('/')({
  staticData: {
    icon: Home,
  },
  component: function ExamplesPage() {
    const now = Temporal.Now.plainDateTimeISO()
    const futureDate = now.add({ days: 5, hours: 3 })
    const pastDate = now.subtract({ days: 2, hours: 5 })
    const duration = Temporal.Duration.from({ hours: 2, minutes: 30, seconds: 45 })

    return (
      <article className="container mx-auto p-6 space-y-8">
        <header>
          <h1 className="text-4xl font-bold mb-2">Examples</h1>
          <p className="text-muted-foreground text-lg">
            Demonstrations of temporal-polyfill, Drawer component, and Zustand state management
          </p>
        </header>

        <main className="grid gap-8 lg:grid-cols-2">
          <TaskListExample />
          <CopyToClipboardExample />
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Temporal Polyfill Examples
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  Date/Time Formatting
                </h3>
                <div className="space-y-1 text-sm pl-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Full format:</span>
                    <span className="font-mono">{formatDateTime(now, 'full')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Long format:</span>
                    <span className="font-mono">{formatDateTime(now, 'long')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Short format:</span>
                    <span className="font-mono">{formatDateTime(now, 'short')}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <ZapIcon className="h-4 w-4" />
                  Relative Time
                </h3>
                <div className="space-y-1 text-sm pl-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">5 days from now:</span>
                    <span className="font-mono">{formatRelativeTime(futureDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">2 days ago:</span>
                    <span className="font-mono">{formatRelativeTime(pastDate)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <TimerIcon className="h-4 w-4" />
                  Duration & Time Helpers
                </h3>
                <div className="space-y-1 text-sm pl-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration (2h 30m 45s):</span>
                    <span className="font-mono">{formatDuration(duration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Days until 5 days from now:</span>
                    <span className="font-mono">{getDaysUntil(futureDate)} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Is 5 days from now overdue?</span>
                    <span className="font-mono">{isOverdue(futureDate) ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Is 5 days from now due soon?</span>
                    <span className="font-mono">{isDueSoon(futureDate, 7) ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Number & Currency Formatting</h3>
                <div className="space-y-1 text-sm pl-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency ($1,234.56):</span>
                    <span className="font-mono">{formatCurrency(1234.56)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Decimal (3.14159):</span>
                    <span className="font-mono">{formatNumber(Math.PI, 4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Percent (75.5%):</span>
                    <span className="font-mono">{formatPercent(75.5)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Technical Implementation Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Zustand State Management</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Strict TypeScript interfaces for type safety</li>
                  <li>External mutations declared outside store</li>
                  <li>
                    Sparse updates with{' '}
                    <code className="font-mono text-xs bg-muted px-1 rounded">setState()</code>
                  </li>
                  <li>Computed selectors for derived state</li>
                  <li>Arktype runtime validation for inputs</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Drawer Component (Vaul)</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Sheet-style drawer for mobile-first design</li>
                  <li>Controlled open/close state</li>
                  <li>Smooth animations with Tailwind</li>
                  <li>Accessible with proper ARIA attributes</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Temporal Polyfill</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Temporal API for modern date/time handling</li>
                  <li>Intl.DateTimeFormat for localized formatting</li>
                  <li>Intl.RelativeTimeFormat for human-readable times</li>
                  <li>Intl.DurationFormat for duration representation</li>
                  <li>Intl.NumberFormat for numbers and currency</li>
                  <li>
                    Immutable operations with{' '}
                    <code className="font-mono text-xs bg-muted px-1 rounded">Temporal</code> types
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
          <Card>
            <div className="bg-primary absolute inset-0 z-30 aspect-video opacity-50 mix-blend-color" />
            <img
              src="https://images.unsplash.com/photo-1604076850742-4c7221f3101b?q=80&w=1887&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Photo by mymind on Unsplash"
              title="Photo by mymind on Unsplash"
              className="relative z-20 aspect-video w-full object-cover brightness-60 grayscale"
            />
            <CardHeader>
              <CardTitle>Observability Plus is replacing Monitoring</CardTitle>
              <CardDescription>
                Switch to the improved way to explore your data, with natural language. Monitoring
                will no longer be available on the Pro plan in November, 2025
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <AlertDialog>
                <AlertDialogTrigger render={<Button />}>
                  <PlusIcon data-icon="inline-start" />
                  Show Dialog
                </AlertDialogTrigger>
                <AlertDialogContent size="sm">
                  <AlertDialogHeader>
                    <AlertDialogMedia>
                      <BluetoothIcon />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Allow accessory to connect?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Do you want to allow the USB accessory to connect to this device?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Don&apos;t allow</AlertDialogCancel>
                    <AlertDialogAction>Allow</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Badge variant="secondary" className="ml-auto">
                Warning
              </Badge>
            </CardFooter>
          </Card>
          <FormExample />
        </main>
      </article>
    )
  },
})
