import { Link } from 'react-router'
import { Encabezado } from '../componentes'
import { figmaNodeUrl } from '../config/constantes'
import { useT } from '../i18n/useT'
import type { ScreenDef } from './pantallas'
import s from './PantallaPendiente.module.css'
import { useVolver } from './useVolver'

/** Ruta vacía: indica qué pantalla es y en qué fase se construye. */
export function PantallaPendiente({ screen }: { screen: ScreenDef }) {
  const { t } = useT()
  const volver = useVolver()
  return (
    <>
      <Encabezado title={t(screen.nameKey)} onBack={screen.path === '/' ? undefined : volver} />
      <main className={s.contenido}>
        <p className={`${s.meta} um-etiqueta`}>
          {t('pantallas.numero', { n: screen.number })} · {t('pantallas.nodo', { nodo: screen.figmaNode })}
        </p>
        <p className="um-cuerpo">{t('pantallas.pendiente', { fase: screen.phase })}</p>
        <a className="um-cuerpo-fuerte" href={figmaNodeUrl(screen.figmaNode)} target="_blank" rel="noreferrer">
          {t('pantallas.verFigma')}
        </a>
        <Link className="um-cuerpo-fuerte" to="/guia">
          {t('pantallas.irGuia')}
        </Link>
      </main>
    </>
  )
}
