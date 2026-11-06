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
  /** Encabezado de una línea de 64 px (06, Figma 117:613): flecha de volver, título en Subtítulo 20 con el
   * subtítulo debajo, y la acción a la derecha. */
  compact?: boolean
}

/** Encabezado de sección: "‹ Volver" (Etiqueta, secundario) y título (Título 24). */
export function Encabezado({ title, onBack, subtitle, action, compact = false }: EncabezadoProps) {
  const { t } = useT()
  if (compact) {
    return (
      <header className={`${s.encabezado} ${s.compacto}`}>
        {onBack && (
          <button type="button" className={s.volverIcono} onClick={onBack} aria-label={t('comun.volver')}>
            <Icono name="volver" />
          </button>
        )}
        <div className={s.titulos}>
          <h1 className="um-subtitulo">{title}</h1>
          {subtitle && <p className={`${s.subtitulo} um-etiqueta`}>{subtitle}</p>}
        </div>
        {action && <div className={s.accion}>{action}</div>}
      </header>
    )
  }
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
