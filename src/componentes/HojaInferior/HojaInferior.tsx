import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useT } from '../../i18n/useT'
import { Icono } from '../Icono/Icono'
import s from './HojaInferior.module.css'

interface HojaInferiorProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

/**
 * Hoja inferior sobre el mapa: radio superior 24, asa centrada y elevación de hoja.
 * No bloquea el resto de la pantalla (el mapa sigue visible). Se cierra con Escape o con la ✕.
 */
export function HojaInferior({ open, onClose, title, children }: HojaInferiorProps) {
  const { t } = useT()
  const titleId = useId()
  const sheetRef = useRef<HTMLElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    sheetRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <section ref={sheetRef} className={s.hoja} role="dialog" aria-labelledby={titleId} tabIndex={-1}>
      <span className={s.asa} aria-hidden="true" />
      <div className={s.cabecera}>
        <h2 id={titleId} className="um-subtitulo">
          {title}
        </h2>
        <button type="button" className={s.cerrar} onClick={onClose} aria-label={t('comun.cerrar')}>
          <Icono name="cerrar" />
        </button>
      </div>
      <div className={s.contenido}>{children}</div>
    </section>
  )
}
