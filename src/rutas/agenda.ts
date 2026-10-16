// Agenda de salidas (S2): a qué hora salir para llegar a tiempo por la ruta con más sombra. Código puro: las
// rutas de cada hora las calcula quien llama, con el mismo motor y el mismo costo que "¿Cuándo salir?" (15).
import { HEAT_WARNING_HOURS } from '../config/recorrido'
import { DEPARTURE_PLANNER } from '../config/rutas'
import { minutesOfDay } from '../sombra/tiempo'
import type { Route } from './rutas'

const MINUTE_MS = 60_000

export interface PlannerConfig {
  stepMin: number
  windowMin: number
  earlyMin: number
}

export interface DepartureCandidate {
  departure: Date
  /** Ruta con más sombra saliendo a esa hora (null si no hay camino). */
  route: Route | null
}

export interface PlannedDeparture {
  departure: Date
  /** Hora estimada de llegada: la salida más la duración de la ruta. */
  arrival: Date
  route: Route
}

/** Hora a la que conviene llegar: `earlyMin` antes de la pedida. */
export function targetArrival(arrival: Date, config: PlannerConfig = DEPARTURE_PLANNER): Date {
  return new Date(arrival.getTime() - config.earlyMin * MINUTE_MS)
}

/**
 * Horas de salida que se prueban, de la más temprana a la más tarde: desde `windowMin` antes de la llegada
 * buscada hasta esa llegada, en múltiplos de `stepMin` del reloj (2:45, 2:50…).
 */
export function candidateDepartures(arrival: Date, config: PlannerConfig = DEPARTURE_PLANNER): Date[] {
  const stepMs = config.stepMin * MINUTE_MS
  const last = Math.floor(targetArrival(arrival, config).getTime() / stepMs) * stepMs
  const first = last - config.windowMin * MINUTE_MS
  const list: Date[] = []
  for (let t = first; t <= last; t += stepMs) list.push(new Date(t))
  return list
}

/**
 * La salida con menos minutos al sol entre las que llegan a tiempo; entre dos iguales (al minuto), la más
 * tarde. null si ninguna llega a tiempo.
 */
export function chooseDeparture(
  candidates: DepartureCandidate[],
  arrival: Date,
  config: PlannerConfig = DEPARTURE_PLANNER,
): PlannedDeparture | null {
  const target = targetArrival(arrival, config).getTime()
  let best: PlannedDeparture | null = null
  for (const { departure, route } of candidates) {
    if (!route) continue
    const arrives = new Date(departure.getTime() + route.minutes * MINUTE_MS)
    if (arrives.getTime() > target) continue
    const sun = Math.round(route.sunMinutes)
    if (
      !best ||
      sun < Math.round(best.route.sunMinutes) ||
      (sun === Math.round(best.route.sunMinutes) && departure.getTime() > best.departure.getTime())
    ) {
      best = { departure, arrival: arrives, route }
    }
  }
  return best
}

/** ¿La llegada cae en las horas de más calor (las del aviso de calor: 11 a. m. a 3 p. m.)? Franja Precaución. */
export function arrivesInHeat(arrival: Date): boolean {
  const minute = minutesOfDay(arrival)
  return minute >= HEAT_WARNING_HOURS.from * 60 && minute <= HEAT_WARNING_HOURS.to * 60
}
