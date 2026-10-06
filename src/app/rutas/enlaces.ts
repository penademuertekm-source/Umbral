import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

/** Parámetros que viajan de una pantalla a otra: la hora elegida y el punto de partida. */
const SHARED = ['hora', 'desde'] as const

/** Arma enlaces que conservan ?hora= y ?desde=, más los parámetros que se indiquen (undefined los quita). */
export function useEnlace() {
  const [params] = useSearchParams()
  return useCallback(
    (path: string, extra: Record<string, string | undefined> = {}) => {
      const next = new URLSearchParams()
      for (const key of SHARED) {
        const value = params.get(key)
        if (value) next.set(key, value)
      }
      for (const [key, value] of Object.entries(extra)) {
        if (value === undefined) next.delete(key)
        else next.set(key, value)
      }
      const query = next.toString()
      return query ? `${path}?${query}` : path
    },
    [params],
  )
}
