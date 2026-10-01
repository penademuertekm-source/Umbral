import type { ButtonHTMLAttributes } from 'react'
import { Icono } from '../Icono/Icono'
import type { IconName } from '../Icono/nombres'
import s from './Boton.module.css'

export type ButtonVariant = 'primario' | 'secundario' | 'advertencia'

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  icon?: IconName
  /** Por defecto ocupa todo el ancho, como en las pantallas de Figma. */
  fullWidth?: boolean
}

/** Botón de 60 px de alto y radio 12 (Figma, nodo 43:93). */
export function Boton({
  variant = 'primario',
  icon,
  fullWidth = true,
  type = 'button',
  className,
  children,
  ...rest
}: BotonProps) {
  const classes = [s.boton, s[variant], fullWidth && s.ancho, 'um-cuerpo-fuerte', className]
    .filter(Boolean)
    .join(' ')
  return (
    <button type={type} className={classes} {...rest}>
      {icon && <Icono name={icon} />}
      {children}
    </button>
  )
}
