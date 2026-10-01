import type { SegmentState } from '../../config/niveles'
import { useT } from '../../i18n/useT'
import s from './MuestraTramo.module.css'

interface MuestraTramoProps {
  state: SegmentState
  /** Texto junto a la muestra. Por defecto, el nombre del estado; `null` lo oculta. */
  label?: string | null
  /** `compacta`: muestra de 28 px para la leyenda flotante del mapa (pantalla 04). */
  size?: 'normal' | 'compacta'
}

// Geometría exacta del componente "Tramo" de Figma (nodo 43:55): caja de 56 × 12 px,
// barra de 8 px de alto con radio 2. En el mapa los patrones se escalan con el zoom.
// La variante compacta (leyenda del nodo 3:2) usa la mitad del ancho con el mismo alto.
const GEOMETRY = {
  normal: { width: 56, dashes: [0, 20, 40], dash: 14, marks: [4, 18, 32, 46] },
  compacta: { width: 28, dashes: [0, 16], dash: 12, marks: [3, 11, 19] },
} as const
const HEIGHT = 12
const BAR_Y = 2
const BAR_HEIGHT = 8

/** Muestra del patrón de un tramo: continuo, discontinuo o con marca punteada. */
export function MuestraTramo({ state, label, size = 'normal' }: MuestraTramoProps) {
  const { t } = useT()
  const text = label === undefined ? t(`tramo.${state}`) : label
  const { width, dashes, dash, marks } = GEOMETRY[size]
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
        {state === 'sombra' && <rect className={s.sombra} y={BAR_Y} width={width} height={BAR_HEIGHT} rx="2" />}
        {/* Parcial: guiones separados por huecos */}
        {state === 'parcial' &&
          dashes.map((x) => <rect key={x} className={s.parcial} x={x} y={BAR_Y} width={dash} height={BAR_HEIGHT} rx="2" />)}
        {/* Expuesto: barra ámbar con marcas oscuras de 6 × 2 px */}
        {state === 'expuesto' && (
          <>
            <rect className={s.expuesto} y={BAR_Y} width={width} height={BAR_HEIGHT} rx="2" />
            {marks.map((x) => (
              <rect key={x} className={s.marca} x={x} y="5" width="6" height="2" />
            ))}
          </>
        )}
      </svg>
      {text && <span className="um-etiqueta">{text}</span>}
    </span>
  )
}
