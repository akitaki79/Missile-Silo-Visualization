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

export function AdvancedSection({ sim }: { sim: SimulatorParamsApi }) {
  const { state, errors, actions } = sim
  const [userOpen, setUserOpen] = useState(false)
  // Never hide an invalid field behind a collapsed section.
  const hasError = Boolean(errors.reliability ?? errors.seed)
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
          <div className="grid grid-cols-2 items-start gap-3">
            <UnitInput
              label="Warhead reliability"
              value={state.inputs.reliability}
              onChange={(v) => actions.setInput('reliability', v)}
              error={errors.reliability}
              hint="0–1; 1.0 = all function"
            />
            <UnitInput
              label="RNG seed"
              inputMode="numeric"
              value={state.inputs.seed}
              onChange={(v) => actions.setInput('seed', v)}
              error={errors.seed}
              hint="Same seed, same run"
            />
          </div>
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="attacker-knows-kills"
              checked={state.attackerKnowsKills}
              onCheckedChange={(c) => actions.setAttackerKnowsKills(c === true)}
              className="mt-0.5"
            />
            <div className="grid gap-1">
              <Label htmlFor="attacker-knows-kills" className="text-sm leading-snug font-normal">
                Attacker knows which silos were destroyed
              </Label>
              <p className="text-xs text-muted-foreground">
                Later volleys re-target only surviving silos.
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </PanelSection>
    </Collapsible>
  )
}
