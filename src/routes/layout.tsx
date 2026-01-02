import { createFileRoute } from '@tanstack/react-router'

import { HolyGrailLayout } from '../components/holy-grail/layout'

export const Route = createFileRoute('/layout')({
  component: LayoutDemo,
})

export default function LayoutDemo() {
  return (
    <HolyGrailLayout showPrompt={false}>
      <div className="max-w-3xl mx-auto space-y-6 p-4 md:p-6">
        <h1 className="text-3xl font-bold text-foreground">Layout Demo</h1>
        <p className="text-muted-foreground">
          This is a demonstration of the Holy Grail layout with left and right sidebars.
        </p>

        <div className="p-4 rounded-lg border border-border bg-card">
          <h2 className="font-semibold text-card-foreground mb-2">Features</h2>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Left panel: Projects & Sessions with diff stats</li>
            <li>Right panel: Status, Changes, and Terminal tabs</li>
            <li>Bottom panel: Auto-resizing prompt input with toolbar</li>
            <li>Swipe gestures on mobile</li>
          </ul>
        </div>

        <div className="p-4 rounded-lg border border-border bg-card">
          <h2 className="font-semibold text-card-foreground mb-2">Mobile Gestures</h2>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Swipe right anywhere to open the left navigation drawer</li>
            <li>Swipe left anywhere to open the right details drawer</li>
            <li>Swipes are ignored inside horizontally scrollable containers</li>
          </ul>
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
