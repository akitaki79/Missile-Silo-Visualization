import { ChartColumn, PanelRightClose, TriangleAlert } from 'lucide-react'
import { Fragment } from 'react'
import { PanelHeader } from '@/components/PanelHeader'
import { PanelSection } from '@/components/PanelSection'
import { RIGHT_SECTIONS } from '@/components/sections'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import type { SimulatorParamsApi } from '@/hooks/useSimulatorParams'
import { sskp } from '@/lib/sskp'
import type { BaseSummary } from '@/types'

interface AssumptionsPanelProps {
  sim: SimulatorParamsApi
  base: BaseSummary | undefined
  onCollapse: () => void
}

const DASH = '—'

export function AssumptionsPanel({ sim, base, onCollapse }: AssumptionsPanelProps) {
  const { cepM, lethalRadiusM, missilesPerVolley, volleys, reliability } = sim.values
  const rows: [label: string, value: string][] = [
    ['Target base', base?.name ?? DASH],
    ['Silo count', base ? base.siloCount.toLocaleString() : DASH],
    ['CEP', withUnit(cepM, 'm')],
    ['Lethal radius', withUnit(lethalRadiusM, 'm')],
    ['Missiles per volley', missilesPerVolley?.toLocaleString() ?? DASH],
    ['Volleys', volleys?.toString() ?? DASH],
    ['Reliability', reliability?.toFixed(2) ?? DASH],
  ]
  const p = cepM && lethalRadiusM ? sskp(lethalRadiusM, cepM) : undefined

  return (
    <div className="flex h-full flex-col">
      <PanelHeader
        eyebrow="Model"
        title="Assumptions"
        collapseIcon={PanelRightClose}
        collapseLabel="Collapse model panel"
        shortcut="]"
        onCollapse={onCollapse}
      />
      <ScrollArea className="min-h-0 flex-1">
        <PanelSection section={RIGHT_SECTIONS.assumptions}>
          <dl className="text-sm">
            {rows.map(([label, value], i) => (
              <Fragment key={label}>
                {i > 0 && <Separator />}
                <div className="flex items-baseline justify-between gap-4 py-2">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="truncate text-right font-medium tabular-nums">{value}</dd>
                </div>
              </Fragment>
            ))}
          </dl>

          <div className="mt-4 grid gap-2 rounded-lg border bg-muted/60 p-3 font-mono text-xs">
            <p className="font-sans eyebrow-muted">Single-shot kill probability</p>
            <p>SSKP = 1 − 0.5^((LR / CEP)²)</p>
            {p !== undefined && (
              <p className="text-muted-foreground">
                = 1 − 0.5^(({lethalRadiusM} / {cepM})²)
              </p>
            )}
            <p className="text-base font-semibold text-foreground tabular-nums">
              = {p === undefined ? DASH : p.toFixed(3)}
            </p>
          </div>
        </PanelSection>
        <Separator />

        <PanelSection section={RIGHT_SECTIONS.sources}>
          <Card size="sm">
            <CardHeader>
              <CardTitle className="font-semibold">{base?.name ?? 'No base selected'}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-xs">
              {base && <SourceText source={base.source} />}
              {base?.dataStatus === 'placeholder' && (
                <p className="flex gap-2 rounded-md bg-maroon/8 p-2 text-maroon">
                  <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
                  Placeholder coordinates. These are not real silo locations.
                </p>
              )}
            </CardContent>
          </Card>
        </PanelSection>
        <Separator />

        <PanelSection section={RIGHT_SECTIONS.results}>
          <Card size="sm" className="items-center py-8 text-center text-muted-foreground">
            <ChartColumn className="size-5" aria-hidden />
            <p className="text-xs">Run a volley to see results</p>
          </Card>
        </PanelSection>
      </ScrollArea>
    </div>
  )
}

function SourceText({ source }: { source: string }) {
  if (!source) return <p className="text-muted-foreground">No source listed.</p>
  if (/^https?:\/\/\S+$/.test(source))
    return (
      <a href={source} target="_blank" rel="noopener noreferrer" className="break-all underline">
        {source}
      </a>
    )
  return <p className="leading-relaxed text-muted-foreground">{source}</p>
}

function withUnit(value: number | undefined, unit: string): string {
  return value === undefined ? DASH : `${value.toLocaleString()} ${unit}`
}
