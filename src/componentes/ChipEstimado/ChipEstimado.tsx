import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useT } from '../../i18n/useT'
import { HojaInferior } from '../HojaInferior/HojaInferior'
import { Icono } from '../Icono/Icono'
import s from './ChipEstimado.module.css'

interface ChipEstimadoProps {
  /** Hora de los valores, ya con formato ("9:30 a. m."). Es la misma del encabezado. */
  time: string
  /** Mientras haya datos provisionales en uso se agrega "· provisional" (CLAUDE.md, honestidad del dato). */
  provisional: boolean
}

/**
 * Chip "Estimado · 9:30 a. m. ⓘ" (G1, Figma 104:137): dice que los valores son estimados y de qué hora son.
 * Se ve de 32 px, pero el área táctil es de 56. Al tocarlo abre una hoja con los datos provisionales, las
 * fuentes y las atribuciones.
 */
export function ChipEstimado({ time, provisional }: ChipEstimadoProps) {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className={s.boton}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span className={`${s.chip} um-etiqueta`}>
          <span>
            {t('chipEstimado.texto', { hora: time })}
            {provisional && <span className={s.provisional}> · {t('chipEstimado.provisional')}</span>}
          </span>
          <Icono name="informacion" size={20} className={s.icono} />
        </span>
      </button>
      {/* La hoja va en <body>: el chip vive dentro de capas del mapa que no reciben toques. */}
      {open &&
        createPortal(
          <HojaInferior open onClose={() => setOpen(false)} title={t('chipEstimado.titulo')}>
            <p className="um-cuerpo">{t('chipEstimado.como')}</p>
            {provisional && (
              <section className={s.grupo}>
                <h3 className="um-cuerpo-fuerte">{t('app.datosProvisionales')}</h3>
                <p className="um-etiqueta">{t('mapa.provisionalDetalle')}</p>
              </section>
            )}
            <section className={s.grupo}>
              <h3 className="um-cuerpo-fuerte">{t('creditos.fuentes')}</h3>
              <ul className={`${s.lista} um-etiqueta`}>
                <li>{t('creditos.sol')}</li>
                <li>{t('creditos.mapa')}</li>
                <li>{t('creditos.clima')}</li>
              </ul>
            </section>
          </HojaInferior>,
          document.body,
        )}
    </>
  )
}
