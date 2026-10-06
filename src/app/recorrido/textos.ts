import type { IconName } from '../../componentes'
import { laHora } from '../../i18n/hora'
import type { I18nValue } from '../../i18n/contexto'
import type { Refuge } from '../../mapa/datos'
import type { SombraLugar } from './useSombraLugares'

/** Ícono de un refugio según lo que ofrece. */
export function refugeIcon(refuge: Refuge): IconName {
  if (refuge.cubierto !== 'no') return 'refugio-cubierto'
  if (refuge.asientos === 'si') return 'banca'
  if (refuge.tipo === 'arbolado') return 'mango'
  return 'sombra-plena'
}

/** "Sombra plena hasta las 2:40 p. m.", "Al sol a esta hora"… */
export function textoSombraLugar(i18n: Pick<I18nValue, 't' | 'language'>, sombra: SombraLugar | undefined): string {
  const { t } = i18n
  if (!sombra) return ''
  switch (sombra.kind) {
    case 'cubierto':
      return t('refugios.cubierto')
    case 'hasta':
      return sombra.sunset ? t('ficha.hastaAtardecer') : t('ficha.hasta', { laHora: laHora(i18n, sombra.until) })
    case 'parcial':
      return t('ficha.parcialAhora')
    case 'expuesto':
      return t('refugios.alSolAhora')
    case 'sin_sol':
      return t('refugios.sinSol')
  }
}
