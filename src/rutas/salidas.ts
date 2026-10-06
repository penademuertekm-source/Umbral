// "¿Cuándo salir?" (pantalla 15) y alternativas de la pantalla 16. Código puro.
import { HEAT_LEVELS, type HeatLevel } from '../config/reglas-semaforo'
import { WINDOW_TOLERANCE_MIN } from '../config/rutas'
import { classifySegment } from '../config/umbrales'
import type { LonLat } from './geometria'
import type { Route } from './rutas'

export interface Departure {
  /** Minutos desde la medianoche (hora de Valledupar). */
  minute: number
  route: Route
  /** Nivel de la ruta a esa hora (null si no hay clima). */
  level: HeatLevel | null
}

export interface DepartureWindow {
  part: 'manana' | 'tarde'
  /** Primera y última hora de salida de la ventana (minutos desde la medianoche). */
  from: number
  to: number
  /** Minutos al sol: el menor y el mayor dentro de la ventana. */
  sunMin: number
  sunMax: number
  /** % en sombra de la mejor salida de la ventana. */
  shadePercent: number
  level: HeatLevel | null
}

const rank = (level: HeatLevel | null) => (level ? HEAT_LEVELS.indexOf(level) : 0)

/** Mejor ventana de un tramo del día: la salida con menor nivel y menos minutos al sol, ampliada a sus vecinas parecidas. */
function bestWindow(list: Departure[], part: DepartureWindow['part']): DepartureWindow | undefined {
  if (list.length === 0) return undefined
  let best = 0
  for (let i = 1; i < list.length; i++) {
    const a = list[i]
    const b = list[best]
    if (rank(a.level) < rank(b.level) || (rank(a.level) === rank(b.level) && a.route.sunMinutes < b.route.sunMinutes)) best = i
  }
  const fits = (d: Departure) =>
    rank(d.level) <= rank(list[best].level) && d.route.sunMinutes <= list[best].route.sunMinutes + WINDOW_TOLERANCE_MIN
  let lo = best
  let hi = best
  while (lo > 0 && fits(list[lo - 1])) lo--
  while (hi < list.length - 1 && fits(list[hi + 1])) hi++
  const window = list.slice(lo, hi + 1)
  return {
    part,
    from: list[lo].minute,
    to: list[hi].minute,
    sunMin: Math.min(...window.map((d) => d.route.sunMinutes)),
    sunMax: Math.max(...window.map((d) => d.route.sunMinutes)),
    shadePercent: list[best].route.shadePercent,
    level: list[best].level,
  }
}

/** Mejores ventanas de la mañana (antes de las 12) y de la tarde. */
export function bestWindows(departures: Departure[]): { morning?: DepartureWindow; afternoon?: DepartureWindow } {
  const sorted = [...departures].sort((a, b) => a.minute - b.minute)
  return {
    morning: bestWindow(
      sorted.filter((d) => d.minute < 12 * 60),
      'manana',
    ),
    afternoon: bestWindow(
      sorted.filter((d) => d.minute >= 12 * 60),
      'tarde',
    ),
  }
}

/** La ventana que conviene sugerir: la próxima que empieza después de `now` o, si ya pasaron, la mejor. */
export function suggestedWindow(
  windows: { morning?: DepartureWindow; afternoon?: DepartureWindow },
  nowMinute: number,
): DepartureWindow | undefined {
  const list = [windows.morning, windows.afternoon].filter((w): w is DepartureWindow => !!w)
  const upcoming = list.filter((w) => w.to >= nowMinute)
  const pool = upcoming.length > 0 ? upcoming : list
  return pool.sort((a, b) => rank(a.level) - rank(b.level) || a.sunMin - b.sunMin || a.from - b.from)[0]
}

export interface ShadedTail {
  /** Punto desde el que el resto del camino queda en sombra. */
  point: LonLat
  /** Metros que quedan por caminar desde ese punto. */
  walkMeters: number
  /** Primer pedazo de la ruta que forma parte del final en sombra. */
  pieceIndex: number
}

/**
 * Pantalla 16, opción de transporte: el primer punto de la ruta desde el que todo lo que falta va en sombra
 * plena (esquinas y cruces se permiten). null si el último tramo no está en sombra o si toda la ruta ya lo está.
 */
export function shadedTail(route: Route): ShadedTail | null {
  let index = route.pieces.length
  let walkMeters = 0
  let hasSidewalk = false
  for (let i = route.pieces.length - 1; i >= 0; i--) {
    const piece = route.pieces[i]
    if (piece.kind === 'acera' && piece.length > 0) {
      if (classifySegment(piece.shade) !== 'sombra') break
      hasSidewalk = true
    }
    walkMeters += piece.length
    index = i
  }
  if (!hasSidewalk || index === 0) return null
  return { point: route.pieces[index].coords[0], walkMeters, pieceIndex: index }
}
