import { Link } from 'react-router'
import { useEnlace } from '../../app/rutas/enlaces'
import type { TranslationKey } from '../../i18n/traducir'
import { useT } from '../../i18n/useT'
import { Icono } from '../Icono/Icono'
import type { IconName } from '../Icono/nombres'
import s from './BarraInferior.module.css'

export type BottomTab = 'mapa' | 'ir' | 'descansar' | 'ajustes'

const TABS: { tab: BottomTab; path: string; icon: IconName; label: TranslationKey; keepParams: boolean }[] = [
  { tab: 'mapa', path: '/mapa', icon: 'mapa', label: 'barraInferior.mapa', keepParams: true },
  { tab: 'ir', path: '/buscar', icon: 'caminar', label: 'barraInferior.ir', keepParams: true },
  { tab: 'descansar', path: '/refugios', icon: 'banca', label: 'barraInferior.descansar', keepParams: true },
  { tab: 'ajustes', path: '/ajustes', icon: 'ajustes', label: 'barraInferior.ajustes', keepParams: false },
]

interface BarraInferiorProps {
  /** Pestaña de la pantalla actual (variante "Activa" de Figma). */
  active: BottomTab
}

/**
 * Barra inferior (04-8, Figma 105:315): Mapa · Ir a · Descansar · Ajustes, cada una con ícono y palabra. La
 * activa lleva el indicador. Va al final de la columna de la pantalla y respeta el área segura del celular.
 * Mapa, Ir a y Descansar conservan la hora elegida y el punto de partida.
 */
export function BarraInferior({ active }: BarraInferiorProps) {
  const { t } = useT()
  const enlace = useEnlace()
  return (
    <nav className={s.barra} aria-label={t('barraInferior.etiqueta')}>
      {TABS.map(({ tab, path, icon, label, keepParams }) => (
        <Link
          key={tab}
          to={keepParams ? enlace(path) : path}
          className={`${s.pestana} ${tab === active ? s.activa : ''}`}
          aria-current={tab === active ? 'page' : undefined}
        >
          <span className={s.indicador}>
            <Icono name={icon} />
          </span>
          <span className={`${s.texto} um-etiqueta`}>{t(label)}</span>
        </Link>
      ))}
    </nav>
  )
}
