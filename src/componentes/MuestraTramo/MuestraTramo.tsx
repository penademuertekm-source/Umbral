import type { SegmentState } from '../../config/niveles'
import { useT } from '../../i18n/useT'
import s from './MuestraTramo.module.css'

interface MuestraTramoProps {
  state: SegmentState
  /** Texto junto a la muestra. Por defecto, el nombre del estado; `null` lo oculta. */
  label?: string | null
  /** `compacta`: muestra de 28 px para la leyenda del mapa (pantalla 04). */
  size?: 'normal' | 'compacta'
}

// Componente "Tramo" de Figma (nodo 43:55, actualizado el 2026-10-16 para 04-1): los mismos trazos que los
// andenes del mapa, con su grosor de 4 px. Sombra = línea continua con punta redonda; parcial = rayas de
// 10 px con huecos de 5 px y punta recta; al sol = puntos redondos cada 7 px. Se distinguen sin color.
const WIDTH = { normal: 56, compacta: 28 } as const
const HEIGHT = 12
const STROKE = 4
/** Las puntas redondas sobresalen medio grosor: la línea empieza y termina a esa distancia del borde. */
const CAP = STROKE / 2

const PATTERN: Record<SegmentState, { dasharray?: string; round: boolean }> = {
  sombra: { round: true },
  parcial: { dasharray: '10 5', round: false },
  expuesto: { dasharray: '0.1 6.9', round: true },
}

/** Muestra del trazo de un tramo: continuo, a rayas o a puntos. */
export function MuestraTramo({ state, label, size = 'normal' }: MuestraTramoProps) {
  const { t } = useT()
  const text = label === undefined ? t(`tramo.${state}`) : label
  const width = WIDTH[size]
  const { dasharray, round } = PATTERN[state]
  const inset = round ? CAP : 0
  return (
    <span className={`${s.muestra} ${size === 'compacta' ? s.compacta : ''}`} data-estado={state}>
      <svg
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        role={text ? undefined : 'img'}
        aria-label={text ? undefined : t(`tramo.${state}`)}
        aria-hidden={text ? true : undefined}
        focusable="false"
      >
        <line
          className={s[state]}
          x1={inset}
          x2={width - inset}
          y1={HEIGHT / 2}
          y2={HEIGHT / 2}
          strokeWidth={STROKE}
          strokeLinecap={round ? 'round' : 'butt'}
          strokeDasharray={dasharray}
        />
      </svg>
      {text && <span className="um-etiqueta">{text}</span>}
    </span>
  )
}
