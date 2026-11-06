import { Card } from '@/components/ui/card'

export interface StatCell {
  label: string
  value: string
}

/** Floating summary over the top-centre of the map. */
export function StatsStrip({ cells }: { cells: StatCell[] }) {
  return (
    <Card
      size="sm"
      className="absolute top-3 left-1/2 z-10 max-w-[calc(100%-7.5rem)] -translate-x-1/2 p-0 shadow-lg shadow-foreground/5"
    >
      <dl className="flex divide-x overflow-x-auto">
        {cells.map(({ label, value }) => (
          <div key={label} className="grid shrink-0 gap-0.5 px-4 py-2.5">
            <dt className="eyebrow-muted whitespace-nowrap">{label}</dt>
            <dd className="text-sm font-semibold whitespace-nowrap tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
