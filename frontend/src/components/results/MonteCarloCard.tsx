import { ChartNoAxesColumn, TriangleAlert } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { BatchApi } from '@/hooks/useBatch'
import { reductionistPrediction } from '@/sim/analytic'

const histConfig = {
  count: { label: 'Trials', color: 'var(--viz-1)' },
} satisfies ChartConfig

/** Lawrence (2026)-style batch results: mean ± SD over many trials, plus the distribution. */
export function MonteCarloCard({ batch }: { batch: BatchApi }) {
  const { result, params, siloCount, stale } = batch

  if (!result || !params || siloCount === null) {
    return (
      <Card size="sm" className="items-center py-8 text-center text-muted-foreground">
        <ChartNoAxesColumn className="size-5" aria-hidden />
        <p className="max-w-56 text-xs">
          Use <span className="font-medium text-foreground">Run N trials</span> to repeat the whole
          campaign many times and see the spread of outcomes.
        </p>
      </Card>
    )
  }

  const final = result.survivorsByVolley[result.survivorsByVolley.length - 1]
  const prediction = reductionistPrediction(params, siloCount)
  const wps = params.warheadsPerSilo
  if (!final) return null

  return (
    <div className="grid gap-4">
      {stale && (
        <p className="flex gap-2 rounded-md bg-maroon/8 p-2 text-xs text-maroon">
          <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
          Computed with earlier parameters. Run again to update.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {result.trials.toLocaleString()} trials · {params.volleys} volley
        {params.volleys > 1 ? 's' : ''} · seed {params.seed}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Card size="sm" className="col-span-2 gap-0.5 px-3">
          <p className="eyebrow-muted">Surviving silos after volley {params.volleys}</p>
          <p className="text-lg font-bold tabular-nums">
            {final.mean.toFixed(1)}{' '}
            <span className="text-sm font-medium text-muted-foreground">
              ± {final.sd.toFixed(1)} SD
            </span>
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            Range {final.min}–{final.max} · reductionist prediction{' '}
            {prediction[params.volleys]?.toFixed(1)}
          </p>
        </Card>
        <Card size="sm" className="col-span-2 gap-0.5 px-3">
          <p className="eyebrow-muted">Mean surviving warheads</p>
          <p className="text-lg font-bold tabular-nums">
            {(final.mean * wps).toFixed(1)}{' '}
            <span className="text-sm font-medium text-muted-foreground">
              ± {(final.sd * wps).toFixed(1)} SD
            </span>
          </p>
          <p className="text-xs text-muted-foreground">× {wps} warheads per silo</p>
        </Card>
      </div>

      {params.volleys > 1 && (
        <dl className="grid gap-1 text-xs tabular-nums">
          {result.survivorsByVolley.map((s, i) => (
            <div key={i} className="flex justify-between gap-2">
              <dt className="text-muted-foreground">After volley {i + 1}</dt>
              <dd>
                {s.mean.toFixed(1)} ± {s.sd.toFixed(1)}{' '}
                <span className="text-muted-foreground">
                  (pred. {prediction[i + 1]?.toFixed(1)})
                </span>
              </dd>
            </div>
          ))}
        </dl>
      )}

      <figure className="grid gap-1.5">
        <figcaption className="text-xs font-semibold">
          Distribution of survivors after volley {params.volleys}
        </figcaption>
        <ChartContainer config={histConfig} className="aspect-[4/3] w-full">
          <BarChart
            data={result.finalHistogram}
            margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
            barCategoryGap={2}
          >
            <CartesianGrid vertical={false} />
            <XAxis dataKey="survivors" tickLine={false} axisLine={false} tickMargin={6} />
            <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
            <ChartTooltip
              cursor={{ fill: 'var(--muted)' }}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const p = payload[0]?.payload as { survivors: number } | undefined
                    return `${p?.survivors ?? ''} silos surviving`
                  }}
                />
              }
            />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
        <p className="text-[0.6875rem] text-muted-foreground">
          Mean failures per volley: {result.meanDeliveryFailures.toFixed(1)} delivery,{' '}
          {result.meanWarheadFailures.toFixed(1)} warhead.
        </p>
      </figure>
    </div>
  )
}
