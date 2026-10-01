import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../api/client'

export type ApiState<T> = { data: T | null; loading: boolean; error: string | null; reload: () => void }

/** Wraps any `() => Promise<T>` api call with loading/error/retry state. */
export function useApiData<T>(fetcher: () => Promise<T>, deps: unknown[] = []): ApiState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const load = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetcher()
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof ApiError ? e.message : 'Something went wrong loading this.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps])

  useEffect(() => load(), [load])

  return { data, loading, error, reload: () => setTick((t) => t + 1) }
}
