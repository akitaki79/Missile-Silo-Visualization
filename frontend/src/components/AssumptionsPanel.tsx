import { PanelRightClose, TriangleAlert } from 'lucide-react'
import { Fragment } from 'react'
import { PanelHeader } from '@/components/PanelHeader'
import { PanelSection } from '@/components/PanelSection'
import { MonteCarloCard } from '@/components/results/MonteCarloCard'
import { ResultsCard } from '@/components/results/ResultsCard'
import { RIGHT_SECTIONS } from '@/components/sections'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import type { BatchApi } from '@/hooks/useBatch'
import type { SimulationApi } from '@/hooks/useSimulation'
import type { SimulatorParamsApi } from '@/hooks/useSimulatorParams'
import { availableWarheads, overallReliability, sskp, tkp } from '@/sim/analytic'

interface AssumptionsPanelProps {
  sim: SimulatorParamsApi
  simulation: SimulationApi
  batch: BatchApi
  onCollapse: () => void
}

const DASH = '—'

export function AssumptionsPanel({ sim, simulation, batch, onCollapse }: AssumptionsPanelProps) {
  const base = sim.summary
  const {
    cepM,
    lethalRadiusM,
    missilesPerVolley,
    volleys,
    deliveryReliability: rDel,
    warheadReliability: rWh,
    warheadsPerSilo,
  } = sim.values
  const { reprogram, attackerKnowsKills } = sim.state.flags

  const rows: [label: string, value: string][] = [
    ['Target base', base?.name ?? DASH],
    ['Silo count', base ? base.siloCount.toLocaleString() : DASH],
    ['Warheads per silo', warheadsPerSilo?.toString() ?? DASH],
    ['CEP', withUnit(cepM, 'm')],
    ['Lethal radius', withUnit(lethalRadiusM, 'm')],
    ['Missiles per volley', missilesPerVolley?.toLocaleString() ?? DASH],
    ['Volleys', volleys?.toString() ?? DASH],
    ['Delivery reliability (R_del)', rDel?.toFixed(2) ?? DASH],
    ['Warhead reliability (R_wh)', rWh?.toFixed(2) ?? DASH],
    [
      'Overall reliability (OAR)',
      rDel !== undefined && rWh !== undefined ? overallReliability(rDel, rWh).toFixed(4) : DASH,
    ],
    ['Reprogramming (within volley)', reprogram ? 'On' : 'Off'],
    ['Damage assessment (between)', attackerKnowsKills ? 'Perfect' : 'None'],
  ]

  const s = cepM && lethalRadiusM ? sskp(lethalRadiusM, cepM) : undefined
  const rel =
    rDel !== undefined && rWh !== undefined
      ? { deliveryReliability: rDel, warheadReliability: rWh, reprogram }
      : undefined
  const t = s !== undefined && rel ? tkp(s, rel) : undefined
  const a =
    missilesPerVolley !== undefined && rel ? availableWarheads(missilesPerVolley, rel) : undefined

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
                <div className="flex items-baseline justify-between gap-4 py-1.5">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="truncate text-right font-medium tabular-nums">{value}</dd>
                </div>
              </Fragment>
            ))}
          </dl>

          <div className="mt-4 grid gap-2 rounded-lg border bg-muted/60 p-3 font-mono text-xs">
            <p className="font-sans eyebrow-muted">Reductionist model · Lawrence (2026)</p>
            <p>SSKP = 1 − 0.5^((LR / CEP)²)</p>
            <p className="text-sm font-semibold text-foreground tabular-nums">
              = {s === undefined ? DASH : s.toFixed(4)}
            </p>
            <p>{reprogram ? 'TKP = R_wh · SSKP' : 'TKP = R_del · R_wh · SSKP'}</p>
            <p className="text-sm font-semibold text-foreground tabular-nums">
              = {t === undefined ? DASH : t.toFixed(4)}
            </p>
            <p>Pkill(n) = 1 − (1 − TKP)^n</p>
            <p>x̄ = Σ (1 − Pkill(nᵢ)) + untargeted</p>
            {reprogram && (
              <p className="font-sans text-muted-foreground">
                Reprogramming (Davis &amp; Schilling): A = N · R_del ={' '}
                <span className="font-mono text-foreground">{a ?? DASH}</span> warheads allocated
                per volley.
              </p>
            )}
          </div>
        </PanelSection>
        <Separator />

        <PanelSection section={RIGHT_SECTIONS.results}>
          <ResultsCard simulation={simulation} base={base} warheadsPerSilo={warheadsPerSilo} />
        </PanelSection>
        <Separator />

        <PanelSection section={RIGHT_SECTIONS.monteCarlo}>
          <MonteCarloCard batch={batch} />
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
                  Unverified coordinates. Don&apos;t treat them as confirmed silo locations.
                </p>
              )}
            </CardContent>
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
