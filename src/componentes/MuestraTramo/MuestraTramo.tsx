import type { SegmentState } from '../../config/niveles'
import { useT } from '../../i18n/useT'
import s from './MuestraTramo.module.css'

interface MuestraTramoProps {
  state: SegmentState
  /** Texto junto a la muestra. Por defecto, el nombre del estado; `null` lo oculta. */
  label?: string | null
}

// Geometría exacta del componente "Tramo" de Figma (nodo 43:55): caja de 56 × 12 px,
// barra de 8 px de alto con radio 2. En el mapa (Fase 4) los patrones se escalan con el zoom.
const WIDTH = 56
const HEIGHT = 12
const BAR_Y = 2
const BAR_HEIGHT = 8

/** Muestra del patrón de un tramo: continuo, discontinuo o con marca punteada. */
export function MuestraTramo({ state, label }: MuestraTramoProps) {
  const { t } = useT()
  const text = label === undefined ? t(`tramo.${state}`) : label
  return (
    <span className={s.muestra} data-estado={state}>
      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role={text ? undefined : 'img'}
        aria-label={text ? undefined : t(`tramo.${state}`)}
        aria-hidden={text ? true : undefined}
        focusable="false"
      >
        {state === 'sombra' && <rect className={s.sombra} y={BAR_Y} width={WIDTH} height={BAR_HEIGHT} rx="2" />}
        {/* Parcial: tres guiones de 14 px separados 6 px */}
        {state === 'parcial' &&
          [0, 20, 40].map((x) => (
            <rect key={x} className={s.parcial} x={x} y={BAR_Y} width="14" height={BAR_HEIGHT} rx="2" />
          ))}
        {/* Expuesto: barra ámbar con cuatro marcas oscuras de 6 × 2 px */}
        {state === 'expuesto' && (
          <>
            <rect className={s.expuesto} y={BAR_Y} width={WIDTH} height={BAR_HEIGHT} rx="2" />
            {[4, 18, 32, 46].map((x) => (
              <rect key={x} className={s.marca} x={x} y="5" width="6" height="2" />
            ))}
          </>
        )}
      </svg>
      {text && <span className="um-etiqueta">{text}</span>}
    </span>
  )
}
