import type { IconName } from './nombres'
import { ICON_SVGS } from './svgs'

interface IconoProps {
  name: IconName
  /** Tamaño en px. Guía: 20 en marcadores, 24 en listas, 28 en avisos. */
  size?: number
  /** Texto accesible. Si se omite, el ícono es decorativo (aria-hidden). */
  label?: string
  className?: string
}

/** Ícono de design/iconos (rejilla de 24 px, trazo 2). Toma el color de `currentColor`. */
export function Icono({ name, size = 24, label, className }: IconoProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      data-icono={name}
      // El contenido viene de los SVG del propio repositorio (design/iconos), no de entradas del usuario.
      dangerouslySetInnerHTML={{ __html: ICON_SVGS[name] ?? '' }}
    />
  )
}
