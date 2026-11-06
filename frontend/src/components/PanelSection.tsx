import type { ReactNode } from 'react'
import type { SectionDef } from '@/components/sections'
import { cn } from '@/lib/utils'

interface PanelSectionProps {
  section: SectionDef
  children: ReactNode
  /** Replaces the plain title, e.g. with a Collapsible trigger. */
  heading?: ReactNode
  className?: string
}

/** Icon + bold title header and a body. The DOM id lets collapsed rails scroll here. */
export function PanelSection({ section, children, heading, className }: PanelSectionProps) {
  const Icon = section.icon
  return (
    <section id={section.id} className={cn('scroll-mt-4 px-5 py-5', className)}>
      {heading ?? (
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Icon className="size-4 text-muted-foreground" aria-hidden />
          {section.title}
        </h2>
      )}
      {children}
    </section>
  )
}
