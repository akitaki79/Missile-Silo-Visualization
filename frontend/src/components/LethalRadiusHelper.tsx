import { Calculator } from 'lucide-react'
import { useState } from 'react'
import { UnitInput } from '@/components/UnitInput'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { LR_HELPER_DEFAULTS } from '@/config/defaults'
import { lethalRadiusM } from '@/sim/lethalRadius'

/** "Compute from yield & hardness" (Davis & Schilling 1973). LR stays a direct input. */
export function LethalRadiusHelper({ onUse }: { onUse: (lrM: number) => void }) {
  const [open, setOpen] = useState(false)
  const [yieldKt, setYieldKt] = useState(LR_HELPER_DEFAULTS.yieldKt)
  const [hardness, setHardness] = useState(LR_HELPER_DEFAULTS.hardnessPsi)

  const y = Number(yieldKt)
  const h = Number(hardness)
  const yieldError = y > 0 && Number.isFinite(y) ? undefined : 'Enter a positive yield'
  const hardnessError = h > 0 && Number.isFinite(h) ? undefined : 'Enter a positive hardness'
  const lr = yieldError || hardnessError ? null : Math.round(lethalRadiusM(y, h))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="link" size="xs" className="h-auto px-0 text-xs">
          <Calculator data-icon="inline-start" />
          From yield &amp; hardness
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="grid w-80 gap-3">
        <div>
          <p className="eyebrow">Davis &amp; Schilling (1973)</p>
          <p className="mt-1 text-sm font-semibold">Lethal radius from yield &amp; hardness</p>
        </div>
        <div className="grid grid-cols-2 items-start gap-3">
          <UnitInput
            label="Yield"
            unit="kt"
            value={yieldKt}
            onChange={setYieldKt}
            error={yieldError}
          />
          <UnitInput
            label="Hardness"
            unit="psi"
            value={hardness}
            onChange={setHardness}
            error={hardnessError}
          />
        </div>
        <p className="rounded-md bg-muted/70 p-2 font-mono text-[0.6875rem] leading-relaxed">
          LR = 2.45·Y^⅓ / H^⅓ · (√(1 + 2.79/H + 1.67/√H))^⅔ nm
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Gives ≈169 m for 100 kt at 2,000 psi, while Lawrence (2026) uses 179 m. Sources give
          different lethal radii, so the direct input remains the default.
        </p>
        <Button
          disabled={lr === null}
          onClick={() => {
            if (lr === null) return
            onUse(lr)
            setOpen(false)
          }}
        >
          {lr === null ? 'Use this value' : `Use ${lr} m`}
        </Button>
      </PopoverContent>
    </Popover>
  )
}
