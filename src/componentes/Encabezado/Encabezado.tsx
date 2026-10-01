import { useT } from '../../i18n/useT'
import { Icono } from '../Icono/Icono'
import s from './Encabezado.module.css'

interface EncabezadoProps {
  title: string
  /** Si se omite, no se muestra "‹ Volver". */
  onBack?: () => void
}

/** Encabezado de sección: "‹ Volver" (Etiqueta, secundario) y título (Título 24). */
export function Encabezado({ title, onBack }: EncabezadoProps) {
  const { t } = useT()
  return (
    <header className={s.encabezado}>
      {onBack && (
        <button type="button" className={`${s.volver} um-etiqueta`} onClick={onBack}>
          <Icono name="volver" size={20} />
          {t('comun.volver')}
        </button>
      )}
      <h1 className="um-titulo">{title}</h1>
    </header>
  )
}
