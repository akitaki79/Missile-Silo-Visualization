import { useReducer } from 'react'
import { toast } from 'sonner'
import { AppShell } from '@/components/AppShell'
import { AssumptionsPanel } from '@/components/AssumptionsPanel'
import { MapView } from '@/components/map/MapView'
import { StatsStrip } from '@/components/map/StatsStrip'
import { LEFT_SECTIONS, RIGHT_SECTIONS } from '@/components/sections'
import { Sidebar } from '@/components/Sidebar'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useBase, useBaseList } from '@/hooks/useBases'
import { usePanelState } from '@/hooks/usePanelState'
import { useSimulatorParams } from '@/hooks/useSimulatorParams'

export default function App() {
  const baseList = useBaseList()
  const sim = useSimulatorParams(baseList.summaries?.[0]?.id ?? null)
  const { base } = useBase(sim.baseId)
  const panels = usePanelState()
  const [resizeSignal, bumpResize] = useReducer((n: number) => n + 1, 0)

  const summary = baseList.summaries?.find((b) => b.id === sim.baseId)
  const { cepM, lethalRadiusM, volleys } = sim.values

  // Phase 2: replace with the simulation engine.
  function handleRun() {
    if (!sim.params) return
    console.info('[sim] Run volley 1 with params:', sim.params)
    toast('Simulation coming in Phase 2', {
      description: 'Current parameters were logged to the console.',
    })
  }

  function handleReset() {
    sim.actions.resetParams()
    toast('Parameters reset to defaults')
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
              onRun={handleRun}
              onReset={handleReset}
            />
          ),
        }}
        right={{
          title: 'Model',
          sections: Object.values(RIGHT_SECTIONS),
          content: (
            <AssumptionsPanel
              sim={sim}
              base={summary}
              onCollapse={() => panels.setOpen('right', false)}
            />
          ),
        }}
      >
        <MapView
          base={base}
          lethalRadiusM={lethalRadiusM}
          options={sim.state.map}
          resizeSignal={resizeSignal}
        >
          <StatsStrip
            cells={[
              { label: 'Base', value: summary?.name ?? '—' },
              { label: 'Silos', value: summary?.siloCount.toLocaleString() ?? '—' },
              { label: 'CEP', value: cepM === undefined ? '—' : `${cepM} m` },
              {
                label: 'Lethal radius',
                value: lethalRadiusM === undefined ? '—' : `${lethalRadiusM} m`,
              },
              { label: 'Volley', value: `— / ${volleys ?? '—'}` },
            ]}
          />
        </MapView>
      </AppShell>
      {/* Light theme only for now; pinned so the OS dark mode doesn't restyle toasts. */}
      <Toaster theme="light" position="bottom-center" />
    </TooltipProvider>
  )
}
