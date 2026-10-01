import { createContext } from 'react'
import type { Language } from './idioma'
import type { TranslationKey, TranslationVars } from './traducir'

export interface I18nValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey, vars?: TranslationVars) => string
}

export const I18nContext = createContext<I18nValue | null>(null)
