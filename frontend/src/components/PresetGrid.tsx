import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { MissilePreset, NumericField } from '@/types'

type PresetValues = Partial<Record<NumericField, number>>

interface PresetGridProps {
  presets: MissilePreset[]
  /** Current parsed values; a field is undefined while its input is invalid. */
  values: PresetValues
  onSelect: (preset: MissilePreset) => void
}

const MATCH_FIELDS = ['cepM', 'lethalRadiusM', 'deliveryReliability', 'warheadReliability'] as const

/**
 * 2-column grid of selectable preset cards. Selection is derived from the current
 * values rather than stored, so hand-edited values that match a preset still
 * highlight it, and anything else highlights the trailing "Custom" card.
 */
export function PresetGrid({ presets, values, onSelect }: PresetGridProps) {
  const selectedId = presets.find((p) => MATCH_FIELDS.every((f) => p[f] === values[f]))?.id

  return (
    <div role="radiogroup" aria-label="Missile presets" className="grid grid-cols-2 gap-2">
      {presets.map((p) => (
        <Tooltip key={p.id}>
          <TooltipTrigger asChild>
            <PresetCard
              label={p.label}
              value={`CEP ${p.cepM} m · LR ${p.lethalRadiusM} m`}
              selected={p.id === selectedId}
              onClick={() => onSelect(p)}
            />
          </TooltipTrigger>
          <TooltipContent className="max-w-60">{p.source}</TooltipContent>
        </Tooltip>
      ))}
      <PresetCard label="Custom" value="Edit fields above" selected={selectedId === undefined} />
    </div>
  )
}

function PresetCard({
  label,
  value,
  selected,
  onClick,
  ...rest
}: {
  label: string
  value: string
  selected: boolean
  onClick?: () => void
} & React.ComponentProps<'button'>) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      // "Custom" reflects state; it isn't itself something you can pick.
      disabled={!onClick}
      onClick={onClick}
      className="group rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default"
      {...rest}
    >
      <Card
        size="sm"
        className={cn(
          'h-full gap-1 px-3 transition-colors group-enabled:group-hover:bg-accent',
          selected && 'selected-maroon group-enabled:group-hover:bg-maroon/12',
        )}
      >
        <span className="text-xs leading-tight font-semibold">{label}</span>
        <span className="text-xs text-current/75 tabular-nums">{value}</span>
      </Card>
    </button>
  )
}
