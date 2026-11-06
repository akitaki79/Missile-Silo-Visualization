import { Dices, LoaderCircle, Play, RotateCcw, TriangleAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BatchApi } from '@/hooks/useBatch'
import type { SimulationApi } from '@/hooks/useSimulation'

interface ActionBarProps {
  simulation: SimulationApi
  batch: BatchApi
  /** Params valid and base loaded. */
  canRun: boolean
  trials: number | undefined
  onFire: () => void
  onReset: () => void
  onRunTrials: () => void
}

export function ActionBar({
  simulation,
  batch,
  canRun,
  trials,
  onFire,
  onReset,
  onRunTrials,
}: ActionBarProps) {
  const { phase, stale, nextVolley, totalVolleys } = simulation
  const fireLabel =
    phase === 'idle'
      ? 'Run volley 1'
      : phase === 'animating'
        ? `Firing volley ${nextVolley - 1}…`
        : phase === 'done'
          ? `All ${totalVolleys} volleys fired`
          : `Fire volley ${nextVolley} of ${totalVolleys}`

  return (
    <div className="grid gap-2 border-t bg-background px-5 py-4">
      {stale && (
        <p
          role="status"
          className="flex gap-2 rounded-md bg-maroon/8 p-2 text-xs leading-relaxed text-maroon"
        >
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          Parameters changed since this run started. Reset to apply them.
        </p>
      )}
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Button
          size="lg"
          onClick={onFire}
          disabled={!canRun || stale || phase === 'animating' || phase === 'done'}
        >
          {phase === 'animating' ? (
            <LoaderCircle data-icon="inline-start" className="animate-spin" />
          ) : (
            <Play data-icon="inline-start" />
          )}
          {fireLabel}
        </Button>
        <Button size="lg" variant="outline" onClick={onReset}>
          <RotateCcw data-icon="inline-start" />
          Reset
        </Button>
      </div>
      {batch.running && batch.progress ? (
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Button variant="secondary" disabled>
            <LoaderCircle data-icon="inline-start" className="animate-spin" />
            Running trials… {batch.progress.done.toLocaleString()} /{' '}
            {batch.progress.total.toLocaleString()}
          </Button>
          <Button variant="ghost" size="icon" onClick={batch.cancel} aria-label="Cancel trials">
            <X />
          </Button>
        </div>
      ) : (
        <Button variant="secondary" onClick={onRunTrials} disabled={!canRun}>
          <Dices data-icon="inline-start" />
          Run {trials?.toLocaleString() ?? 'N'} trials
        </Button>
      )}
    </div>
  )
}
