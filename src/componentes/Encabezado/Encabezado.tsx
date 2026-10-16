import type { ReactNode } from 'react'
import { useT } from '../../i18n/useT'
import { Icono } from '../Icono/Icono'
import s from './Encabezado.module.css'

interface EncabezadoProps {
  title: string
  /** Si se omite, no se muestra "‹ Volver". */
  onBack?: () => void
  /** Línea bajo el título (p. ej. "3 lugares guardados"). */
  subtitle?: string
  /** Acción a la derecha de "‹ Volver" (p. ej. "Guardar" en la 06). */
  action?: ReactNode
}

/** Encabezado de sección: "‹ Volver" (Etiqueta, secundario) y título (Título 24). */
export function Encabezado({ title, onBack, subtitle, action }: EncabezadoProps) {
  const { t } = useT()
  return (
    <header className={s.encabezado}>
      {(onBack || action) && (
        <div className={s.fila}>
          {onBack && (
            <button type="button" className={`${s.volver} um-etiqueta`} onClick={onBack}>
              <Icono name="volver" size={20} />
              {t('comun.volver')}
            </button>
          )}
          {action && <div className={s.accion}>{action}</div>}
        </div>
      )}
      <h1 className="um-titulo">{title}</h1>
      {subtitle && <p className={`${s.subtitulo} um-etiqueta`}>{subtitle}</p>}
    </header>
  )
}
