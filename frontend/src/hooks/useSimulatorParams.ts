import { useMemo, useReducer } from 'react'
import {
  DEFAULT_ATTACKER_KNOWS_KILLS,
  DEFAULT_INPUTS,
  DEFAULT_MAP_OPTIONS,
} from '@/config/defaults'
import { validateInputs } from '@/lib/validation'
import type {
  MapOptions,
  MissilePreset,
  NumericField,
  NumericInputs,
  SimulatorParams,
} from '@/types'

/**
 * All simulator + map-display state in one reducer. Components only see
 * `state`, derived values, and `actions`. Phase 2 reads `params` (null while
 * any field is invalid) and plugs an engine in alongside, without touching UI code.
 */
interface State {
  /** null = "not chosen yet": fall back to the first available base. */
  baseId: string | null
  inputs: NumericInputs
  attackerKnowsKills: boolean
  map: MapOptions
}

type Action =
  | { type: 'setBase'; baseId: string }
  | { type: 'setInput'; field: NumericField; value: string }
  | { type: 'applyPreset'; preset: MissilePreset }
  | { type: 'setAttackerKnowsKills'; value: boolean }
  | { type: 'setMap'; patch: Partial<MapOptions> }
  | { type: 'resetParams' }

const initialState: State = {
  baseId: null,
  inputs: DEFAULT_INPUTS,
  attackerKnowsKills: DEFAULT_ATTACKER_KNOWS_KILLS,
  map: DEFAULT_MAP_OPTIONS,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'setBase':
      return { ...state, baseId: action.baseId }
    case 'setInput':
      return { ...state, inputs: { ...state.inputs, [action.field]: action.value } }
    case 'applyPreset':
      return {
        ...state,
        inputs: {
          ...state.inputs,
          cepM: String(action.preset.cepM),
          lethalRadiusM: String(action.preset.lethalRadiusM),
        },
      }
    case 'setAttackerKnowsKills':
      return { ...state, attackerKnowsKills: action.value }
    case 'setMap':
      return { ...state, map: { ...state.map, ...action.patch } }
    case 'resetParams':
      // Keeps the selected base and map display options.
      return { ...state, inputs: DEFAULT_INPUTS, attackerKnowsKills: DEFAULT_ATTACKER_KNOWS_KILLS }
  }
}

export function useSimulatorParams(fallbackBaseId: string | null) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const baseId = state.baseId ?? fallbackBaseId

  const { values, errors } = useMemo(() => validateInputs(state.inputs), [state.inputs])

  const params = useMemo<SimulatorParams | null>(() => {
    if (!baseId || Object.keys(errors).length > 0) return null
    const v = values as Record<NumericField, number>
    return { baseId, ...v, attackerKnowsKills: state.attackerKnowsKills }
  }, [baseId, values, errors, state.attackerKnowsKills])

  const actions = useMemo(
    () => ({
      setBase: (id: string) => dispatch({ type: 'setBase', baseId: id }),
      setInput: (field: NumericField, value: string) =>
        dispatch({ type: 'setInput', field, value }),
      applyPreset: (preset: MissilePreset) => dispatch({ type: 'applyPreset', preset }),
      setAttackerKnowsKills: (value: boolean) => dispatch({ type: 'setAttackerKnowsKills', value }),
      setMap: (patch: Partial<MapOptions>) => dispatch({ type: 'setMap', patch }),
      resetParams: () => dispatch({ type: 'resetParams' }),
    }),
    [],
  )

  return { state, baseId, values, errors, params, actions }
}

export type SimulatorParamsApi = ReturnType<typeof useSimulatorParams>
