import { useState } from 'react'
import { useNavigate } from 'react-router'
import { BarraInferior, Boton, Encabezado, Modal } from '../../../componentes'
import { useT } from '../../../i18n/useT'
import { earnedStamps } from '../../../perfil/colecciones'
import { usePerfil } from '../../../perfil/usePerfil'
import { useMapData } from '../../rutas/useContextoRutas'
import { useVolver } from '../../useVolver'
import p from '../Perfil.module.css'
import s from './Colecciones.module.css'
import { dayMonth, passportPlaces, STAMP_FACTS, type StampPlace } from './comun'
import { Sello } from './Sello'

// Pasaporte del centro (S3, Figma 151:2661) y detalle del sello (151:2764). Un sello por destino y por el
// Parque de la Leyenda; se gana al llegar (22). "¿Sabías que…?" solo aparece si el lugar tiene su dato.

export function Pasaporte() {
  const { t, language } = useT()
  const navigate = useNavigate()
  const volver = useVolver('/perfil/logros')
  const profile = usePerfil()
  const { data } = useMapData()
  const places = passportPlaces(data, language)
  const stamps = earnedStamps(profile)
  const earned = places.filter((place) => stamps.has(place.id)).length
  const [open, setOpen] = useState<StampPlace | null>(null)
  const openDate = open ? stamps.get(open.id) : undefined
  const fact = open ? STAMP_FACTS[open.id] : undefined

  return (
    <div className={p.pantalla}>
      <Encabezado
        title={t('pasaporte.titulo')}
        subtitle={data ? t('pasaporte.cuenta', { n: earned, total: places.length }) : undefined}
        onBack={volver}
      />
      <main className={p.contenido}>
        <p className={`${p.secundario} um-etiqueta`}>{t('pasaporte.intro')}</p>
        <ul className={s.rejilla}>
          {places.map((place) => {
            const date = stamps.get(place.id)
            const content = (
              <>
                <Sello icon={place.icon} earned={!!date} />
                <span className={`${date ? '' : s.secundario} um-cuerpo-fuerte`}>{place.name}</span>
                <span className={`${date ? s.fecha : s.secundario} um-etiqueta`}>
                  {date ? dayMonth(date, language) : t('pasaporte.porDescubrir')}
                </span>
              </>
            )
            return (
              <li key={place.id}>
                {date ? (
                  <button
                    type="button"
                    className={s.celda}
                    aria-haspopup="dialog"
                    onClick={() => setOpen(place)}
                  >
                    {content}
                    <span className="sr-only">{t('pasaporte.verSello')}</span>
                  </button>
                ) : (
                  <div className={s.celda}>{content}</div>
                )}
              </li>
            )
          })}
        </ul>
      </main>
      <BarraInferior active="perfil" />

      <Modal
        sheet
        open={!!open}
        onClose={() => setOpen(null)}
        title={open?.name ?? ''}
        actions={
          open && data?.destinos.some((d) => d.id === open.id) ? (
            <Boton variant="secundario" onClick={() => navigate(`/rutas?destino=${encodeURIComponent(open.id)}`)}>
              {t('pasaporte.verMapa')}
            </Boton>
          ) : undefined
        }
      >
        {open && (
          <div className={s.detalle}>
            <Sello icon={open.icon} earned size={140} />
            {openDate && (
              <p className={`${s.fecha} um-etiqueta`}>{t('pasaporte.conseguidoEl', { fecha: dayMonth(openDate, language) })}</p>
            )}
            {fact && (
              <div className={s.dato}>
                <p className="um-cuerpo-fuerte">{t('pasaporte.sabias')}</p>
                <p className="um-cuerpo">{t(fact)}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
