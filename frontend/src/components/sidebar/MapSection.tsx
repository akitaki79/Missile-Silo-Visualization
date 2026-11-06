import { PanelSection } from '@/components/PanelSection'
import { LEFT_SECTIONS } from '@/components/sections'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { BASEMAPS } from '@/config/defaults'
import type { SimulatorParamsApi } from '@/hooks/useSimulatorParams'
import type { BasemapId, MapOptions } from '@/types'

const CHECKBOXES: { key: Exclude<keyof MapOptions, 'basemap'>; label: string }[] = [
  { key: 'showLabels', label: 'Show silo labels' },
  { key: 'showRings', label: 'Show lethal radius rings' },
  { key: 'greyscale', label: 'Greyscale figure mode' },
]

export function MapSection({ sim }: { sim: SimulatorParamsApi }) {
  const { map } = sim.state
  const { setMap } = sim.actions

  return (
    <PanelSection section={LEFT_SECTIONS.map}>
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label className="text-xs font-medium">Basemap</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={map.basemap}
            // Radix emits "" when the active item is clicked again; keep one selected.
            onValueChange={(v) => v && setMap({ basemap: v as BasemapId })}
            className="w-full"
          >
            {(Object.keys(BASEMAPS) as BasemapId[]).map((id) => (
              <ToggleGroupItem
                key={id}
                value={id}
                className="flex-1 bg-card data-[state=on]:selected-maroon"
              >
                {BASEMAPS[id].label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
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
