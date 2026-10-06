// Hora de Valledupar. Colombia usa UTC−5 todo el año (sin horario de verano), así que basta un
// desplazamiento fijo. Todo el modelo trabaja en esta hora, aunque el teléfono esté en otra zona.

export const TIME_ZONE = 'America/Bogota'
const OFFSET_MS = -5 * 60 * 60 * 1000
const QUARTER_MS = 15 * 60 * 1000

export interface LocalParts {
  year: number
  /** 1–12 */
  month: number
  day: number
  hour: number
  minute: number
}

/** Fecha y hora de Valledupar de un instante. */
export function localParts(date: Date): LocalParts {
  const shifted = new Date(date.getTime() + OFFSET_MS)
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  }
}

/** Instante que corresponde a una fecha y hora de Valledupar. */
export function localDate(year: number, month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - OFFSET_MS)
}

/** El mismo día de Valledupar que `date`, a la hora indicada. */
export function atLocalTime(date: Date, hour: number, minute = 0): Date {
  const { year, month, day } = localParts(date)
  return localDate(year, month, day, hour, minute)
}

/** Redondea hacia abajo al cuarto de hora (la caché del motor trabaja por cuartos de hora). */
export function floorToQuarter(date: Date): Date {
  return new Date(Math.floor(date.getTime() / QUARTER_MS) * QUARTER_MS)
}

/** Minutos desde la medianoche, en hora de Valledupar. */
export function minutesOfDay(date: Date): number {
  const { hour, minute } = localParts(date)
  return hour * 60 + minute
}

/** "1:20 p. m." en español, "1:20 PM" en inglés, siempre en hora de Valledupar. */
export function formatTime(date: Date, language: string): string {
  return new Intl.DateTimeFormat(language === 'es' ? 'es-CO' : 'en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  }).format(date)
}

/** "6 oct., 9:00 p. m." en español, "Oct 6, 9:00 PM" en inglés (hora de Valledupar). */
export function formatDateTime(date: Date, language: string): string {
  return new Intl.DateTimeFormat(language === 'es' ? 'es-CO' : 'en-US', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  }).format(date)
}

/** "2026-10-01" → "1 de octubre de 2026" ("October 1, 2026" en inglés). Texto vacío si la fecha no es válida. */
export function formatIsoDate(isoDate: string, language: string): string {
  const date = new Date(`${isoDate}T12:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate) || Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(language === 'es' ? 'es-CO' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

/** "2026-10-01": fecha de Valledupar para un <input type="date">. */
export function isoLocalDate(date: Date): string {
  const { year, month, day } = localParts(date)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
