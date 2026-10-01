// Umbrales PROVISIONALES del modelo de sombra (CLAUDE.md). Están aquí para que sea fácil cambiarlos.
import type { SegmentState } from './niveles'

/** Fracción mínima de la acera en sombra para que el tramo cuente como "sombra". */
export const SHADE_THRESHOLD = 0.7
/** Fracción mínima para "parcial"; por debajo, el tramo está "expuesto". */
export const PARTIAL_THRESHOLD = 0.3

export function classifySegment(shadeFraction: number): SegmentState {
  if (shadeFraction >= SHADE_THRESHOLD) return 'sombra'
  if (shadeFraction >= PARTIAL_THRESHOLD) return 'parcial'
  return 'expuesto'
}

/**
 * Meses (1–12) en que el cañaguate está sin hojas, según datos/provisional/arboles.csv
 * (columna meses_sin_hojas). El perfil de horizonte junta todos los caducifolios en un canal,
 * así que la regla es la misma para todos.
 */
export const LEAFLESS_MONTHS: readonly number[] = [1, 2, 3]

/** Paso para "¿hasta qué hora sigue en sombra?" (minutos). */
export const SHADE_UNTIL_STEP_MIN = 5

/** Perfil del día: de 6:00 a 18:00 cada 15 minutos (hora de Valledupar). */
export const DAY_PROFILE = { startHour: 6, endHour: 18, stepMin: 15 } as const
