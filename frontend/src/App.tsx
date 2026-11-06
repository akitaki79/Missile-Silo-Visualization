import { lazy, Suspense, useReducer } from 'react'
import { AppShell } from '@/components/AppShell'
import { AssumptionsPanel } from '@/components/AssumptionsPanel'
import { StatsStrip } from '@/components/map/StatsStrip'
import { MethodologyDialog } from '@/components/MethodologyDialog'
import { LEFT_SECTIONS, RIGHT_SECTIONS } from '@/components/sections'
import { Sidebar } from '@/components/Sidebar'
import { ActionBar } from '@/components/sidebar/ActionBar'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useBase, useBaseList } from '@/hooks/useBases'
import { useBatch } from '@/hooks/useBatch'
import { usePanelState } from '@/hooks/usePanelState'
import { useSimulation } from '@/hooks/useSimulation'
import { useSimulatorParams } from '@/hooks/useSimulatorParams'

// MapLibre is most of the bundle; load it in its own chunk so the controls render first.
const MapView = lazy(() => import('@/components/map/MapView').then((m) => ({ default: m.MapView })))

export default function App() {
  const baseList = useBaseList()
  const sim = useSimulatorParams(baseList.summaries)
  const { base } = useBase(sim.baseId)
  const simulation = useSimulation(base, sim.params, sim.runKey)
  const batch = useBatch(sim.runKey)
  const panels = usePanelState()
  const [resizeSignal, bumpResize] = useReducer((n: number) => n + 1, 0)

  const { summary } = sim
  const { cepM, lethalRadiusM, volleys, warheadsPerSilo } = sim.values
  const canRun = sim.params !== null && base !== null
  const last = simulation.shown[simulation.shown.length - 1]
  const surviving = last?.surviving ?? summary?.siloCount

  function handleRunTrials() {
    if (base && sim.params && sim.runKey) batch.run(base, sim.params, sim.runKey)
  }

  return (
    <TooltipProvider delayDuration={300}>
      <AppShell
        panels={panels}
        onLayoutChange={bumpResize}
        left={{
          title: 'Controls',
          sections: Object.values(LEFT_SECTIONS),
          content: (
            <Sidebar
              sim={sim}
              summaries={baseList.summaries}
              summariesError={baseList.error}
              onCollapse={() => panels.setOpen('left', false)}
              headerActions={<MethodologyDialog />}
              footer={
                <ActionBar
                  simulation={simulation}
                  batch={batch}
                  canRun={canRun}
                  trials={sim.values.trials}
                  onFire={simulation.fire}
                  onReset={simulation.reset}
                  onRunTrials={handleRunTrials}
                />
              }
            />
          ),
        }}
        right={{
          title: 'Model',
          sections: Object.values(RIGHT_SECTIONS),
          content: (
            <AssumptionsPanel
              sim={sim}
              simulation={simulation}
              batch={batch}
              onCollapse={() => panels.setOpen('right', false)}
            />
          ),
        }}
      >
        <Suspense
          fallback={
            <div className="grid size-full place-items-center bg-muted text-sm text-muted-foreground">
              Loading map…
            </div>
          }
        >
          <MapView
            base={base}
            lethalRadiusM={lethalRadiusM}
            options={sim.state.map}
            siloStates={simulation.siloStates}
            impacts={simulation.impacts}
            runLethalRadiusM={simulation.sim?.params.lethalRadiusM}
            volleysShown={simulation.impacts.reduce((m, i) => Math.max(m, i.volley), 0)}
            resizeSignal={resizeSignal}
          >
            <StatsStrip
              cells={[
                { label: 'Base', value: summary?.name ?? '—' },
                { label: 'CEP', value: cepM === undefined ? '—' : `${cepM} m` },
                {
                  label: 'Lethal radius',
                  value: lethalRadiusM === undefined ? '—' : `${lethalRadiusM} m`,
                },
                {
                  label: 'Volley',
                  value: `${last?.volley ?? '—'} / ${simulation.sim?.params.volleys ?? volleys ?? '—'}`,
                },
                {
                  label: 'Surviving',
                  value:
                    surviving === undefined
                      ? '—'
                      : `${surviving.toLocaleString()} / ${summary?.siloCount.toLocaleString()}`,
                },
                {
                  label: 'Warheads',
                  value:
                    surviving === undefined || warheadsPerSilo === undefined
                      ? '—'
                      : (surviving * warheadsPerSilo).toLocaleString(),
                },
              ]}
            />
          </MapView>
        </Suspense>
      </AppShell>
      {/* Light theme only for now; pinned so the OS dark mode doesn't restyle toasts. */}
      <Toaster theme="light" position="bottom-center" />
    </TooltipProvider>
  )
}
