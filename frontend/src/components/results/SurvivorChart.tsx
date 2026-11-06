import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

export interface SurvivorPoint {
  volley: number
  simulated?: number
  conditional?: number
  prediction?: number
}

const SERIES = [
  { key: 'simulated', label: 'Simulated', dash: undefined },
  { key: 'conditional', label: 'Expected (per volley, conditional)', dash: '6 4' },
  { key: 'prediction', label: 'Reductionist prediction (up-front)', dash: '1.5 3.5' },
] as const

// Validated categorical slots (index.css --viz-*); the dash pattern is the secondary cue.
const config = {
  simulated: { label: SERIES[0].label, color: 'var(--viz-1)' },
  conditional: { label: SERIES[1].label, color: 'var(--viz-2)' },
  prediction: { label: SERIES[2].label, color: 'var(--viz-3)' },
} satisfies ChartConfig

/** Surviving silos after each volley vs. the two analytic expectations. */
export function SurvivorChart({ data, siloCount }: { data: SurvivorPoint[]; siloCount: number }) {
  return (
    <figure className="grid gap-2">
      <ChartContainer config={config} className="aspect-[4/3] w-full">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} strokeDasharray="0" />
          <XAxis
            dataKey="volley"
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            tickFormatter={(v: number) => (v === 0 ? 'Start' : `V${v}`)}
          />
          <YAxis
            domain={[0, siloCount]}
            tickLine={false}
            axisLine={false}
            width={40}
            allowDecimals={false}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_, payload) => {
                  const v = (payload[0]?.payload as SurvivorPoint | undefined)?.volley
                  return v === 0 ? 'Before firing' : `After volley ${v}`
                }}
                formatter={(value, name) => (
                  <div className="flex w-full justify-between gap-3">
                    <span className="text-muted-foreground">
                      {config[name as keyof typeof config]?.label ?? name}
                    </span>
                    <span className="font-mono font-medium tabular-nums">
                      {Number(value).toFixed(1)}
                    </span>
                  </div>
                )}
              />
            }
          />
          {SERIES.map(({ key, dash }) => (
            <Line
              key={key}
              dataKey={key}
              type="linear"
              stroke={`var(--color-${key})`}
              strokeWidth={2}
              strokeDasharray={dash}
              dot={{ r: 4, strokeWidth: 2, fill: 'var(--card)' }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ChartContainer>
      <figcaption className="grid gap-1 text-[0.6875rem] text-muted-foreground">
        {SERIES.map(({ key, label, dash }) => (
          <span key={key} className="flex items-center gap-2">
            <svg width="22" height="8" aria-hidden className="shrink-0">
              <line
                x1="1"
                x2="21"
                y1="4"
                y2="4"
                stroke={config[key].color}
                strokeWidth="2"
                strokeDasharray={dash}
                strokeLinecap="round"
              />
            </svg>
            {label}
          </span>
        ))}
      </figcaption>
    </figure>
  )
}
