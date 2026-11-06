import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

export type Side = 'left' | 'right'
type OpenState = Record<Side, boolean>

/** At or above this width the panels sit beside the map; below it they become Sheets. */
const DESKTOP_QUERY = '(min-width: 1024px)'
const STORAGE_KEY = 'cfs.panels'
const SHORTCUTS: Record<string, Side> = { '[': 'left', ']': 'right' }

/**
 * Open/closed state for the two side panels. UI-only state, kept apart from
 * simulator params. Desktop state persists in localStorage; on small screens
 * both panels start closed and are not persisted.
 */
export function usePanelState() {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)
  const [desktop, setDesktop] = useState<OpenState>(readStored)
  const [mobile, setMobile] = useState<OpenState>({ left: false, right: false })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(desktop))
    } catch {
      // Storage unavailable (private mode, blocked cookies): just don't persist.
    }
  }, [desktop])

  const setOpen = useCallback(
    (side: Side, open: boolean) => {
      const set = isDesktop ? setDesktop : setMobile
      set((s) => ({ ...s, [side]: open }))
    },
    [isDesktop],
  )

  const toggle = useCallback(
    (side: Side) => {
      const set = isDesktop ? setDesktop : setMobile
      set((s) => ({ ...s, [side]: !s[side] }))
    },
    [isDesktop],
  )

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const side = SHORTCUTS[e.key]
      if (!side || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return
      if (isEditable(e.target)) return
      e.preventDefault()
      toggle(side)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggle])

  const open = isDesktop ? desktop : mobile
  return { isDesktop, left: open.left, right: open.right, setOpen, toggle }
}

export type PanelState = ReturnType<typeof usePanelState>

function readStored(): OpenState {
  const fallback = { left: true, right: true }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return fallback
    const { left, right } = parsed as Partial<OpenState>
    return {
      left: typeof left === 'boolean' ? left : true,
      right: typeof right === 'boolean' ? right : true,
    }
  } catch {
    return fallback
  }
}

/** Typing "[" into a field (or a Select's type-ahead) must not toggle panels. */
function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return true
  return target.closest('[role="combobox"], [role="listbox"]') !== null
}

function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}
