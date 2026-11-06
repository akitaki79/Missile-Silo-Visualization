import {
  ChartColumn,
  Crosshair,
  Database,
  Layers,
  ListChecks,
  Map as MapIcon,
  Rocket,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react'

/**
 * Panel sections. Shared by the expanded panels (titles + icons) and the
 * collapsed rails (icon buttons that jump to a section).
 */
export interface SectionDef {
  id: string
  title: string
  icon: LucideIcon
}

export const LEFT_SECTIONS = {
  target: { id: 'section-target', title: 'Target', icon: Crosshair },
  missile: { id: 'section-missile', title: 'Missile', icon: Rocket },
  attack: { id: 'section-attack', title: 'Attack', icon: Layers },
  advanced: { id: 'section-advanced', title: 'Advanced', icon: SlidersHorizontal },
  map: { id: 'section-map', title: 'Map', icon: MapIcon },
} satisfies Record<string, SectionDef>

export const RIGHT_SECTIONS = {
  assumptions: { id: 'section-assumptions', title: 'Assumptions', icon: ListChecks },
  sources: { id: 'section-sources', title: 'Data sources', icon: Database },
  results: { id: 'section-results', title: 'Results', icon: ChartColumn },
} satisfies Record<string, SectionDef>
