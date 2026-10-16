import { useEffect, useId, useRef, type PointerEvent, type ReactNode } from 'react'
import { useT } from '../../i18n/useT'
import { Icono } from '../Icono/Icono'
import s from './HojaInferior.module.css'

/** Alturas de la hoja (04-5, Figma 105:328): asomada ≈ 200, media ≈ 420 y completa ≈ 720 px de 844. */
export const SHEET_HEIGHTS = ['asomada', 'media', 'completa'] as const
export type SheetHeight = (typeof SHEET_HEIGHTS)[number]

/** Desplazamiento del asa (px) que cuenta como deslizar hacia arriba o hacia abajo. */
const SWIPE_PX = 24

interface HojaInferiorProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Altura en % del alto de pantalla. Por defecto, media. */
  height?: SheetHeight
  /** Si se pasa, el asa cambia la altura: tocarla la agranda (desde completa vuelve a asomada) y deslizarla
   * hacia arriba o hacia abajo sube o baja un paso. */
  onHeightChange?: (height: SheetHeight) => void
}

/**
 * Hoja inferior sobre el mapa: radio superior 24, asa centrada y elevación de hoja.
 * No bloquea el resto de la pantalla (el mapa sigue visible). Se cierra con Escape o con la ✕.
 * Crece con su contenido hasta su tope y, si no le alcanza, el contenido se desplaza (N7).
 */
export function HojaInferior({ open, onClose, title, children, height = 'media', onHeightChange }: HojaInferiorProps) {
  const { t } = useT()
  const titleId = useId()
  const sheetRef = useRef<HTMLElement>(null)
  const onCloseRef = useRef(onClose)
  const swipeStart = useRef<number | null>(null)

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

  const step = SHEET_HEIGHTS.indexOf(height)
  const taller = SHEET_HEIGHTS[step + 1]
  const shorter = SHEET_HEIGHTS[step - 1]
  const onHandleUp = (event: PointerEvent) => {
    if (!onHeightChange || swipeStart.current === null) return
    const dy = event.clientY - swipeStart.current
    swipeStart.current = null
    if (dy < -SWIPE_PX && taller) onHeightChange(taller)
    else if (dy > SWIPE_PX && shorter) onHeightChange(shorter)
    else if (Math.abs(dy) <= SWIPE_PX) onHeightChange(taller ?? SHEET_HEIGHTS[0])
  }

  return (
    <section
      ref={sheetRef}
      className={s.hoja}
      data-altura={height}
      role="dialog"
      aria-labelledby={titleId}
      tabIndex={-1}
    >
      {onHeightChange ? (
        <button
          type="button"
          className={s.zonaAsa}
          aria-label={taller ? t('hoja.agrandar') : t('hoja.achicar')}
          onPointerDown={(event) => {
            swipeStart.current = event.clientY
          }}
          onPointerUp={onHandleUp}
          onPointerCancel={() => {
            swipeStart.current = null
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowUp' && taller) onHeightChange(taller)
            if (event.key === 'ArrowDown' && shorter) onHeightChange(shorter)
          }}
          // El teclado activa el botón con un clic sin puntero (detail 0); el toque ya lo resolvió onPointerUp.
          onClick={(event) => {
            if (event.detail === 0) onHeightChange(taller ?? SHEET_HEIGHTS[0])
          }}
        >
          <span className={s.asa} aria-hidden="true" />
        </button>
      ) : (
        <span className={s.zonaAsa} aria-hidden="true">
          <span className={s.asa} />
        </span>
      )}
      <div className={s.cabecera}>
        <h2 id={titleId} className="um-titulo">
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
