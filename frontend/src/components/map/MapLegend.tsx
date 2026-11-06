import { Card } from '@/components/ui/card'
import { VOLLEY_COLOR_SLOTS } from '@/config/defaults'
import { cn } from '@/lib/utils'

const VOLLEY_SWATCH = ['bg-viz-1', 'bg-viz-2', 'bg-viz-3'] as const
const VOLLEY_RING = ['border-viz-1', 'border-viz-2', 'border-viz-3'] as const

interface MapLegendProps {
  /** Show destroyed / not-targeted silo states (only once a run exists). */
  showSimStates: boolean
  /** Volleys with impacts on the map. */
  volleys: number
}

/** Bottom-left key for silo states and volley colours. Colour is never the only cue: every swatch is labelled. */
export function MapLegend({ showSimStates, volleys }: MapLegendProps) {
  const named = Math.min(volleys, VOLLEY_COLOR_SLOTS)
  return (
    <Card
      size="sm"
      className="absolute bottom-9 left-2.5 z-10 gap-1.5 px-3 py-2 text-[0.6875rem] shadow-md"
    >
      <Row>
        <Dot className="bg-map-silo" /> Intact silo
      </Row>
      {showSimStates && (
        <>
          <Row>
            <Dot className="bg-map-silo-destroyed" /> Destroyed
          </Row>
          <Row>
            <Dot className="bg-map-silo-untargeted" /> Not targeted this volley
          </Row>
        </>
      )}
      {volleys > 0 && (
        <>
          <div className="my-0.5 h-px bg-border" />
          {Array.from({ length: named }, (_, i) => (
            <Row key={i}>
              <Dot className={cn('size-2', VOLLEY_SWATCH[i])} /> Volley {i + 1} impact
            </Row>
          ))}
          {volleys > VOLLEY_COLOR_SLOTS && (
            <Row>
              <Dot className="size-2 bg-viz-other" /> Volley {VOLLEY_COLOR_SLOTS + 1}+ impact
            </Row>
          )}
          <Row>
            <span
              className={cn('inline-block size-2 rounded-full border-[1.5px]', VOLLEY_RING[0])}
            />
            Dud (warhead failure)
          </Row>
        </>
      )}
    </Card>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2 whitespace-nowrap">{children}</div>
}

function Dot({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-block size-2.5 rounded-full ring-1 ring-background', className)}
      aria-hidden
    />
  )
}
