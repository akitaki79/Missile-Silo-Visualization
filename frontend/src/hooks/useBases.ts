import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getBase, listBases } from '@/api/bases'
import type { Base, BaseSummary } from '@/types'

/** Summary list of every base file, loaded once. */
export function useBaseList() {
  const [summaries, setSummaries] = useState<BaseSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    listBases()
      .then((list) => !cancelled && setSummaries(list))
      .catch((e: unknown) => {
        if (cancelled) return
        const msg = errorMessage(e)
        setError(msg)
        toast.error('Could not load bases', { description: msg })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { summaries, error }
}

/** Full silo list for one base. `base` is null while loading or if `id` is null. */
export function useBase(id: string | null) {
  // Store the result tagged with its id so a stale response is never shown.
  const [loaded, setLoaded] = useState<{ id: string; base: Base } | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    getBase(id)
      .then((base) => !cancelled && setLoaded({ id, base }))
      .catch((e: unknown) => {
        if (!cancelled) toast.error(`Could not load base "${id}"`, { description: errorMessage(e) })
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const base = loaded && loaded.id === id ? loaded.base : null
  return { base, loading: id !== null && base === null }
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}
