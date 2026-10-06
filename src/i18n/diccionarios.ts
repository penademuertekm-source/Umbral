import en from './en.json'
import es from './es.json'
import type { Language } from './idioma'
import { interpolate, lookup, type Dictionary, type TranslationVars } from './traducir'

export const DICTIONARIES: Record<Language, Dictionary> = { es, en }

/** Traduce en un idioma concreto (p. ej. el título bilingüe de la pantalla 02). Si falta, usa el español. */
export function translateIn(language: Language, key: string, vars?: TranslationVars): string {
  return interpolate(lookup(DICTIONARIES[language], key) ?? lookup(DICTIONARIES.es, key) ?? key, vars)
}
