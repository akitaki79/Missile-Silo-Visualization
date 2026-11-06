import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { MissilePreset } from '@/types'

interface PresetGridProps {
  presets: MissilePreset[]
  /** Current parsed values; undefined while the field is invalid. */
  cepM?: number
  lethalRadiusM?: number
  onSelect: (preset: MissilePreset) => void
}

/**
 * 2-column grid of selectable preset cards. Selection is derived from the
 * current values rather than stored, so hand-edited values that match a preset
 * still highlight it, and anything else highlights the trailing "Custom" card.
 */
export function PresetGrid({ presets, cepM, lethalRadiusM, onSelect }: PresetGridProps) {
  const selectedId = presets.find((p) => p.cepM === cepM && p.lethalRadiusM === lethalRadiusM)?.id

  return (
    <div role="radiogroup" aria-label="Missile presets" className="grid grid-cols-2 gap-2">
      {presets.map((p) => (
        <PresetCard
          key={p.id}
          label={p.label}
          value={`${p.cepM} m / ${p.lethalRadiusM} m`}
          selected={p.id === selectedId}
          onClick={() => onSelect(p)}
        />
      ))}
      <PresetCard
        label="Custom"
        value={
          selectedId === undefined && cepM && lethalRadiusM
            ? `${cepM} m / ${lethalRadiusM} m`
            : 'Edit fields above'
        }
        selected={selectedId === undefined}
      />
    </div>
  )
}

function PresetCard({
  label,
  value,
  selected,
  onClick,
}: {
  label: string
  value: string
  selected: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      // "Custom" reflects state; it isn't itself something you can pick.
      disabled={!onClick}
      onClick={onClick}
      className="group rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default"
    >
      <Card
        size="sm"
        className={cn(
          'h-full gap-1 px-3 transition-colors group-enabled:group-hover:bg-accent',
          selected && 'selected-maroon group-enabled:group-hover:bg-maroon/12',
        )}
      >
        <span className="text-xs leading-tight font-medium">{label}</span>
        <span className="text-sm font-semibold tabular-nums">{value}</span>
      </Card>
    </button>
  )
}
