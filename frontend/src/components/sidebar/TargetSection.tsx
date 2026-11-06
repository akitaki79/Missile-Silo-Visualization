import { PanelSection } from '@/components/PanelSection'
import { LEFT_SECTIONS } from '@/components/sections'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BaseSummary } from '@/types'

interface TargetSectionProps {
  summaries: BaseSummary[] | null
  error: string | null
  baseId: string | null
  onChange: (id: string) => void
}

export function TargetSection({ summaries, error, baseId, onChange }: TargetSectionProps) {
  const selected = summaries?.find((b) => b.id === baseId)
  const empty = summaries?.length === 0

  return (
    <PanelSection section={LEFT_SECTIONS.target}>
      <Select value={baseId ?? ''} onValueChange={onChange} disabled={!summaries || empty}>
        <SelectTrigger className="w-full bg-card" aria-label="Target base">
          <SelectValue
            placeholder={
              error ? 'Failed to load bases' : !summaries ? 'Loading bases…' : 'No bases found'
            }
          />
        </SelectTrigger>
        <SelectContent position="popper">
          {summaries?.map((b) => (
            <SelectItem key={b.id} value={b.id}>
              {b.name}
              <span className="text-muted-foreground">· {b.country}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selected && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="tabular-nums">
            {selected.country} · {selected.siloCount.toLocaleString()} silos
          </span>
          {selected.dataStatus === 'placeholder' && (
            <Badge variant="outline" className="border-maroon/40 text-maroon">
              Placeholder data
            </Badge>
          )}
        </div>
      )}
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      {empty && (
        <p className="mt-2 text-xs text-muted-foreground">
          Add a JSON file to <code>data/bases/</code> to get started.
        </p>
      )}
    </PanelSection>
  )
}
