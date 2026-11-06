import { formatTime, isoLocalDate, localDate, localParts } from '../sombra/tiempo'
import type { I18nValue } from './contexto'

/** "la 1:20 p. m." o "las 4:00 p. m." (en inglés, solo la hora), para frases como "hasta {laHora}". */
export function laHora({ t, language }: Pick<I18nValue, 't' | 'language'>, date: Date): string {
  const hora = formatTime(date, language)
  return t(localParts(date).hour % 12 === 1 ? 'comun.laHora.una' : 'comun.laHora.otra', { hora })
}

/** ¿`date` cae en el día siguiente al de `now`, en hora de Valledupar? (N3: "Mañana" del selector de hora). */
export function isTomorrow(date: Date, now: Date = new Date()): boolean {
  const { year, month, day } = localParts(now)
  return isoLocalDate(date) === isoLocalDate(localDate(year, month, day + 1, 12))
}

/** laHora con "mañana" delante si es del día siguiente: "mañana a las 4:00 p. m.". */
export function laHoraConDia(i18n: Pick<I18nValue, 't' | 'language'>, date: Date, now?: Date): string {
  return isTomorrow(date, now) ? i18n.t('comun.mananaA', { laHora: laHora(i18n, date) }) : laHora(i18n, date)
}

/** La hora para chips y encabezados, con "Mañana," delante si es del día siguiente: "Mañana, 4:00 p. m.". */
export function horaConDia({ t, language }: Pick<I18nValue, 't' | 'language'>, date: Date, now?: Date): string {
  const hora = formatTime(date, language)
  return isTomorrow(date, now) ? t('mapa.horaManana', { hora }) : hora
}

/** Marca corta del deslizador: "6 a. m.", "12 m." y "6 p. m." (en inglés "6 AM", "12 PM"). */
export function marcaHora({ t, language }: Pick<I18nValue, 't' | 'language'>, minute: number): string {
  const hour = Math.floor(minute / 60)
  if (hour === 12) return t('comun.mediodia')
  return new Intl.DateTimeFormat(language === 'es' ? 'es-CO' : 'en-US', { hour: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2000, 0, 1, hour)),
  )
}
