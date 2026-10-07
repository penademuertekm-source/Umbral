import { isoLocalDate, minutesOfDay } from '../../sombra/tiempo'
import { readSettings } from '../ajustes/preferencias'
import { formatHora } from '../useHoraElegida'

// Lo que el recorrido guarda en el teléfono (CLAUDE.md, "Privacidad"): nada de posiciones, solo
// preferencias del aviso de calor y las respuestas de "¿Te sirvió esta ruta?".

const HEAT_WARNING_HIDDEN_KEY = 'umbral.avisoCalorOculto'
const ANSWERS_KEY = 'umbral.respuestas'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Almacenamiento bloqueado: se pierde la preferencia, nada más.
  }
}

/** "Aviso de calor extremo" (pantalla 11). Activo por defecto. */
export function heatWarningEnabled(): boolean {
  return readSettings().heatWarning
}

/** "No volver a avisarme hoy": se guarda la fecha. */
export function heatWarningHiddenToday(now = new Date()): boolean {
  return read(HEAT_WARNING_HIDDEN_KEY) === isoLocalDate(now)
}

export function hideHeatWarningToday(now = new Date()): void {
  write(HEAT_WARNING_HIDDEN_KEY, isoLocalDate(now))
}

export type Answer = 'si' | 'mas_o_menos' | 'no'

/** Respuesta de "¿Te sirvió esta ruta?" (pantalla 22). Se exporta como CSV desde Ajustes (Fase 9). */
export interface AnswerRecord {
  fecha: string
  hora: string
  destino: string
  nivel: string | null
  respuesta: Answer
  /** true si el recorrido se hizo en modo simulación (para separarlo al validar). */
  simulado: boolean
}

export function readAnswers(): AnswerRecord[] {
  try {
    const parsed: unknown = JSON.parse(read(ANSWERS_KEY) ?? '[]')
    return Array.isArray(parsed) ? (parsed as AnswerRecord[]) : []
  } catch {
    return []
  }
}

/** Guarda la respuesta; si `replace` es un índice, cambia esa respuesta (la persona corrigió). Devuelve su índice. */
export function saveAnswer(record: AnswerRecord, replace: number | null = null): number {
  const answers = readAnswers()
  let index: number
  if (replace !== null && replace >= 0 && replace < answers.length) {
    answers[replace] = record
    index = replace
  } else {
    index = answers.push(record) - 1
  }
  write(ANSWERS_KEY, JSON.stringify(answers))
  return index
}

/** Respuesta con la fecha y la hora de ahora. */
export function recordAnswer(
  input: Omit<AnswerRecord, 'fecha' | 'hora'>,
  replace: number | null = null,
  now = new Date(),
): number {
  return saveAnswer({ fecha: isoLocalDate(now), hora: formatHora(minutesOfDay(now)), ...input }, replace)
}
