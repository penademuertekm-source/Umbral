import type { I18nValue } from '../../i18n/contexto'
import type { Species } from '../../mapa/datos'
import type { TreeCounts } from '../../mapa/tramos'

const SPECIES: Species[] = ['mango', 'canaguate', 'otro']

/** "6 mangos y 1 cañaguate" (vacío si no hay árboles). */
export function textoArboles({ t, language }: Pick<I18nValue, 't' | 'language'>, counts: TreeCounts): string {
  const parts = SPECIES.filter((sp) => counts[sp] > 0).map((sp) =>
    t(counts[sp] === 1 ? `ficha.especies.${sp}.uno` : `ficha.especies.${sp}.varios`, { n: counts[sp] }),
  )
  return parts.length ? new Intl.ListFormat(language === 'es' ? 'es' : 'en', { type: 'conjunction' }).format(parts) : ''
}
