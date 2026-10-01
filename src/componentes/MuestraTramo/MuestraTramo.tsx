import type { SegmentState } from '../../config/niveles'
import { useT } from '../../i18n/useT'
import s from './MuestraTramo.module.css'

interface MuestraTramoProps {
  state: SegmentState
  /** Texto junto a la muestra. Por defecto, el nombre del estado; `null` lo oculta. */
  label?: string | null
  /** Ancho de la muestra en px. Con 70 se ven tres guiones del patrón 18/8. */
  width?: number
}

const STROKE = 8

/** Muestra del patrón de un tramo: continuo, discontinuo o con marca punteada (Figma, nodo 43:55). */
export function MuestraTramo({ state, label, width = 70 }: MuestraTramoProps) {
  const { t } = useT()
  const text = label === undefined ? t(`tramo.${state}`) : label
  const y = STROKE / 2
  return (
    <span className={s.muestra} data-estado={state}>
      <svg
        width={width}
        height={STROKE}
        viewBox={`0 0 ${width} ${STROKE}`}
        role={text ? undefined : 'img'}
        aria-label={text ? undefined : t(`tramo.${state}`)}
        aria-hidden={text ? true : undefined}
        focusable="false"
      >
        {state === 'sombra' && <rect className={s.sombra} width={width} height={STROKE} rx="2" />}
        {state === 'parcial' && (
          <line className={s.parcial} x1="0" y1={y} x2={width} y2={y} strokeWidth={STROKE} />
        )}
        {state === 'expuesto' && (
          <>
            <rect className={s.expuesto} width={width} height={STROKE} rx="2" />
            <line className={s.marca} x1="3" y1={y} x2={width} y2={y} strokeWidth="2" />
          </>
        )}
      </svg>
      {text && <span className="um-etiqueta">{text}</span>}
    </span>
  )
}
