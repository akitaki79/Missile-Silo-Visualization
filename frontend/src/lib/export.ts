import { REFERENCES } from '@/sim/references'
import type { SimState } from '@/sim/types'
import type { BaseSummary } from '@/types'

interface ExportInput {
  sim: SimState
  /** Volleys whose results have been revealed. */
  volleys: number
  base: BaseSummary | undefined
  warheadsPerSilo: number
  prediction: number[] | null
}

/** Per-volley results table. */
export function resultsToCsv({ sim, volleys, warheadsPerSilo, prediction }: ExportInput): string {
  const header = [
    'volley',
    'warheads_allocated',
    'delivery_failures',
    'warhead_failures',
    'detonations',
    'destroyed_this_volley',
    'cumulative_destroyed',
    'surviving_silos',
    'pct_surviving',
    'surviving_warheads',
    'expected_survivors_conditional',
    'reductionist_prediction',
  ]
  const rows = sim.volleys
    .slice(0, volleys)
    .map((v) => [
      v.volley,
      v.warheadsAllocated,
      v.deliveryFailures,
      v.warheadFailures,
      v.detonations,
      v.destroyedThisVolley,
      v.cumulativeDestroyed,
      v.surviving,
      v.pctSurviving.toFixed(2),
      v.surviving * warheadsPerSilo,
      v.expectedSurvivors.toFixed(3),
      prediction?.[v.volley]?.toFixed(3) ?? '',
    ])
  return [header, ...rows].map((r) => r.join(',')).join('\n') + '\n'
}

/** Everything needed to reproduce and audit the run. */
export function resultsToJson({
  sim,
  volleys,
  base,
  warheadsPerSilo,
  prediction,
}: ExportInput): string {
  const shown = sim.volleys.slice(0, volleys)
  const destroyedIn = sim.silos.map(() => null as number | null)
  for (const v of shown)
    v.aliveAfter.forEach((alive, i) => {
      if (!alive && destroyedIn[i] === null) destroyedIn[i] = v.volley
    })

  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      references: Object.values(REFERENCES).map((r) => r.full),
      disclaimer:
        'Illustrates uncertainty under stated assumptions; does not predict real outcomes.',
      base: base && {
        id: base.id,
        name: base.name,
        country: base.country,
        dataStatus: base.dataStatus,
        source: base.source,
      },
      params: sim.params,
      warheadsPerSilo,
      reductionistPrediction: prediction,
      volleys: shown.map(({ allocation, impacts, aliveAfter: _alive, ...stats }) => ({
        ...stats,
        survivingWarheads: stats.surviving * warheadsPerSilo,
        allocation: Object.fromEntries(
          [...allocation].map(([i, n]) => [sim.silos[i]?.id ?? String(i), n]),
        ),
        impacts: impacts?.map((m) => ({
          aimedAt: sim.silos[m.aimIndex]?.id,
          lat: m.lat,
          lon: m.lon,
          dud: m.dud,
          destroyed: m.killed.map((k) => sim.silos[k]?.id),
        })),
      })),
      silos: sim.silos.map((s, i) => ({
        id: s.id,
        lat: s.lat,
        lon: s.lon,
        destroyedInVolley: destroyedIn[i],
      })),
    },
    null,
    2,
  )
}

export function downloadFile(filename: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
