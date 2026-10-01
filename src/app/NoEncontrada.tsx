import { Link } from 'react-router'
import { Encabezado } from '../componentes'
import { useT } from '../i18n/useT'
import s from './PantallaPendiente.module.css'

export function NoEncontrada() {
  const { t } = useT()
  return (
    <>
      <Encabezado title={t('pantallas.noEncontrada')} />
      <main className={s.contenido}>
        <Link className="um-cuerpo-fuerte" to="/">
          {t('pantallas.irInicio')}
        </Link>
      </main>
    </>
  )
}
