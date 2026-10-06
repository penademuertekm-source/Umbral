import { Icono } from '../../componentes'
import type { RainOutlook } from '../../clima/openMeteo'
import { laHora } from '../../i18n/hora'
import { useT } from '../../i18n/useT'
import s from './AvisoNublado.module.css'

interface AvisoNubladoProps {
  rain: RainOutlook | null
  /** Hay lugares cubiertos con etiqueta en el mapa. */
  hasCoveredPlaces: boolean
}

/** Tarjeta de la pantalla 20 (nodo 34:167): cielo cubierto, pronóstico de lluvia y lugares cubiertos. */
export function AvisoNublado({ rain, hasCoveredPlaces }: AvisoNubladoProps) {
  const i18n = useT()
  const { t } = i18n
  // "a las 5:00 p. m." ya termina en punto; en inglés ("at 5:00 PM") hay que ponerlo.
  const sentence = (text: string) => (/[.!?]$/.test(text) ? text : `${text}.`)
  const details = [
    rain ? sentence(t('nublado.lluvia', { p: Math.round(rain.probability), laHora: laHora(i18n, new Date(rain.time)) })) : '',
    hasCoveredPlaces ? t('nublado.cubiertos') : '',
  ].filter(Boolean)
  return (
    <div className={s.tarjeta}>
      <span className={s.icono} aria-hidden="true">
        <Icono name="nublado" />
      </span>
      <div className={s.textos}>
        <p className="um-cuerpo-fuerte">{t('nublado.titulo')}</p>
        {details.length > 0 && <p className={`${s.detalle} um-etiqueta`}>{details.join(' ')}</p>}
      </div>
    </div>
  )
}
