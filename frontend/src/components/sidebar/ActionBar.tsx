import { Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ActionBarProps {
  canRun: boolean
  onRun: () => void
  onReset: () => void
}

export function ActionBar({ canRun, onRun, onReset }: ActionBarProps) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-2 border-t bg-background px-5 py-4">
      <Button size="lg" onClick={onRun} disabled={!canRun}>
        <Play data-icon="inline-start" />
        Run volley 1
      </Button>
      <Button size="lg" variant="outline" onClick={onReset}>
        <RotateCcw data-icon="inline-start" />
        Reset
      </Button>
    </div>
  )
}
