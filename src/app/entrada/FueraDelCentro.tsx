import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { Boton, Icono, Logotipo } from '../../componentes'
import b from '../../componentes/Boton/Boton.module.css'
import { formatDistance } from '../../i18n/numeros'
import { useT } from '../../i18n/useT'
import { loadMapData, metersBetween, type MapData } from '../../mapa/datos'
import { useUbicacion } from '../../mapa/useUbicacion'
import type { LonLat } from '../../rutas/geometria'
import { useHorasAviso } from '../recorrido/horasAviso'
import s from './Entrada.module.css'
import { googleMapsDirections, googleMapsDirectionsTo, markOnboardingDone, schemeLayout } from './entrada'

// Pantalla 21 (nodo 35:35): la ubicación está fuera del área de estudio. Esquema con la distancia (no a
// escala), consejo de llegar en taxi en las horas de más calor, indicaciones en Google Maps (enlace
// universal, sin clave) y explorar el centro sin ubicación. La posición llega en el estado de la navegación
// (nunca en la dirección) o del GPS, y no se guarda.
// 05-1: con ?destino=<id> (un destino fuera del mapa de sombra, desde la 05) el esquema va de la plaza al
// lugar y "Cómo llegar" abre Google Maps buscando el lugar por su nombre.

/** Manzanas del fondo del esquema (viewBox 342 × 250). */
const BLOCKS = [0, 1, 2, 3].flatMap((row) => [0, 1, 2, 3, 4].map((col) => ({ x: 8 + col * 68, y: 8 + row * 62 })))

export function FueraDelCentro() {
  const { t, language } = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const [data, setData] = useState<MapData | null>(null)
  useEffect(() => {
    let vigente = true
    loadMapData()
      .then((loaded) => vigente && setData(loaded))
      .catch(() => undefined)
    return () => {
      vigente = false
    }
  }, [])
  const ubicacion = useUbicacion()
  const horas = useHorasAviso()

  const [params] = useSearchParams()
  const destino = data?.destinos.find((d) => d.id === params.get('destino'))
  const destinoNombre = destino ? (language === 'es' ? destino.nombre.es : destino.nombre.en) : ''
  const destinoPoint: LonLat | null = destino?.lat != null && destino.lon != null ? [destino.lon, destino.lat] : null
  const fromState = (location.state as { point?: LonLat } | null)?.point ?? null
  const point = destinoPoint ?? fromState ?? ubicacion.position
  const center = data?.meta.area.centro ?? null
  const meters = point && center ? metersBetween(center, point) : null
  const layout = center ? schemeLayout(center, point) : null
  const distancia = meters !== null ? formatDistance(meters, language) : ''

  const explore = () => {
    markOnboardingDone()
    navigate('/mapa', { replace: true })
  }

  return (
    <main className={s.pagina}>
      <Logotipo size={44} withWord={false} />
      <div
        className={s.esquema}
        role="img"
        aria-label={
          destino
            ? t('fuera.destinoEsquema', { destino: destinoNombre, distancia })
            : distancia
              ? t('fuera.esquema', { distancia })
              : t('fuera.esquemaSinDistancia')
        }
      >
        {layout && (
          <>
            <svg viewBox="0 0 342 250" preserveAspectRatio="none" aria-hidden="true">
              {BLOCKS.map((block) => (
                <rect key={`${block.x}-${block.y}`} className={s.manzana} x={block.x} y={block.y} width={56} height={50} rx={4} />
              ))}
              {layout.user && (
                <line
                  className={s.linea}
                  x1={(layout.center.x / 100) * 342}
                  y1={(layout.center.y / 100) * 250}
                  x2={(layout.user.x / 100) * 342}
                  y2={(layout.user.y / 100) * 250}
                />
              )}
              <ellipse className={s.zona} cx={(layout.center.x / 100) * 342} cy={(layout.center.y / 100) * 250} rx={62} ry={48} />
              {layout.user && <circle className={s.persona} cx={(layout.user.x / 100) * 342} cy={(layout.user.y / 100) * 250} r={9} />}
            </svg>
            <span className={`${s.etiqueta} ${s.etiquetaCentro} um-etiqueta`} style={{ left: `${layout.center.x}%`, top: `calc(${layout.center.y}% + 52px)` }}>
              {t('fuera.centro')}
            </span>
            {layout.user && (
              <span className={`${s.etiqueta} um-etiqueta`} style={{ left: `${layout.user.x}%`, top: `calc(${layout.user.y}% + 16px)` }}>
                {destino
                  ? t('fuera.destinoEtiqueta', { destino: destinoNombre, distancia })
                  : distancia
                    ? t('fuera.tu', { distancia })
                    : t('fuera.tuSinDistancia')}
              </span>
            )}
          </>
        )}
      </div>
      <h1 className="um-titulo">{destino ? t('fuera.destinoTitulo', { destino: destinoNombre }) : t('fuera.titulo')}</h1>
      <p className={`${s.secundario} um-cuerpo`}>{destino ? t('fuera.destinoTexto') : t('fuera.texto')}</p>
      <div className={s.consejo}>
        <span className={s.consejoIcono} aria-hidden="true">
          <Icono name="expuesto" />
        </span>
        <p className="um-etiqueta">{t(destino ? 'fuera.destinoConsejo' : 'fuera.consejo', horas)}</p>
      </div>
      <div className={s.botones}>
        {destino ? (
          <a
            className={`${b.boton} ${b.primario} ${b.ancho} ${s.enlaceBoton} um-cuerpo-fuerte`}
            href={googleMapsDirectionsTo(`${destino.nombre.es}, Valledupar`)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('fuera.destinoComoLlegar', { destino: destinoNombre })}
          </a>
        ) : (
          center && (
            <a
              className={`${b.boton} ${b.primario} ${b.ancho} ${s.enlaceBoton} um-cuerpo-fuerte`}
              href={googleMapsDirections(center)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('fuera.comoLlegar')}
            </a>
          )
        )}
        <p className={`${s.secundario} um-micro`}>{t('fuera.abreMaps')}</p>
        {destino ? (
          <Boton variant="secundario" onClick={() => navigate(-1)}>
            {t('fuera.volverDestinos')}
          </Boton>
        ) : (
          <Boton variant="secundario" onClick={explore}>
            {t('fuera.explorar')}
          </Boton>
        )}
      </div>
    </main>
  )
}
