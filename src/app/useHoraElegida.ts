import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { localDate, localParts, minutesOfDay } from '../sombra/tiempo'

// Hora elegida con el deslizador, compartida por el mapa, la búsqueda y las rutas: va en la dirección
// (?hora=16:00) para que cada pantalla la use y se pueda enlazar. Sin ?hora= sigue la hora actual.
// "Mañana" (N3, Figma 113:836) va igual: ?dia=manana. El pronóstico de Open-Meteo cubre los dos días.

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

/** Valor de ?dia= para el día siguiente. Sin él, la hora es de hoy. */
export const TOMORROW = 'manana'

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
  const tomorrow = params.get('dia') === TOMORROW
  const currentMinute = clampToQuarter(minutesOfDay(now))
  const minute = chosen ?? currentMinute
  const { year, month, day } = localParts(now)
  const offset = tomorrow ? 1 : 0
  /** Instante del día elegido (hoy o mañana, hora de Valledupar) para unos minutos desde la medianoche. */
  const at = useCallback(
    (m: number) => localDate(year, month, day + offset, Math.floor(m / 60), m % 60),
    [year, month, day, offset],
  )
  const update = useCallback(
    (change: (next: URLSearchParams) => void) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          change(next)
          return next
        },
        { replace: true },
      ),
    [setParams],
  )
  const setMinute = useCallback((m: number) => update((next) => next.set('hora', formatHora(clampToQuarter(m)))), [update])
  const setTomorrow = useCallback(
    (value: boolean) => update((next) => (value ? next.set('dia', TOMORROW) : next.delete('dia'))),
    [update],
  )
  /** "Volver a ahora": quita la hora y el día elegidos. */
  const resetToNow = useCallback(
    () =>
      update((next) => {
        next.delete('hora')
        next.delete('dia')
      }),
    [update],
  )
  /** La hora elegida es la de este momento (hoy, en el mismo cuarto de hora). */
  const isNow = !tomorrow && minute === currentMinute
  return { minute, now, at, time: at(minute), setMinute, chosen: chosen !== null, tomorrow, setTomorrow, isNow, resetToNow }
}
