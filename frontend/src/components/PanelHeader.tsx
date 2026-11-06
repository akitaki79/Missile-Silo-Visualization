import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface PanelHeaderProps {
  eyebrow: string
  title: string
  collapseIcon: LucideIcon
  collapseLabel: string
  shortcut: string
  onCollapse: () => void
  /** Larger title for the main (left) panel. */
  size?: 'lg' | 'md'
}

export function PanelHeader({
  eyebrow,
  title,
  collapseIcon: Icon,
  collapseLabel,
  shortcut,
  onCollapse,
  size = 'md',
}: PanelHeaderProps) {
  return (
    <header className="flex items-start gap-3 border-b px-5 pt-5 pb-4">
      <div className="grid min-w-0 flex-1 gap-1.5">
        <p className="eyebrow">{eyebrow}</p>
        <h1
          className={cn(
            'font-bold tracking-tight text-balance',
            size === 'lg' ? 'text-[1.625rem] leading-[1.1]' : 'text-xl leading-tight',
          )}
        >
          {title}
        </h1>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" onClick={onCollapse} aria-label={collapseLabel}>
            <Icon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {collapseLabel} <kbd className="ml-1 font-mono opacity-70">{shortcut}</kbd>
        </TooltipContent>
      </Tooltip>
    </header>
  )
}
