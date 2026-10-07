import { Boton } from '../../componentes'
import type { ClimaConfig } from '../../clima/configClima'
import { useT } from '../../i18n/useT'
import { formatIsoDate } from '../../sombra/tiempo'
import s from './ElNino.module.css'

interface ContenidoElNinoProps {
  config: ClimaConfig | null
  onDone: () => void
  /** Página propia (h1) o aviso sobre el mapa (h2). */
  asPage?: boolean
  titleId?: string
}

/** Pantalla 09 (nodo 6:2): qué significa El Niño activo y qué cambia en la app. */
export function ContenidoElNino({ config, onDone, asPage = false, titleId }: ContenidoElNinoProps) {
  const { t, language } = useT()
  const Heading = asPage ? 'h1' : 'h2'
  // Como página es el contenido principal; dentro del aviso (diálogo) es un bloque más.
  const Root = asPage ? 'main' : 'div'
  const updated = config ? formatIsoDate(config.updated, language) : ''
  return (
    <Root className={s.pantalla}>
      <header className={s.cabecera}>
        <span className={s.signo} aria-hidden="true">
          !
        </span>
        <Heading id={titleId} className="um-titulo">
          {t('elNino.titulo')}
        </Heading>
      </header>
      <div className={s.cuerpo}>
        {config && !config.elNino && <p className={`${s.ejemplo} um-etiqueta`}>{t('elNino.ejemplo')}</p>}
        <p className="um-cuerpo">{t('elNino.texto')}</p>
        <p className="um-subtitulo">{t('elNino.queCambia')}</p>
        <ul className={s.lista}>
          <li className="um-cuerpo">{t('elNino.rutas')}</li>
          <li className="um-cuerpo">{t('elNino.hidratacion')}</li>
          <li className="um-cuerpo">{t('elNino.aviso')}</li>
        </ul>
        {config?.source && updated && (
          <p className={`${s.fuente} um-micro`}>{t('elNino.fuente', { fuente: config.source, fecha: updated })}</p>
        )}
      </div>
      <div className={s.acciones}>
        <Boton onClick={onDone}>{t('elNino.entendido')}</Boton>
      </div>
    </Root>
  )
}
