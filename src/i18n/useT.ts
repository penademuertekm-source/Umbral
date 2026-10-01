import { useContext } from 'react'
import { I18nContext, type I18nValue } from './contexto'

/** Textos de la interfaz en el idioma actual: const { t, language, setLanguage } = useT() */
export function useT(): I18nValue {
  const value = useContext(I18nContext)
  if (!value) throw new Error('useT() debe usarse dentro de <ProveedorIdioma>')
  return value
}
