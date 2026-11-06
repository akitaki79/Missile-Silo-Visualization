import { PanelLeftOpen, PanelRightOpen } from 'lucide-react'
import { useRef, type ReactNode, type TransitionEvent } from 'react'
import { CollapsedRail } from '@/components/CollapsedRail'
import type { SectionDef } from '@/components/sections'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { PanelState, Side } from '@/hooks/usePanelState'
import { cn } from '@/lib/utils'

const WIDTH: Record<Side, number> = { left: 390, right: 340 }
const RAIL_WIDTH = 44

interface PanelSlot {
  title: string
  content: ReactNode
  sections: SectionDef[]
}

interface AppShellProps {
  panels: PanelState
  left: PanelSlot
  right: PanelSlot
  /** Called once a panel finishes opening/closing, so the map can re-measure. */
  onLayoutChange: () => void
  /** The map area. */
  children: ReactNode
}

/**
 * Desktop (≥1024px): three columns; panels animate between full width and a
 * 44px rail, pushing the map. Mobile: full-screen map, panels as Sheets on top.
 */
export function AppShell({ panels, left, right, onLayoutChange, children }: AppShellProps) {
  // Section a rail click asked for; scrolled to once the panel has finished opening.
  const pendingSection = useRef<string | null>(null)

  function afterTransition() {
    onLayoutChange()
    const id = pendingSection.current
    pendingSection.current = null
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (!panels.isDesktop) {
    return (
      <div className="relative h-dvh overflow-hidden">
        <main className="absolute inset-0">{children}</main>
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          <FloatingButton
            icon={PanelLeftOpen}
            label="Open controls"
            onClick={() => panels.setOpen('left', true)}
          />
          <FloatingButton
            icon={PanelRightOpen}
            label="Open model panel"
            onClick={() => panels.setOpen('right', true)}
          />
        </div>
        {(['left', 'right'] as const).map((side) => {
          const slot = side === 'left' ? left : right
          return (
            <Sheet key={side} open={panels[side]} onOpenChange={(o) => panels.setOpen(side, o)}>
              <SheetContent
                side={side}
                showCloseButton={false}
                aria-describedby={undefined}
                className="max-w-[calc(100vw-2rem)] gap-0 bg-background p-0 data-[side=left]:w-[390px] data-[side=right]:w-[340px] data-[side=left]:sm:max-w-none data-[side=right]:sm:max-w-none"
              >
                <SheetTitle className="sr-only">{slot.title}</SheetTitle>
                {slot.content}
              </SheetContent>
            </Sheet>
          )
        })}
      </div>
    )
  }

  const panel = (side: Side) => {
    const slot = side === 'left' ? left : right
    const open = panels[side]
    const width = open ? WIDTH[side] : RAIL_WIDTH
    return (
      <aside
        aria-label={slot.title}
        style={{ width }}
        onTransitionEnd={(e: TransitionEvent) => {
          if (e.target === e.currentTarget && e.propertyName === 'width') afterTransition()
        }}
        className={cn(
          'relative z-20 shrink-0 overflow-hidden bg-background transition-[width] duration-200 ease-out',
          side === 'left' ? 'border-r' : 'border-l',
        )}
      >
        {/* Fixed-width inner box so content is revealed, not reflowed, during the animation. */}
        <div
          style={{ width }}
          className={cn('absolute inset-y-0', side === 'left' ? 'left-0' : 'right-0')}
        >
          {open ? (
            slot.content
          ) : (
            <CollapsedRail
              side={side}
              sections={slot.sections}
              expandLabel={side === 'left' ? 'Expand controls' : 'Expand model panel'}
              shortcut={side === 'left' ? '[' : ']'}
              onExpand={() => panels.setOpen(side, true)}
              onSection={(id) => {
                pendingSection.current = id
                panels.setOpen(side, true)
              }}
            />
          )}
        </div>
      </aside>
    )
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      {panel('left')}
      <main className="relative min-w-0 flex-1">{children}</main>
      {panel('right')}
    </div>
  )
}

function FloatingButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof PanelLeftOpen
  label: string
  onClick: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="bg-card shadow-md"
          onClick={onClick}
          aria-label={label}
        >
          <Icon />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}
