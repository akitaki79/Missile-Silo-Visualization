import { Globe, Map as MapIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { PanelSection } from '@/components/PanelSection'
import { LEFT_SECTIONS } from '@/components/sections'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { BASEMAPS } from '@/config/defaults'
import type { SimulatorParamsApi } from '@/hooks/useSimulatorParams'
import type { BasemapId, MapOptions, ProjectionId } from '@/types'

const PROJECTIONS: { id: ProjectionId; label: string; icon: ReactNode }[] = [
  { id: 'mercator', label: 'Web Mercator', icon: <MapIcon aria-hidden /> },
  { id: 'globe', label: 'Globe', icon: <Globe aria-hidden /> },
]

const CHECKBOXES: { key: Exclude<keyof MapOptions, 'basemap' | 'projection'>; label: string }[] = [
  { key: 'showLabels', label: 'Show silo labels' },
  { key: 'showRings', label: 'Show lethal radius rings' },
  { key: 'showImpacts', label: 'Show impacts' },
  { key: 'greyscale', label: 'Greyscale figure mode' },
]

export function MapSection({ sim }: { sim: SimulatorParamsApi }) {
  const { map } = sim.state
  const { setMap } = sim.actions

  return (
    <PanelSection section={LEFT_SECTIONS.map}>
      <div className="grid gap-4">
        <SegmentedField
          label="Basemap"
          value={map.basemap}
          onChange={(v) => setMap({ basemap: v as BasemapId })}
          items={(Object.keys(BASEMAPS) as BasemapId[]).map((id) => ({
            id,
            label: BASEMAPS[id].label,
          }))}
        />
        <SegmentedField
          label="Projection"
          value={map.projection}
          onChange={(v) => setMap({ projection: v as ProjectionId })}
          items={PROJECTIONS}
        />
        <div className="grid gap-3">
          {CHECKBOXES.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2.5">
              <Checkbox
                id={`map-${key}`}
                checked={map[key]}
                onCheckedChange={(c) => setMap({ [key]: c === true })}
              />
              <Label htmlFor={`map-${key}`} className="text-sm font-normal">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </PanelSection>
  )
}

function SegmentedField({
  label,
  value,
  onChange,
  items,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  items: { id: string; label: string; icon?: ReactNode }[]
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <ToggleGroup
        type="single"
        variant="outline"
        spacing={0}
        value={value}
        // Radix emits "" when the active item is clicked again; keep one selected.
        onValueChange={(v) => v && onChange(v)}
        className="w-full"
      >
        {items.map((item) => (
          <ToggleGroupItem
            key={item.id}
            value={item.id}
            className="flex-1 bg-card data-[state=on]:selected-maroon"
          >
            {item.icon}
            {item.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
