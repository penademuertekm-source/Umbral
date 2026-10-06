import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { localDate, localParts, minutesOfDay } from '../sombra/tiempo'

// Hora elegida con el deslizador, compartida por el mapa, la búsqueda y las rutas: va en la dirección
// (?hora=16:00) para que cada pantalla la use y se pueda enlazar. Sin ?hora= sigue la hora actual.

export const MIN_MINUTE = 6 * 60
export const MAX_MINUTE = 18 * 60
export const STEP_MIN = 15
const CLOCK_MS = 30_000

export function clampToQuarter(minute: number): number {
  const quarter = Math.floor(minute / STEP_MIN) * STEP_MIN
  return Math.min(MAX_MINUTE, Math.max(MIN_MINUTE, quarter))
}

/** "16:00" → 960 (ajustado al cuarto de hora y al rango del deslizador). null si no es una hora válida. */
export function parseHora(value: string | null): number | null {
  const match = value ? /^(\d{1,2}):(\d{2})$/.exec(value) : null
  if (!match) return null
  const minute = Number(match[1]) * 60 + Number(match[2])
  return Number.isFinite(minute) ? clampToQuarter(minute) : null
}

export function formatHora(minute: number): string {
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
}

export function useHoraElegida() {
  const [params, setParams] = useSearchParams()
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), CLOCK_MS)
    return () => window.clearInterval(id)
  }, [])
  const chosen = parseHora(params.get('hora'))
  const minute = chosen ?? clampToQuarter(minutesOfDay(now))
  const { year, month, day } = localParts(now)
  /** Instante de hoy (hora de Valledupar) para unos minutos desde la medianoche. */
  const at = useCallback((m: number) => localDate(year, month, day, Math.floor(m / 60), m % 60), [year, month, day])
  const setMinute = useCallback(
    (m: number) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('hora', formatHora(clampToQuarter(m)))
          return next
        },
        { replace: true },
      ),
    [setParams],
  )
  return { minute, now, at, time: at(minute), setMinute, chosen: chosen !== null }
}
