import { useCallback, useEffect, useMemo, useState } from 'react'
import { IMPACT_ANIMATION_MS } from '@/config/defaults'
import { reductionistPrediction } from '@/sim/analytic'
import { initSim, isComplete, runVolley } from '@/sim/engine'
import type { SimState, VolleyResult } from '@/sim/types'
import type { Base, SimulatorParams } from '@/types'

export type SimPhase = 'idle' | 'animating' | 'ready' | 'done'
export type SiloDisplayState = 'intact' | 'destroyed' | 'untargeted'

/** What the map draws for one arrived RV. */
export interface DisplayImpact {
  key: string
  volley: number
  lat: number
  lon: number
  dud: boolean
  aimId: string
  aimLat: number
  aimLon: number
  killedIds: string[]
}

interface RunState {
  sim: SimState
  /** runKey of the parameters the run started with. */
  key: string
  /** Volleys whose results are shown (the next one may still be animating). */
  revealed: number
}

/**
 * The single-run, volley-by-volley flow. React-free sim modules do the work;
 * this hook sequences them and derives what the UI shows.
 */
export function useSimulation(
  base: Base | null,
  params: SimulatorParams | null,
  runKey: string | null,
) {
  const [run, setRun] = useState<RunState | null>(null)
  const [progress, setProgress] = useState(1)

  const sim = run?.sim ?? null
  const fired = sim?.volleys.length ?? 0
  const revealed = run?.revealed ?? 0
  const phase: SimPhase = !sim
    ? 'idle'
    : revealed < fired
      ? 'animating'
      : isComplete(sim)
        ? 'done'
        : 'ready'
  // Any change to a run-affecting parameter (or the base) makes the run stale.
  const stale = run !== null && run.key !== runKey

  // Impact animation: advance `progress` 0 → 1, then reveal the volley's results.
  useEffect(() => {
    if (phase !== 'animating') return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const duration = reduceMotion ? 0 : IMPACT_ANIMATION_MS
    let frame = 0
    let done = false
    const start = performance.now()
    const finish = () => {
      if (done) return
      done = true
      cancelAnimationFrame(frame)
      setProgress(1)
      setRun((r) => (r ? { ...r, revealed: r.sim.volleys.length } : r))
    }
    const tick = (now: number) => {
      const p = duration ? Math.min(1, (now - start) / duration) : 1
      if (p < 1) {
        setProgress(p)
        frame = requestAnimationFrame(tick)
      } else finish()
    }
    frame = requestAnimationFrame(tick)
    // Background tabs pause requestAnimationFrame; a timer still fires, so results always land.
    const fallback = window.setTimeout(finish, duration + 100)
    return () => {
      done = true
      cancelAnimationFrame(frame)
      window.clearTimeout(fallback)
    }
  }, [phase])

  const fire = useCallback(() => {
    if (!base || !params || !runKey || stale || phase === 'animating' || phase === 'done') return
    setProgress(0)
    setRun((r) => {
      const current = r ?? { sim: initSim(base.silos, params), key: runKey, revealed: 0 }
      return { ...current, sim: runVolley(current.sim) }
    })
  }, [base, params, runKey, stale, phase])

  const reset = useCallback(() => {
    setRun(null)
    setProgress(1)
  }, [])

  const shown: VolleyResult[] = useMemo(
    () => sim?.volleys.slice(0, revealed) ?? [],
    [sim, revealed],
  )
  const animatingVolley = phase === 'animating' ? (sim?.volleys[revealed] ?? null) : null

  /** Silo colours: state after the last revealed volley; gray = not targeted by the latest volley. */
  const siloStates = useMemo<SiloDisplayState[] | null>(() => {
    if (!sim) return null
    const last = shown[shown.length - 1]
    const current = animatingVolley ?? last
    return sim.silos.map((_, i) => {
      if (last && !last.aliveAfter[i]) return 'destroyed'
      if (current && !current.allocation.has(i)) return 'untargeted'
      return 'intact'
    })
  }, [sim, shown, animatingVolley])

  const impacts = useMemo<DisplayImpact[]>(() => {
    if (!sim) return []
    const out: DisplayImpact[] = []
    const add = (v: VolleyResult, limit: number) => {
      v.impacts?.slice(0, limit).forEach((imp, j) => {
        const aim = sim.silos[imp.aimIndex]
        if (!aim) return
        out.push({
          key: `${v.volley}-${j}`,
          volley: v.volley,
          lat: imp.lat,
          lon: imp.lon,
          dud: imp.dud,
          aimId: aim.id,
          aimLat: aim.lat,
          aimLon: aim.lon,
          killedIds: imp.killed.map((k) => sim.silos[k]?.id ?? '?'),
        })
      })
    }
    shown.forEach((v) => add(v, Infinity))
    if (animatingVolley?.impacts) {
      add(animatingVolley, Math.ceil(progress * animatingVolley.impacts.length))
    }
    return out
  }, [sim, shown, animatingVolley, progress])

  /** Lawrence's up-front reductionist prediction for the parameters the run used. */
  const prediction = useMemo(
    () => (sim ? reductionistPrediction(sim.params, sim.silos.length) : null),
    [sim],
  )

  return {
    phase,
    stale,
    totalVolleys: sim?.params.volleys ?? params?.volleys ?? 0,
    nextVolley: fired + 1,
    sim,
    shown,
    siloStates,
    impacts,
    prediction,
    fire,
    reset,
  }
}

export type SimulationApi = ReturnType<typeof useSimulation>
