import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nContext, type I18nValue } from './contexto'
import { translateIn } from './diccionarios'
import { initialLanguage, storeLanguage, type Language } from './idioma'

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
      t: (key, vars) => translateIn(language, key, vars),
    }),
    [language, setLanguage],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
