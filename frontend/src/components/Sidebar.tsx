import { PanelLeftClose } from 'lucide-react'
import { PanelHeader } from '@/components/PanelHeader'
import { AdvancedSection } from '@/components/sidebar/AdvancedSection'
import { AttackSection } from '@/components/sidebar/AttackSection'
import { MapSection } from '@/components/sidebar/MapSection'
import { MissileSection } from '@/components/sidebar/MissileSection'
import { TargetSection } from '@/components/sidebar/TargetSection'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import type { SimulatorParamsApi } from '@/hooks/useSimulatorParams'
import type { ReactNode } from 'react'
import type { BaseSummary } from '@/types'

interface SidebarProps {
  sim: SimulatorParamsApi
  summaries: BaseSummary[] | null
  summariesError: string | null
  onCollapse: () => void
  /** Pinned below the scroll area: the run controls. */
  footer: ReactNode
  /** Extra header buttons (e.g. methodology). */
  headerActions?: ReactNode
}

export function Sidebar({
  sim,
  summaries,
  summariesError,
  onCollapse,
  footer,
  headerActions,
}: SidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <PanelHeader
        eyebrow="Research tool"
        title="Counterforce Strike Simulator"
        size="lg"
        collapseIcon={PanelLeftClose}
        collapseLabel="Collapse controls"
        shortcut="["
        onCollapse={onCollapse}
        actions={headerActions}
      />
      <ScrollArea className="min-h-0 flex-1">
        <TargetSection
          summaries={summaries}
          error={summariesError}
          baseId={sim.baseId}
          onChange={sim.actions.setBase}
        />
        <Separator />
        <MissileSection sim={sim} />
        <Separator />
        <AttackSection sim={sim} />
        <Separator />
        <AdvancedSection sim={sim} />
        <Separator />
        <MapSection sim={sim} />
      </ScrollArea>
      {footer}
    </div>
  )
}
