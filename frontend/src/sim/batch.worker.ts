/**
 * Web Worker wrapper around runBatch (batch.ts), so thousands of Lawrence (2026)-style
 * Monte Carlo trials run off the main thread.
 */
import { runBatch, type BatchResult } from '@/sim/batch'
import type { SimParams, SimSiloInput } from '@/sim/types'

export interface BatchRequest {
  silos: SimSiloInput[]
  params: SimParams
  trials: number
}

export type BatchMessage =
  | { type: 'progress'; done: number }
  | { type: 'done'; result: BatchResult }
  | { type: 'error'; message: string }

// The app's tsconfig uses DOM types, where `self.postMessage` needs a target origin.
const post = (msg: BatchMessage) =>
  (self as unknown as { postMessage(m: BatchMessage): void }).postMessage(msg)

self.onmessage = (e: MessageEvent<BatchRequest>) => {
  const { silos, params, trials } = e.data
  try {
    const result = runBatch(silos, params, trials, (done) => post({ type: 'progress', done }))
    post({ type: 'done', result })
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) })
  }
}
