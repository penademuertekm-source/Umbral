import { useState, type ReactNode } from 'react'
import niveles from '../../estilos/niveles.module.css'
import { useT } from '../../i18n/useT'
import { Icono } from '../Icono/Icono'
import type { IconName } from '../Icono/nombres'
import s from './Aviso.module.css'

/** Niveles del aviso (G6, Figma 105:161). "Recogido" no es un nivel: es como se ve un aviso ya leído. */
export type NoticeLevel = 'alerta' | 'aviso' | 'nublado'

export interface NoticeItem {
  id: string
  level: NoticeLevel
  title: string
  detail?: string
  /** Solo para el nivel Aviso. Alerta lleva siempre el triángulo y Nublado la nube. */
  icon?: IconName
  /** Acción del aviso (p. ej. "Ver la ruta" en "Es hora de salir"). */
  action?: { label: string; onClick: () => void }
}

interface AvisoProps {
  /** Avisos en orden de importancia: el primero sin leer es el que se ve. */
  notices: NoticeItem[]
}

// Cada nivel toma los colores de un nivel del semáforo (estilos/niveles.module.css).
const TONE: Record<NoticeLevel, string> = {
  alerta: niveles.no_recomendado,
  aviso: niveles.precaucion,
  nublado: niveles.nublado,
}

function iconOf(notice: NoticeItem): IconName {
  if (notice.level === 'alerta') return 'alerta'
  if (notice.level === 'nublado') return 'nublado'
  return notice.icon ?? 'informacion'
}

/**
 * Avisos de una pantalla (G6): se ve uno a la vez. Si hay más, el contador "+N" los abre todos. "Recoger"
 * marca el aviso como leído y lo deja en un chip con los colores de su nivel (no desaparece); al tocar el
 * chip se vuelve a abrir.
 */
export function Aviso({ notices }: AvisoProps) {
  const { t } = useT()
  const [read, setRead] = useState<ReadonlySet<string>>(() => new Set())
  const [showAll, setShowAll] = useState(false)
  if (notices.length === 0) return null

  const markRead = (id: string) => {
    setRead((prev) => new Set(prev).add(id))
    setShowAll(false)
  }
  const reopen = (id: string) =>
    setRead((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  const others = notices.length - 1
  const counter =
    others > 0 ? (
      <button
        type="button"
        className={s.contador}
        aria-label={others === 1 ? t('aviso.verUnoMas') : t('aviso.verMas', { n: others })}
        onClick={() => setShowAll(true)}
      >
        <span className={`${s.pastilla} um-etiqueta`}>{t('aviso.contador', { n: others })}</span>
      </button>
    ) : null

  if (showAll) {
    return (
      <div className={s.pila}>
        {notices.map((notice) => (
          <Tarjeta key={notice.id} notice={notice} onRead={() => markRead(notice.id)} />
        ))}
      </div>
    )
  }

  const current = notices.find((notice) => !read.has(notice.id))
  if (current) return <Tarjeta notice={current} counter={counter} onRead={() => markRead(current.id)} />

  // Todos leídos: el primero queda recogido en su chip.
  const first = notices[0]
  return (
    <div className={`${s.recogido} ${TONE[first.level]} ${first.level === 'alerta' ? s.borde : ''}`}>
      <button type="button" className={`${s.abrir} um-etiqueta`} aria-expanded={false} onClick={() => reopen(first.id)}>
        <Icono name={iconOf(first)} size={20} />
        {first.title}
      </button>
      {counter}
    </div>
  )
}

interface TarjetaProps {
  notice: NoticeItem
  counter?: ReactNode
  onRead: () => void
}

function Tarjeta({ notice, counter, onRead }: TarjetaProps) {
  const { t } = useT()
  return (
    <div className={`${s.tarjeta} ${TONE[notice.level]} ${notice.level === 'alerta' ? s.borde : ''}`}>
      <Icono name={iconOf(notice)} className={s.icono} />
      <div className={s.textos}>
        <p className="um-cuerpo-fuerte">{notice.title}</p>
        {notice.detail && <p className="um-etiqueta">{notice.detail}</p>}
        {notice.action && (
          <button type="button" className={`${s.accion} um-cuerpo-fuerte`} onClick={notice.action.onClick}>
            {notice.action.label}
          </button>
        )}
      </div>
      {counter}
      <button type="button" className={s.recoger} aria-label={t('aviso.recoger')} onClick={onRead}>
        <Icono name="cerrar" />
      </button>
    </div>
  )
}
