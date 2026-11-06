import { PanelSection } from '@/components/PanelSection'
import { PresetGrid } from '@/components/PresetGrid'
import { LEFT_SECTIONS } from '@/components/sections'
import { UnitInput } from '@/components/UnitInput'
import { MISSILE_PRESETS } from '@/config/defaults'
import type { SimulatorParamsApi } from '@/hooks/useSimulatorParams'

export function MissileSection({ sim }: { sim: SimulatorParamsApi }) {
  const { state, values, errors, actions } = sim
  return (
    <PanelSection section={LEFT_SECTIONS.missile}>
      <div className="grid gap-4">
        <UnitInput
          label="CEP"
          unit="m"
          value={state.inputs.cepM}
          onChange={(v) => actions.setInput('cepM', v)}
          error={errors.cepM}
          hint="Radius containing 50% of impacts"
        />
        <UnitInput
          label="Lethal radius vs. hardened silos"
          unit="m"
          value={state.inputs.lethalRadiusM}
          onChange={(v) => actions.setInput('lethalRadiusM', v)}
          error={errors.lethalRadiusM}
        />
        <div className="grid gap-2">
          <p className="eyebrow-muted">Presets · illustrative only</p>
          <PresetGrid
            presets={MISSILE_PRESETS}
            cepM={values.cepM}
            lethalRadiusM={values.lethalRadiusM}
            onSelect={actions.applyPreset}
          />
        </div>
      </div>
    </PanelSection>
  )
}
