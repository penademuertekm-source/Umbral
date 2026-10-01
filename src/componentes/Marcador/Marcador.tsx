import { useT } from '../../i18n/useT'
import { Icono } from '../Icono/Icono'
import type { IconName } from '../Icono/nombres'
import s from './Marcador.module.css'

export type MarkerKind = 'usuario' | 'destino' | 'refugio' | 'agua' | 'placa' | 'arbol' | 'grupo'

const ICONS: Partial<Record<MarkerKind, IconName>> = {
  destino: 'destino',
  refugio: 'refugio-cubierto',
  agua: 'agua-potable',
  placa: 'placa-qr',
  arbol: 'mango',
}

interface MarcadorProps {
  kind: MarkerKind
  /** Número de árboles del grupo (solo para `grupo`). */
  count?: number
  /** Ícono alternativo, p. ej. 'canaguate-en-flor' para un árbol. */
  icon?: IconName
  /** Texto accesible. Por defecto, el nombre del tipo de marcador. */
  label?: string
}

/** Marcador de mapa de 40 px con elevación flotante (Figma, nodo 43:86). */
export function Marcador({ kind, count = 0, icon, label }: MarcadorProps) {
  const { t } = useT()
  const text = label ?? (kind === 'grupo' ? t('marcador.grupo', { n: count }) : t(`marcador.${kind}`))
  const iconName = icon ?? ICONS[kind]
  return (
    <span className={`${s.marcador} ${s[kind]}`} role="img" aria-label={text} data-marcador={kind}>
      {kind === 'usuario' && <span className={s.punto} />}
      {kind === 'grupo' && (
        <span className="um-etiqueta" aria-hidden="true">
          {count}
        </span>
      )}
      {iconName && <Icono name={iconName} size={20} />}
    </span>
  )
}
