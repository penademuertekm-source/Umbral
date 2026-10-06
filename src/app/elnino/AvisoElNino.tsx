import { useEffect, useId, useRef } from 'react'
import type { ClimaConfig } from '../../clima/configClima'
import { ContenidoElNino } from './ContenidoElNino'
import s from './ElNino.module.css'

interface AvisoElNinoProps {
  config: ClimaConfig
  onClose: () => void
}

/** Pantalla 09 sobre el mapa, a pantalla completa. <dialog> nativo: atrapa el foco y se cierra con Escape. */
export function AvisoElNino({ config, onClose }: AvisoElNinoProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || dialog.open) return
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.setAttribute('open', '')
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className={s.dialogo}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <ContenidoElNino config={config} onDone={onClose} titleId={titleId} />
    </dialog>
  )
}
