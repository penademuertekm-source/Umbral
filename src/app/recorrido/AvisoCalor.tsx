import { useState } from 'react'
import { Boton, Modal } from '../../componentes'
import { roundMinutes } from '../../i18n/numeros'
import { useT } from '../../i18n/useT'
import s from './Avisos.module.css'
import { useHorasAviso } from './horasAviso'

// Pantalla 19 (nodo 34:111): aviso antes de salir entre las 11 a. m. y las 3 p. m.

interface ContenidoProps {
  shadePercent: number
  sunMinutes: number
}

/** Texto del aviso: la franja de más calor y cuánto protege la ruta. */
export function TextoAvisoCalor({ shadePercent, sunMinutes }: ContenidoProps) {
  const { t } = useT()
  const horas = useHorasAviso()
  const n = roundMinutes(sunMinutes)
  return (
    <p className="um-cuerpo">
      {n > 0
        ? t('avisoCalor.texto', { ...horas, p: Math.round(shadePercent), n })
        : t('avisoCalor.textoSinSol', { ...horas, p: Math.round(shadePercent) })}
    </p>
  )
}

interface AvisoCalorProps extends ContenidoProps {
  open: boolean
  onClose: () => void
  /** Iniciar de todos modos; `hideToday` es la casilla "No volver a avisarme hoy". */
  onStart: (hideToday: boolean) => void
  onBestTime: () => void
}

/** La pantalla 19 como modal sobre la comparación de rutas (06). */
export function AvisoCalor({ open, onClose, onStart, onBestTime, ...contenido }: AvisoCalorProps) {
  const { t } = useT()
  const [hideToday, setHideToday] = useState(false)
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('avisoCalor.titulo')}
      actions={
        <>
          <Boton onClick={onBestTime}>{t('avisoCalor.mejorHora')}</Boton>
          <Boton variant="secundario" onClick={() => onStart(hideToday)}>
            {t('avisoCalor.iniciar')}
          </Boton>
        </>
      }
    >
      <TextoAvisoCalor {...contenido} />
      <label className={`${s.casilla} um-cuerpo`}>
        <input type="checkbox" checked={hideToday} onChange={(e) => setHideToday(e.target.checked)} />
        {t('avisoCalor.ocultarHoy')}
      </label>
    </Modal>
  )
}
