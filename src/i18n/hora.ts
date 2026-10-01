import { formatTime, localParts } from '../sombra/tiempo'
import type { I18nValue } from './contexto'

/** "la 1:20 p. m." o "las 4:00 p. m." (en inglés, solo la hora), para frases como "hasta {laHora}". */
export function laHora({ t, language }: Pick<I18nValue, 't' | 'language'>, date: Date): string {
  const hora = formatTime(date, language)
  return t(localParts(date).hour % 12 === 1 ? 'comun.laHora.una' : 'comun.laHora.otra', { hora })
}
