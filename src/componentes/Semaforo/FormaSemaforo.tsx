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
      {shape === 'circulo' && <circle cx="6" cy="6" r="5.5" />}
      {shape === 'triangulo' && <path d="M6 0.8 11.6 11H0.4Z" />}
      {shape === 'rombo' && <path d="M6 0 12 6 6 12 0 6Z" />}
      {shape === 'cuadrado' && <rect x="1" y="1" width="10" height="10" />}
    </svg>
  )
}
