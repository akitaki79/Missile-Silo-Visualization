import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { BatchResult } from '@/sim/batch'
import type { BatchMessage, BatchRequest } from '@/sim/batch.worker'
import type { Base, SimulatorParams } from '@/types'

/** Batch Monte Carlo in a Web Worker. One batch at a time; a new run cancels the old one. */
export function useBatch(runKey: string | null) {
  const [result, setResult] = useState<{
    key: string
    params: SimulatorParams
    siloCount: number
    data: BatchResult
  } | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const workerRef = useRef<Worker | null>(null)

  const cancel = useCallback(() => {
    workerRef.current?.terminate()
    workerRef.current = null
    setProgress(null)
  }, [])

  useEffect(() => cancel, [cancel])

  const run = useCallback(
    (base: Base, params: SimulatorParams, key: string) => {
      cancel()
      const worker = new Worker(new URL('../sim/batch.worker.ts', import.meta.url), {
        type: 'module',
      })
      workerRef.current = worker
      setProgress({ done: 0, total: params.trials })

      worker.onmessage = (e: MessageEvent<BatchMessage>) => {
        const msg = e.data
        if (msg.type === 'progress') setProgress({ done: msg.done, total: params.trials })
        else {
          if (msg.type === 'done')
            setResult({ key, params, siloCount: base.silos.length, data: msg.result })
          else toast.error('Monte Carlo run failed', { description: msg.message })
          worker.terminate()
          workerRef.current = null
          setProgress(null)
        }
      }
      worker.onerror = (e) => {
        toast.error('Monte Carlo worker crashed', { description: e.message })
        cancel()
      }

      const req: BatchRequest = { silos: base.silos, params, trials: params.trials }
      worker.postMessage(req)
    },
    [cancel],
  )

  return {
    result: result?.data ?? null,
    /** Parameters the shown result was computed with. */
    params: result?.params ?? null,
    siloCount: result?.siloCount ?? null,
    /** The shown result was computed with different parameters. */
    stale: result !== null && result.key !== runKey,
    running: progress !== null,
    progress,
    run,
    cancel,
  }
}

export type BatchApi = ReturnType<typeof useBatch>
