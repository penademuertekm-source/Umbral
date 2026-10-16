import { Link } from 'react-router'
import { BarraInferior, Encabezado, Icono, MuestraTramo } from '../../componentes'
import { PARTIAL_THRESHOLD, SHADE_THRESHOLD } from '../../config/umbrales'
import { useT } from '../../i18n/useT'
import { formatDateTime } from '../../sombra/tiempo'
import { useVolver } from '../useVolver'
import s from './Perfil.module.css'

// Páginas que se abren desde Perfil › La app. Son provisionales (decisión de la autora, paso P1): las
// reemplazan "Cómo leer el mapa" (N2) y "Acerca de y créditos" (N6) cuando lleguen sus pasos.

function Pagina({ title, children }: { title: string; children: React.ReactNode }) {
  const volver = useVolver('/perfil')
  return (
    <div className={s.pantalla}>
      <Encabezado title={title} onBack={volver} />
      <main className={s.contenido}>{children}</main>
      <BarraInferior active="perfil" />
    </div>
  )
}

const percent = (fraction: number) => Math.round(fraction * 100)

/** Cómo leer el mapa: los trazos de los andenes, con los umbrales de src/config/umbrales.ts. */
export function ComoLeer() {
  const { t } = useT()
  return (
    <Pagina title={t('miPerfil.comoLeer')}>
      <section className={s.texto}>
        <p className="um-cuerpo">{t('comoLeer.intro')}</p>
        <ul className={s.leyenda}>
          <li>
            <MuestraTramo state="sombra" label={null} />
            <span className="um-cuerpo">{t('comoLeer.sombra', { p: percent(SHADE_THRESHOLD) })}</span>
          </li>
          <li>
            <MuestraTramo state="parcial" label={null} />
            <span className="um-cuerpo">
              {t('comoLeer.parcial', {
                desde: percent(PARTIAL_THRESHOLD),
                hasta: percent(SHADE_THRESHOLD),
              })}
            </span>
          </li>
          <li>
            <MuestraTramo state="expuesto" label={null} />
            <span className="um-cuerpo">{t('comoLeer.expuesto', { p: percent(PARTIAL_THRESHOLD) })}</span>
          </li>
          <li>
            <Icono name="mango" />
            <span className="um-cuerpo">{t('comoLeer.arboles')}</span>
          </li>
        </ul>
        <p className={`${s.secundario} um-etiqueta`}>{t('comoLeer.estimado')}</p>
      </section>
      <Link className={`${s.enlace} um-cuerpo-fuerte`} to="/semaforo">
        {t('comoLeer.semaforo')}
      </Link>
    </Pagina>
  )
}

/** Cómo se calcula la sombra (antes, una tarjeta en Ajustes). */
export function ComoSeCalcula() {
  const { t } = useT()
  return (
    <Pagina title={t('miPerfil.comoSeCalcula')}>
      <section className={s.texto}>
        <p className="um-cuerpo">{t('comoSeCalcula.texto')}</p>
        <p className="um-cuerpo">{t('comoSeCalcula.calor')}</p>
      </section>
    </Pagina>
  )
}

/** Acerca de y créditos (antes, la sección Créditos de Ajustes; G10). El botón ⓘ del mapa llega aquí. */
export function Acerca() {
  const { t, language } = useT()
  return (
    <Pagina title={t('miPerfil.acerca')}>
      <section className={s.texto}>
        <p className="um-cuerpo">{t('acerca.proyecto')}</p>
        <p className={`${s.secundario} um-etiqueta`}>{t('acerca.programa')}</p>
      </section>
      <section className={s.texto} aria-labelledby="creditos-titulo">
        <h2 id="creditos-titulo" className="um-cuerpo-fuerte">
          {t('creditos.titulo')}
        </h2>
        <ul className={`${s.listaTexto} um-cuerpo`}>
          <li>{t('creditos.mapa')}</li>
          <li>{t('creditos.clima')}</li>
          <li>{t('creditos.sol')}</li>
        </ul>
      </section>
      <p className={`${s.nota} um-etiqueta`}>{t('acerca.privacidad')}</p>
      {/* Para saber qué versión tiene abierta el teléfono (enlace de prueba o estable). */}
      <p className={`${s.nota} um-etiqueta`}>
        {t('acerca.version', { version: __APP_VERSION__, fecha: formatDateTime(new Date(__APP_BUILT__), language) })}
      </p>
    </Pagina>
  )
}
