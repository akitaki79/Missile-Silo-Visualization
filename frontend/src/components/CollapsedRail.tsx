import { PanelLeftOpen, PanelRightOpen } from 'lucide-react'
import type { SectionDef } from '@/components/sections'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Side } from '@/hooks/usePanelState'

interface CollapsedRailProps {
  side: Side
  sections: SectionDef[]
  expandLabel: string
  shortcut: string
  onExpand: () => void
  /** Expand, then scroll the panel to this section. */
  onSection: (sectionId: string) => void
}

/** Slim (44px) stand-in for a collapsed panel: expand button + section shortcuts. */
export function CollapsedRail({
  side,
  sections,
  expandLabel,
  shortcut,
  onExpand,
  onSection,
}: CollapsedRailProps) {
  const ExpandIcon = side === 'left' ? PanelLeftOpen : PanelRightOpen
  const tooltipSide = side === 'left' ? 'right' : 'left'

  return (
    <nav aria-label={expandLabel} className="flex h-full w-11 flex-col items-center gap-1 py-4">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" onClick={onExpand} aria-label={expandLabel}>
            <ExpandIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent side={tooltipSide}>
          {expandLabel} <kbd className="ml-1 font-mono opacity-70">{shortcut}</kbd>
        </TooltipContent>
      </Tooltip>
      <Separator className="my-2 w-6!" />
      {sections.map(({ id, title, icon: Icon }) => (
        <Tooltip key={id}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              onClick={() => onSection(id)}
              aria-label={title}
            >
              <Icon />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={tooltipSide}>{title}</TooltipContent>
        </Tooltip>
      ))}
    </nav>
  )
}
