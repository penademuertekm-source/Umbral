import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import en from './en.json'
import es from './es.json'
import { I18nContext, type I18nValue } from './contexto'
import { initialLanguage, storeLanguage, type Language } from './idioma'
import { interpolate, lookup, type Dictionary } from './traducir'

const DICTIONARIES: Record<Language, Dictionary> = { es, en }

export function ProveedorIdioma({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage)

  // El atributo lang de <html> sigue al idioma elegido (lectores de pantalla, separación silábica).
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback((next: Language) => {
    storeLanguage(next)
    setLanguageState(next)
  }, [])

  const value = useMemo<I18nValue>(
    () => ({
      language,
      setLanguage,
      t: (key, vars) =>
        interpolate(lookup(DICTIONARIES[language], key) ?? lookup(DICTIONARIES.es, key) ?? key, vars),
    }),
    [language, setLanguage],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
