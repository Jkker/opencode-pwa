import { createFileRoute } from '@tanstack/react-router'

import { HolyGrailLayout } from '../components/holy-grail/layout'

export const Route = createFileRoute('/layout')({
  component: Home,
})

export default function Home() {
  return (
    <HolyGrailLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Holy Grail Layout</h1>
        <p className="text-muted-foreground">
          A responsive layout with header, footer, left sidebar, right sidebar, and main content
          area.
        </p>

        <div className="p-4 rounded-lg border border-border bg-card">
          <h2 className="font-semibold text-card-foreground mb-2">Mobile Gestures</h2>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Swipe right anywhere to open the left navigation drawer</li>
            <li>Swipe left anywhere to open the right details drawer</li>
            <li>The bottom drawer is partially expanded by default with a resizable textarea</li>
            <li>Swipes are ignored inside horizontally scrollable containers</li>
          </ul>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <h2 className="font-semibold text-card-foreground mb-2">Horizontal Scroll Test</h2>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-3 w-max">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="w-32 h-24 rounded-md bg-muted flex items-center justify-center shrink-0"
                >
                  <span className="text-sm text-muted-foreground">Item {i + 1}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            ↔ Scroll horizontally — swipe gestures are disabled here
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-lg border border-border bg-card">
              <h3 className="font-medium text-card-foreground">Card {i + 1}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sample content for the holy grail layout demonstration.
              </p>
            </div>
          ))}
        </div>
      </div>
    </HolyGrailLayout>
  )
}
