import { Link } from 'react-router'
import { BarraInferior, Encabezado, Icono } from '../../componentes'
import type { TranslationKey } from '../../i18n/traducir'
import { useT } from '../../i18n/useT'
import { usePerfil } from '../../perfil/usePerfil'
import s from './Perfil.module.css'

// Perfil (S0 y S1, Figma 143:1977): la cuarta pestaña de la barra inferior. Sin registro ni contraseña: todo
// lo de aquí vive solo en el teléfono.

const APP_LINKS: { path: string; label: TranslationKey }[] = [
  { path: '/ajustes', label: 'miPerfil.ajustes' },
  { path: '/perfil/como-leer', label: 'miPerfil.comoLeer' },
  { path: '/perfil/como-se-calcula', label: 'miPerfil.comoSeCalcula' },
  { path: '/perfil/acerca', label: 'miPerfil.acerca' },
]

export function Perfil() {
  const { t } = useT()
  const profile = usePerfil()
  return (
    <div className={s.pantalla}>
      <Encabezado title={t('miPerfil.titulo')} />
      <main className={s.contenido}>
        <div className={s.tarjeta}>
          <div className={s.fila}>
            <span className={s.icono} aria-hidden="true">
              <Icono name="perfil" />
            </span>
            <span className={s.textos}>
              <span className="um-cuerpo-fuerte">
                {profile.name ? `${t('miPerfil.hola')}, ${profile.name}` : t('miPerfil.hola')}
              </span>
              {!profile.name && <span className={`${s.secundario} um-etiqueta`}>{t('miPerfil.agregarNombre')}</span>}
            </span>
          </div>
        </div>

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
    </div>
  )
}
