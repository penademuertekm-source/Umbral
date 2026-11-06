import { Icono, Semaforo } from '../../componentes'
import type { ThermalLevel } from '../../config/niveles'
import { useT } from '../../i18n/useT'
import s from './EncabezadoMapa.module.css'

interface EncabezadoMapaProps {
  /** Hora ya formateada, p. ej. "9:30 a. m.". */
  time: string
  level: ThermalLevel
  /** Texto alternativo del chip del semáforo (p. ej. "Sin datos de clima"). */
  levelLabel?: string
  /** El deslizador de hora está abierto: el chevron apunta hacia arriba. */
  timeOpen: boolean
  onTimeClick: () => void
}

/**
 * Encabezado del mapa (04-6, Figma 110:78): una línea de 64 px con la hora y un chevron, que abre el
 * deslizador de hora, y el chip del semáforo a la derecha. La sensación térmica va en la hoja (04-5).
 */
export function EncabezadoMapa({ time, level, levelLabel, timeOpen, onTimeClick }: EncabezadoMapaProps) {
  const { t } = useT()
  return (
    <header className={s.encabezado}>
      <button type="button" className={s.hora} aria-haspopup="dialog" aria-expanded={timeOpen} onClick={onTimeClick}>
        <time className="um-titulo">{time}</time>
        <span className={`${s.chevron} ${timeOpen ? s.abierto : ''}`} aria-hidden="true">
          <Icono name="avanzar" size={20} />
        </span>
        <span className="sr-only">{t('mapa.otraHora')}</span>
      </button>
      <Semaforo level={level} label={levelLabel} />
    </header>
  )
}
