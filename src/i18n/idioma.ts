// Detección y persistencia del idioma de la interfaz.

export const LANGUAGES = ['es', 'en'] as const
export type Language = (typeof LANGUAGES)[number]

const STORAGE_KEY = 'umbral.idioma'

function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value)
}

/**
 * Elige el idioma a partir de las preferencias del navegador (navigator.languages).
 * Gana el primer idioma que la app soporta. Si el navegador pide otro idioma (p. ej. francés),
 * se usa inglés, que es más útil para turistas extranjeros. Sin datos, español.
 */
export function detectLanguage(preferred: readonly string[]): Language {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0]
    if (isLanguage(base)) return base
  }
  return preferred.length > 0 ? 'en' : 'es'
}

/** Idioma elegido por la persona, o null si nunca lo ha elegido (útil para el primer uso, pantalla 02). */
export function readStoredLanguage(): Language | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return isLanguage(value) ? value : null
  } catch {
    return null
  }
}

export function storeLanguage(language: Language): void {
  try {
    localStorage.setItem(STORAGE_KEY, language)
  } catch {
    // Sin almacenamiento (modo privado, bloqueado): el idioma vale solo para esta sesión.
  }
}

export function initialLanguage(): Language {
  if (typeof navigator === 'undefined') return 'es'
  const preferred = navigator.languages?.length ? navigator.languages : [navigator.language]
  return readStoredLanguage() ?? detectLanguage(preferred.filter(Boolean))
}
