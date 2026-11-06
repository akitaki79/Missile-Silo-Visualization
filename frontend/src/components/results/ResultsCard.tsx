import { ChartColumn, FileDown } from 'lucide-react'
import { SurvivorChart, type SurvivorPoint } from '@/components/results/SurvivorChart'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { SimulationApi } from '@/hooks/useSimulation'
import { downloadFile, resultsToCsv, resultsToJson } from '@/lib/export'
import type { BaseSummary } from '@/types'

interface ResultsCardProps {
  simulation: SimulationApi
  base: BaseSummary | undefined
  warheadsPerSilo: number | undefined
}

/** Single animated run: stat tiles, per-volley table, survivors chart, export. */
export function ResultsCard({ simulation, base, warheadsPerSilo }: ResultsCardProps) {
  const { sim, shown, prediction } = simulation
  const last = shown[shown.length - 1]

  if (!sim || !last) {
    return (
      <Card size="sm" className="items-center py-8 text-center text-muted-foreground">
        <ChartColumn className="size-5" aria-hidden />
        <p className="text-xs">Run a volley to see results</p>
      </Card>
    )
  }

  const total = sim.silos.length
  const wps = warheadsPerSilo ?? 1
  const chartData: SurvivorPoint[] = (prediction ?? []).map((p, v) => ({
    volley: v,
    prediction: p,
    simulated: v === 0 ? total : shown[v - 1]?.surviving,
    conditional: v === 0 ? total : shown[v - 1]?.expectedSurvivors,
  }))

  const exportInput = { sim, volleys: shown.length, base, warheadsPerSilo: wps, prediction }
  const stem = `${base?.id ?? 'run'}-seed${sim.params.seed}-v${shown.length}`

  return (
    <div className="grid gap-4">
      <p className="text-xs text-muted-foreground">
        After volley {last.volley} of {sim.params.volleys}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Destroyed" value={last.cumulativeDestroyed.toLocaleString()} />
        <Stat label="% destroyed" value={`${last.pctDestroyed.toFixed(1)}%`} />
        <Stat label="Surviving" value={last.surviving.toLocaleString()} />
        <Stat label="% surviving" value={`${last.pctSurviving.toFixed(1)}%`} />
      </div>
      <Card size="sm" className="gap-0.5 px-3">
        <p className="eyebrow-muted">Surviving warheads</p>
        <p className="text-lg font-bold tabular-nums">{(last.surviving * wps).toLocaleString()}</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {last.surviving} silos × {wps} warheads per silo
        </p>
      </Card>

      <div className="overflow-x-auto rounded-lg border">
        <Table className="text-xs tabular-nums">
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 px-2">Volley</TableHead>
              <TableHead className="h-8 px-2 text-right" title="Delivery (boost) failures">
                Del. fail
              </TableHead>
              <TableHead className="h-8 px-2 text-right" title="Warhead failures (duds)">
                Duds
              </TableHead>
              <TableHead className="h-8 px-2 text-right">Killed</TableHead>
              <TableHead className="h-8 px-2 text-right">Surv.</TableHead>
              <TableHead
                className="h-8 px-2 text-right"
                title="Analytic expected survivors for this volley's allocation"
              >
                x̄
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((v) => (
              <TableRow key={v.volley}>
                <TableCell className="px-2 py-1.5">{v.volley}</TableCell>
                <TableCell className="px-2 py-1.5 text-right">{v.deliveryFailures}</TableCell>
                <TableCell className="px-2 py-1.5 text-right">{v.warheadFailures}</TableCell>
                <TableCell className="px-2 py-1.5 text-right">{v.destroyedThisVolley}</TableCell>
                <TableCell className="px-2 py-1.5 text-right font-semibold">
                  {v.surviving}
                </TableCell>
                <TableCell className="px-2 py-1.5 text-right text-muted-foreground">
                  {v.expectedSurvivors.toFixed(1)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-1.5">
        <p className="text-xs font-semibold">Surviving silos</p>
        <SurvivorChart data={chartData} siloCount={total} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadFile(`${stem}.csv`, resultsToCsv(exportInput), 'text/csv')}
        >
          <FileDown data-icon="inline-start" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadFile(`${stem}.json`, resultsToJson(exportInput), 'application/json')
          }
        >
          <FileDown data-icon="inline-start" />
          Export JSON
        </Button>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm" className="gap-0.5 px-3">
      <p className="eyebrow-muted">{label}</p>
      <p className="text-lg font-bold tabular-nums">{value}</p>
    </Card>
  )
}
