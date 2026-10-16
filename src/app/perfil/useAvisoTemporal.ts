import { useEffect, useState } from 'react'

/** Cuánto se ve "Lugar borrado · Deshacer" antes de recogerse (ms). */
export const UNDO_MS = 6000

/** Un aviso que se recoge solo después de `ms` milisegundos (p. ej. "Lugar borrado · Deshacer"). */
export function useAvisoTemporal<T>(ms = UNDO_MS): [T | null, (value: T | null) => void] {
  const [value, setValue] = useState<{ value: T; id: number } | null>(null)
  useEffect(() => {
    if (!value) return
    const id = window.setTimeout(() => setValue(null), ms)
    return () => window.clearTimeout(id)
  }, [value, ms])
  return [value?.value ?? null, (next) => setValue(next === null ? null : { value: next, id: Date.now() })]
}
