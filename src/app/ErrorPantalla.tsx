import { useEffect } from 'react'
import { useRouteError } from 'react-router'
import { Boton, Encabezado } from '../componentes'
import { useT } from '../i18n/useT'
import s from './PantallaPendiente.module.css'
import { isChunkError, reloadOnce } from './recargaVersion'

/**
 * Lo que se ve si una pantalla falla (en lugar del "Unexpected Application Error!" de react-router). Si el
 * error es de una versión vieja de la app, lo dice así: recargar abre la versión nueva y no se pierde nada.
 */
export function ErrorPantalla() {
  const { t } = useT()
  const version = isChunkError(useRouteError())
  // Primero se intenta solo (una vez); si ya se intentó hace poco, queda el botón.
  useEffect(() => {
    if (version) reloadOnce()
  }, [version])
  return (
    <>
      <Encabezado title={version ? t('errorApp.versionTitulo') : t('errorApp.titulo')} />
      <main className={s.contenido}>
        <p className="um-cuerpo">{version ? t('errorApp.versionTexto') : t('errorApp.texto')}</p>
        <Boton onClick={() => window.location.reload()}>{t('errorApp.recargar')}</Boton>
      </main>
    </>
  )
}
