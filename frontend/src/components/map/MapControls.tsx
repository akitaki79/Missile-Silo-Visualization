import { LocateFixed, Minus, Navigation2, Plus, type LucideIcon } from 'lucide-react'
import type { CSSProperties, RefObject } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface MapControlsProps {
  mapRef: RefObject<MapRef | null>
  onFit: () => void
  canFit: boolean
  /** Current map bearing in degrees, so the compass needle points north. */
  bearing: number
}

/** Zoom, compass (reset north), and fit-to-base, built from shadcn Buttons. */
export function MapControls({ mapRef, onFit, canFit, bearing }: MapControlsProps) {
  return (
    <Card size="sm" className="absolute top-3 right-3 z-10 gap-0 p-1 shadow-md">
      <ControlButton icon={Plus} label="Zoom in" onClick={() => mapRef.current?.zoomIn()} />
      <ControlButton icon={Minus} label="Zoom out" onClick={() => mapRef.current?.zoomOut()} />
      <Separator className="my-1" />
      <ControlButton
        icon={Navigation2}
        label="Reset north"
        iconStyle={{ transform: `rotate(${-bearing}deg)` }}
        onClick={() => mapRef.current?.resetNorthPitch()}
      />
      <ControlButton icon={LocateFixed} label="Fit to base" onClick={onFit} disabled={!canFit} />
    </Card>
  )
}

function ControlButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  iconStyle,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  disabled?: boolean
  iconStyle?: CSSProperties
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
        >
          <Icon style={iconStyle} className="transition-transform" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left">{label}</TooltipContent>
    </Tooltip>
  )
}
