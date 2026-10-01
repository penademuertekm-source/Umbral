import type { ThermalLevel } from '../../config/niveles'
import niveles from '../../estilos/niveles.module.css'
import { useT } from '../../i18n/useT'
import { FormaSemaforo } from './FormaSemaforo'
import s from './Semaforo.module.css'

interface SemaforoProps {
  level: ThermalLevel
  /** Texto alternativo del chip, p. ej. "Nublado · riesgo bajo". Por defecto, el nombre del nivel. */
  label?: string
}

/** Chip del semáforo térmico: fondo, forma y texto propios de cada nivel (Figma, nodo 43:42). */
export function Semaforo({ level, label }: SemaforoProps) {
  const { t } = useT()
  return (
    <span className={`${s.chip} ${niveles[level]} um-etiqueta`} data-nivel={level}>
      <FormaSemaforo level={level} />
      <span className="sr-only">{t('semaforo.prefijoAccesible')} </span>
      {label ?? t(`semaforo.${level}`)}
    </span>
  )
}
