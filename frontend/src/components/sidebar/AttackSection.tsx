import { PanelSection } from '@/components/PanelSection'
import { LEFT_SECTIONS } from '@/components/sections'
import { UnitInput } from '@/components/UnitInput'
import type { SimulatorParamsApi } from '@/hooks/useSimulatorParams'

export function AttackSection({ sim }: { sim: SimulatorParamsApi }) {
  const { state, errors, actions } = sim
  return (
    <PanelSection section={LEFT_SECTIONS.attack}>
      <div className="grid grid-cols-2 items-start gap-3">
        <UnitInput
          label="Missiles per volley"
          inputMode="numeric"
          value={state.inputs.missilesPerVolley}
          onChange={(v) => actions.setInput('missilesPerVolley', v)}
          error={errors.missilesPerVolley}
        />
        <UnitInput
          label="Number of volleys"
          inputMode="numeric"
          value={state.inputs.volleys}
          onChange={(v) => actions.setInput('volleys', v)}
          error={errors.volleys}
        />
      </div>
    </PanelSection>
  )
}
