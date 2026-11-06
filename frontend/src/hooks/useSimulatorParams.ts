import { useMemo, useReducer } from 'react'
import {
  DEFAULT_FLAGS,
  DEFAULT_INPUTS,
  DEFAULT_MAP_OPTIONS,
  DEFAULT_WARHEADS_PER_SILO,
  WARHEADS_PER_SILO_BY_COUNTRY,
} from '@/config/defaults'
import { validateInputs } from '@/lib/validation'
import type {
  BaseSummary,
  MapOptions,
  MissilePreset,
  NumericField,
  NumericInputs,
  SimFlag,
  SimulatorParams,
} from '@/types'

/**
 * All simulator + map-display state in one reducer. Components only see
 * `state`, derived values, and `actions`. `params` is null while any field is
 * invalid; `runKey` changes whenever a value that affects a run changes.
 */
interface State {
  /** null = "not chosen yet": fall back to the first available base. */
  baseId: string | null
  /** Every numeric field except warheadsPerSilo, which defaults per base. */
  inputs: Omit<NumericInputs, 'warheadsPerSilo'>
  /** User-typed warheads per silo; null = use the base's default. */
  warheadsOverride: string | null
  flags: Record<SimFlag, boolean>
  map: MapOptions
}

type Action =
  | { type: 'setBase'; baseId: string }
  | { type: 'setInput'; field: NumericField; value: string }
  | { type: 'applyPreset'; preset: MissilePreset }
  | { type: 'setFlag'; flag: SimFlag; value: boolean }
  | { type: 'setMap'; patch: Partial<MapOptions> }
  | { type: 'resetParams' }

const { warheadsPerSilo: _unused, ...initialInputs } = DEFAULT_INPUTS

const initialState: State = {
  baseId: null,
  inputs: initialInputs,
  warheadsOverride: null,
  flags: DEFAULT_FLAGS,
  map: DEFAULT_MAP_OPTIONS,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setBase':
      // A new base brings its own warheads-per-silo default.
      return { ...state, baseId: action.baseId, warheadsOverride: null }
    case 'setInput':
      if (action.field === 'warheadsPerSilo') return { ...state, warheadsOverride: action.value }
      return { ...state, inputs: { ...state.inputs, [action.field]: action.value } }
    case 'applyPreset': {
      const p = action.preset
      return {
        ...state,
        inputs: {
          ...state.inputs,
          cepM: String(p.cepM),
          lethalRadiusM: String(p.lethalRadiusM),
          deliveryReliability: String(p.deliveryReliability),
          warheadReliability: String(p.warheadReliability),
        },
      }
    }
    case 'setFlag':
      return { ...state, flags: { ...state.flags, [action.flag]: action.value } }
    case 'setMap':
      return { ...state, map: { ...state.map, ...action.patch } }
    case 'resetParams':
      // Keeps the selected base and map display options.
      return { ...state, inputs: initialInputs, warheadsOverride: null, flags: DEFAULT_FLAGS }
  }
}

export function defaultWarheadsPerSilo(base: BaseSummary | undefined): number {
  return (
    base?.warheadsPerSilo ??
    (base && WARHEADS_PER_SILO_BY_COUNTRY[base.country]) ??
    DEFAULT_WARHEADS_PER_SILO
  )
}

export function useSimulatorParams(summaries: BaseSummary[] | null) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const baseId = state.baseId ?? summaries?.[0]?.id ?? null
  const summary = summaries?.find((b) => b.id === baseId)

  const inputs = useMemo<NumericInputs>(
    () => ({
      ...state.inputs,
      warheadsPerSilo: state.warheadsOverride ?? String(defaultWarheadsPerSilo(summary)),
    }),
    [state.inputs, state.warheadsOverride, summary],
  )

  const { values, errors } = useMemo(() => validateInputs(inputs), [inputs])

  const params = useMemo<SimulatorParams | null>(() => {
    if (!baseId || Object.keys(errors).length > 0) return null
    const v = values as Record<NumericField, number>
    return { baseId, ...v, ...state.flags }
  }, [baseId, values, errors, state.flags])

  // Identity of a run: changes to any of these make an in-progress run stale.
  const runKey = useMemo(() => {
    if (!params) return null
    const { warheadsPerSilo: _w, trials: _t, ...run } = params
    return JSON.stringify(run)
  }, [params])

  const actions = useMemo(
    () => ({
      setBase: (id: string) => dispatch({ type: 'setBase', baseId: id }),
      setInput: (field: NumericField, value: string) =>
        dispatch({ type: 'setInput', field, value }),
      applyPreset: (preset: MissilePreset) => dispatch({ type: 'applyPreset', preset }),
      setFlag: (flag: SimFlag, value: boolean) => dispatch({ type: 'setFlag', flag, value }),
      setMap: (patch: Partial<MapOptions>) => dispatch({ type: 'setMap', patch }),
      resetParams: () => dispatch({ type: 'resetParams' }),
    }),
    [],
  )

  return { state, baseId, summary, inputs, values, errors, params, runKey, actions }
}

export type SimulatorParamsApi = ReturnType<typeof useSimulatorParams>
