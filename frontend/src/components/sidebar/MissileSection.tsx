import { LethalRadiusHelper } from '@/components/LethalRadiusHelper'
import { PanelSection } from '@/components/PanelSection'
import { PresetGrid } from '@/components/PresetGrid'
import { LEFT_SECTIONS } from '@/components/sections'
import { UnitInput } from '@/components/UnitInput'
import { MISSILE_PRESETS } from '@/config/defaults'
import type { SimulatorParamsApi } from '@/hooks/useSimulatorParams'
import { overallReliability } from '@/sim/analytic'

export function MissileSection({ sim }: { sim: SimulatorParamsApi }) {
  const { inputs, values, errors, actions } = sim
  const { deliveryReliability: rDel, warheadReliability: rWh } = values

  return (
    <PanelSection section={LEFT_SECTIONS.missile}>
      <div className="grid gap-4">
        <UnitInput
          label="CEP"
          unit="m"
          value={inputs.cepM}
          onChange={(v) => actions.setInput('cepM', v)}
          error={errors.cepM}
          hint="Radius containing 50% of impacts"
        />
        <div className="grid gap-1">
          <UnitInput
            label="Lethal radius vs. hardened silos"
            unit="m"
            value={inputs.lethalRadiusM}
            onChange={(v) => actions.setInput('lethalRadiusM', v)}
            error={errors.lethalRadiusM}
          />
          <div>
            <LethalRadiusHelper onUse={(lr) => actions.setInput('lethalRadiusM', String(lr))} />
          </div>
        </div>
        <div className="grid grid-cols-2 items-start gap-3">
          <UnitInput
            label="Delivery reliability"
            value={inputs.deliveryReliability}
            onChange={(v) => actions.setInput('deliveryReliability', v)}
            error={errors.deliveryReliability}
            hint="R_del · boost phase"
          />
          <UnitInput
            label="Warhead reliability"
            value={inputs.warheadReliability}
            onChange={(v) => actions.setInput('warheadReliability', v)}
            error={errors.warheadReliability}
            hint="R_wh · detonation"
          />
        </div>
        <p className="-mt-1 text-xs text-muted-foreground tabular-nums">
          Overall reliability (OAR = R_del · R_wh):{' '}
          <span className="font-semibold text-foreground">
            {rDel !== undefined && rWh !== undefined
              ? overallReliability(rDel, rWh).toFixed(4)
              : '—'}
          </span>
        </p>
        <div className="grid gap-2">
          <p className="eyebrow-muted">Presets · Lawrence (2026)</p>
          <PresetGrid presets={MISSILE_PRESETS} values={values} onSelect={actions.applyPreset} />
        </div>
      </div>
    </PanelSection>
  )
}
