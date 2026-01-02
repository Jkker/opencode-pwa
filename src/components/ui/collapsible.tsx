'use client'

import type { ComponentRef, ComponentPropsWithoutRef, Ref } from 'react'

import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible'

import { cn } from '@/lib/utils'

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.Trigger

interface CollapsibleContentProps extends ComponentPropsWithoutRef<
  typeof CollapsiblePrimitive.Panel
> {
  ref?: Ref<ComponentRef<typeof CollapsiblePrimitive.Panel>>
}

function CollapsibleContent({ className, ref, ...props }: CollapsibleContentProps) {
  return (
    <CollapsiblePrimitive.Panel
      ref={ref}
      className={cn(
        'overflow-hidden transition-all data-[ending-style]:h-0 data-[starting-style]:h-0',
        className,
      )}
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
