import type { ThermalLevel } from '../../config/niveles'
import niveles from '../../estilos/niveles.module.css'
import s from './Semaforo.module.css'

/** Forma propia de cada nivel, para no depender solo del color. */
const SHAPES: Record<ThermalLevel, 'circulo' | 'triangulo' | 'rombo' | 'cuadrado'> = {
  comodo: 'circulo',
  precaucion: 'triangulo',
  evitar: 'rombo',
  no_recomendado: 'cuadrado',
  nublado: 'circulo',
}

interface FormaSemaforoProps {
  level: ThermalLevel
  size?: number
}

/** Solo la forma del nivel (círculo, triángulo, rombo, cuadrado). Decorativa: el texto va aparte. */
export function FormaSemaforo({ level, size = 12 }: FormaSemaforoProps) {
  const shape = SHAPES[level]
  return (
    <svg
      className={`${s.forma} ${niveles[level]}`}
      width={size}
      height={size}
      viewBox="0 0 12 12"
      aria-hidden="true"
      focusable="false"
      data-forma={shape}
    >
      {shape === 'circulo' && <circle cx="6" cy="6" r="6" />}
      {/* Triángulo regular inscrito en el círculo de la caja, como el polígono de Figma */}
      {shape === 'triangulo' && <path d="M6 0 11.196 9H0.804Z" />}
      {shape === 'rombo' && <path d="M6 0 12 6 6 12 0 6Z" />}
      {shape === 'cuadrado' && <rect width="12" height="12" rx="1" />}
    </svg>
  )
}
