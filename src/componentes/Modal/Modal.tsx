import { useEffect, useId, useRef, type ReactNode } from 'react'
import s from './Modal.module.css'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Botones al pie del modal. */
  actions?: ReactNode
}

/**
 * Modal con velo --um-base-velo, radio 24 y elevación modal.
 * Usa <dialog> nativo: atrapa el foco, se cierra con Escape y devuelve el foco al cerrar.
 * El velo es el propio <dialog> (no ::backdrop) para que tome el token sin problemas de herencia.
 */
export function Modal({ open, onClose, title, children, actions }: ModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close()
      else dialog.removeAttribute('open')
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      className={s.velo}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      // Algunos navegadores cierran el <dialog> aunque se cancele el evento (p. ej. Escape dos veces).
      // Si se cerró solo mientras `open` sigue en true, se avisa para mantener el estado sincronizado.
      onClose={() => {
        if (open) onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className={s.panel}>
        <h2 id={titleId} className="um-subtitulo">
          {title}
        </h2>
        <div className={`${s.contenido} um-cuerpo`}>{children}</div>
        {actions && <div className={s.acciones}>{actions}</div>}
      </div>
    </dialog>
  )
}
