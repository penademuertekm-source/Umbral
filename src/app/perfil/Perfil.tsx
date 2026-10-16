import { useState } from 'react'
import { Link } from 'react-router'
import { BarraInferior, Encabezado, Icono } from '../../componentes'
import type { TranslationKey } from '../../i18n/traducir'
import { useT } from '../../i18n/useT'
import { usePerfil } from '../../perfil/usePerfil'
import { formatTime } from '../../sombra/tiempo'
import { useMapData } from '../rutas/useContextoRutas'
import { HojaNombre } from './HojaNombre'
import { destinationIcon } from './lugares'
import { tripNames } from './salidas/comun'
import s from './Perfil.module.css'

// Perfil (S0 y S1, Figma 143:1977): la cuarta pestaña de la barra inferior. Sin registro ni contraseña: todo
// lo de aquí vive solo en el teléfono. Logros (S3) llega en el paso P3.

/** Lugares que se ven en Perfil; el resto, en "Ver todos mis lugares". */
const PREVIEW_PLACES = 2

const APP_LINKS: { path: string; label: TranslationKey }[] = [
  { path: '/ajustes', label: 'miPerfil.ajustes' },
  { path: '/perfil/como-leer', label: 'miPerfil.comoLeer' },
  { path: '/perfil/como-se-calcula', label: 'miPerfil.comoSeCalcula' },
  { path: '/perfil/acerca', label: 'miPerfil.acerca' },
]

export function Perfil() {
  const { t, language } = useT()
  const profile = usePerfil()
  const { data } = useMapData()
  const [editingName, setEditingName] = useState(false)
  const destino = (id: string) => data?.destinos.find((d) => d.id === id)
  const next = profile.trips[0]

  return (
    <div className={s.pantalla}>
      <Encabezado title={t('miPerfil.titulo')} />
      <main className={s.contenido}>
        <div className={s.tarjeta}>
          <button type="button" className={s.fila} onClick={() => setEditingName(true)}>
            <span className={s.icono} aria-hidden="true">
              <Icono name="perfil" />
            </span>
            <span className={s.textos}>
              <span className="um-cuerpo-fuerte">
                {profile.name ? t('miPerfil.holaNombre', { nombre: profile.name }) : t('miPerfil.hola')}
              </span>
              <span className={`${s.secundario} um-etiqueta`}>
                {profile.name ? t('miPerfil.cambiarNombre') : t('miPerfil.agregarNombre')}
              </span>
            </span>
            <Icono name="avanzar" className={s.flecha} />
          </button>
        </div>

        <h2 className={`${s.grupo} um-etiqueta`}>{t('miPerfil.misLugares')}</h2>
        <ul className={s.tarjeta}>
          {profile.places.slice(0, PREVIEW_PLACES).map((place) => {
            const real = destino(place.destinationId)
            return (
              <li key={place.id}>
                <Link className={s.fila} to={`/rutas?destino=${encodeURIComponent(place.destinationId)}`}>
                  <span className={s.icono} aria-hidden="true">
                    <Icono name={destinationIcon(real)} />
                  </span>
                  <span className={s.textos}>
                    <span className="um-cuerpo-fuerte">{place.name}</span>
                    {real && (
                      <span className={`${s.secundario} um-etiqueta`}>
                        {language === 'es' ? real.nombre.es : real.nombre.en}
                      </span>
                    )}
                  </span>
                  <Icono name="avanzar" className={s.flecha} />
                </Link>
              </li>
            )
          })}
          <li>
            <Link className={s.fila} to="/perfil/lugares">
              <span className={`${s.textos} um-cuerpo`}>
                {profile.places.length > 0 ? t('miPerfil.verTodos') : t('miPerfil.sinLugares')}
              </span>
              {profile.places.length > 0 && <span className={`${s.cuenta} um-etiqueta`}>{profile.places.length}</span>}
              <Icono name="avanzar" className={s.flecha} />
            </Link>
          </li>
        </ul>

        <h2 className={`${s.grupo} um-etiqueta`}>{t('miPerfil.planear')}</h2>
        <ul className={s.tarjeta}>
          <li>
            <Link className={s.fila} to="/perfil/salidas">
              <span className={s.textos}>
                <span className="um-cuerpo">{t('miPerfil.misSalidas')}</span>
                <span className={`${s.secundario} um-etiqueta`}>
                  {next
                    ? t('miPerfil.salidasProxima', {
                        hora: formatTime(new Date(next.departure), language),
                        nombre: tripNames(next, profile, data?.destinos, language).name,
                      })
                    : t('miPerfil.salidasNinguna')}
                </span>
              </span>
              <Icono name="avanzar" className={s.flecha} />
            </Link>
          </li>
          <li>
            <div className={`${s.fila} ${s.inactiva}`}>
              <span className={s.textos}>
                <span className="um-cuerpo">{t('miPerfil.logros')}</span>
                <span className={`${s.secundario} um-etiqueta`}>{t('miPerfil.proximamente')}</span>
              </span>
            </div>
          </li>
        </ul>

        <h2 className={`${s.grupo} um-etiqueta`}>{t('miPerfil.laApp')}</h2>
        <ul className={s.tarjeta}>
          {APP_LINKS.map(({ path, label }) => (
            <li key={path}>
              <Link className={s.fila} to={path}>
                <span className={`${s.textos} um-cuerpo`}>{t(label)}</span>
                <Icono name="avanzar" className={s.flecha} />
              </Link>
            </li>
          ))}
        </ul>
        <p className={`${s.nota} um-etiqueta`}>{t('miPerfil.guardadoLocal')}</p>
      </main>
      <BarraInferior active="perfil" />
      {editingName && <HojaNombre open current={profile.name} onClose={() => setEditingName(false)} />}
    </div>
  )
}
