// ¿Qué avisos salen antes de iniciar un recorrido? (pantallas 19 y 18). Código puro.
import { HEAT_WARNING_HOURS, SUN_PROTECTION } from '../config/recorrido'
import { minutesOfDay } from '../sombra/tiempo'

/** Pantalla 19: entre las 11:00 y las 15:00 (hora de Valledupar). */
export function inHeatWarningHours(now: Date): boolean {
  const minute = minutesOfDay(now)
  return minute >= HEAT_WARNING_HOURS.from * 60 && minute < HEAT_WARNING_HOURS.to * 60
}

export interface PreflightInput {
  now: Date
  /** "Aviso de calor extremo" en Ajustes (Fase 9; por ahora siempre activo salvo que se apague a mano). */
  heatWarningEnabled: boolean
  /** "No volver a avisarme hoy". */
  heatWarningHiddenToday: boolean
  sunMinutes: number
  uv: number | null
}

/** Avisos que se muestran, en orden, antes de la pantalla 13. */
export function preflightSteps(input: PreflightInput): ('aviso' | 'proteccion')[] {
  const steps: ('aviso' | 'proteccion')[] = []
  if (input.heatWarningEnabled && !input.heatWarningHiddenToday && inHeatWarningHours(input.now)) steps.push('aviso')
  if (input.sunMinutes >= SUN_PROTECTION.minSunMinutes && input.uv !== null && input.uv >= SUN_PROTECTION.minUv) {
    steps.push('proteccion')
  }
  return steps
}
