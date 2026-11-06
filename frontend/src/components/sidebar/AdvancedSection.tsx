import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { PanelSection } from '@/components/PanelSection'
import { LEFT_SECTIONS } from '@/components/sections'
import { UnitInput } from '@/components/UnitInput'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import type { SimulatorParamsApi } from '@/hooks/useSimulatorParams'
import { cn } from '@/lib/utils'
import type { SimFlag } from '@/types'

const FLAGS: { flag: SimFlag; label: string; scope: string; hint: string }[] = [
  {
    flag: 'reprogram',
    label: 'Reprogram detected boost failures',
    scope: 'Within a volley',
    hint: 'Boost failures are replaced from reserves before allocation (Davis & Schilling). TKP becomes SSKP · R_wh.',
  },
  {
    flag: 'attackerKnowsKills',
    label: 'Attacker knows which silos were destroyed',
    scope: 'Between volleys',
    hint: 'Perfect damage assessment: later volleys target only surviving silos.',
  },
]

export function AdvancedSection({ sim }: { sim: SimulatorParamsApi }) {
  const { inputs, errors, state, actions } = sim
  const [userOpen, setUserOpen] = useState(false)
  // Never hide an invalid field behind a collapsed section.
  const hasError = Boolean(errors.seed ?? errors.warheadsPerSilo ?? errors.trials)
  const open = userOpen || hasError
  const Icon = LEFT_SECTIONS.advanced.icon

  return (
    <Collapsible open={open} onOpenChange={setUserOpen}>
      <PanelSection
        section={LEFT_SECTIONS.advanced}
        heading={
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="-mx-2 h-8 w-[calc(100%+1rem)] justify-start gap-2 px-2 text-sm font-semibold"
            >
              <Icon className="text-muted-foreground" aria-hidden />
              {LEFT_SECTIONS.advanced.title}
              <ChevronDown
                className={cn(
                  'ml-auto text-muted-foreground transition-transform',
                  open && 'rotate-180',
                )}
                aria-hidden
              />
            </Button>
          </CollapsibleTrigger>
        }
      >
        <CollapsibleContent className="grid gap-4 pt-4">
          {FLAGS.map(({ flag, label, scope, hint }) => (
            <div key={flag} className="flex items-start gap-2.5">
              <Checkbox
                id={`flag-${flag}`}
                checked={state.flags[flag]}
                onCheckedChange={(c) => actions.setFlag(flag, c === true)}
                className="mt-0.5"
              />
              <div className="grid gap-1">
                <p className="eyebrow-muted">{scope}</p>
                <Label htmlFor={`flag-${flag}`} className="text-sm leading-snug font-normal">
                  {label}
                </Label>
                <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
              </div>
            </div>
          ))}
          <div className="grid grid-cols-2 items-start gap-3">
            <UnitInput
              label="Warheads per silo"
              inputMode="numeric"
              value={inputs.warheadsPerSilo}
              onChange={(v) => actions.setInput('warheadsPerSilo', v)}
              error={errors.warheadsPerSilo}
              hint="Default from base data"
            />
            <UnitInput
              label="RNG seed"
              inputMode="numeric"
              value={inputs.seed}
              onChange={(v) => actions.setInput('seed', v)}
              error={errors.seed}
              hint="Same seed, same run"
            />
            <UnitInput
              label="Monte Carlo trials"
              inputMode="numeric"
              value={inputs.trials}
              onChange={(v) => actions.setInput('trials', v)}
              error={errors.trials}
              hint="For “Run N trials”"
            />
          </div>
        </CollapsibleContent>
      </PanelSection>
    </Collapsible>
  )
}
