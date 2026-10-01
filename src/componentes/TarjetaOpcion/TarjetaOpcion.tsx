import type { ThermalLevel } from '../../config/niveles'
import niveles from '../../estilos/niveles.module.css'
import { Icono } from '../Icono/Icono'
import type { IconName } from '../Icono/nombres'
import s from './TarjetaOpcion.module.css'

interface TarjetaOpcionProps {
  icon: IconName
  title: string
  text?: string
  /** Tinte del contenedor del ícono, con los colores del nivel del semáforo. */
  tone?: ThermalLevel
  /** Si existe, la tarjeta es un botón y muestra la flecha. */
  onClick?: () => void
}

/** Tarjeta de opción: superficie, borde, radio 16 e ícono de 44 px con tinte. */
export function TarjetaOpcion({ icon, title, text, tone = 'comodo', onClick }: TarjetaOpcionProps) {
  const content = (
    <>
      <span className={`${s.icono} ${niveles[tone]}`}>
        <Icono name={icon} />
      </span>
      <span className={s.textos}>
        <span className={`${s.titulo} um-cuerpo-fuerte`}>{title}</span>
        {text && <span className={`${s.texto} um-etiqueta`}>{text}</span>}
      </span>
      {onClick && <Icono name="avanzar" className={s.flecha} />}
    </>
  )
  return onClick ? (
    <button type="button" className={`${s.tarjeta} ${s.accion}`} onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className={s.tarjeta}>{content}</div>
  )
}
