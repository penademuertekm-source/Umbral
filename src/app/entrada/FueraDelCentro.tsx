import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Boton, Icono, Logotipo } from '../../componentes'
import b from '../../componentes/Boton/Boton.module.css'
import { formatDistance } from '../../i18n/numeros'
import { useT } from '../../i18n/useT'
import { loadMapData, metersBetween, type MapData } from '../../mapa/datos'
import { useUbicacion } from '../../mapa/useUbicacion'
import type { LonLat } from '../../rutas/geometria'
import { useHorasAviso } from '../recorrido/horasAviso'
import s from './Entrada.module.css'
import { googleMapsDirections, markOnboardingDone, schemeLayout } from './entrada'

// Pantalla 21 (nodo 35:35): la ubicación está fuera del área de estudio. Esquema con la distancia (no a
// escala), consejo de llegar en taxi en las horas de más calor, indicaciones en Google Maps (enlace
// universal, sin clave) y explorar el centro sin ubicación. La posición llega en el estado de la navegación
// (nunca en la dirección) o del GPS, y no se guarda.

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

  const fromState = (location.state as { point?: LonLat } | null)?.point ?? null
  const point = fromState ?? ubicacion.position
  const center = data?.meta.area.centro ?? null
  const meters = point && center ? metersBetween(center, point) : null
  const layout = useMemo(() => (center ? schemeLayout(center, point) : null), [center, point])
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
        aria-label={distancia ? t('fuera.esquema', { distancia }) : t('fuera.esquemaSinDistancia')}
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
                {distancia ? t('fuera.tu', { distancia }) : t('fuera.tuSinDistancia')}
              </span>
            )}
          </>
        )}
      </div>
      <h1 className="um-titulo">{t('fuera.titulo')}</h1>
      <p className={`${s.secundario} um-cuerpo`}>{t('fuera.texto')}</p>
      <div className={s.consejo}>
        <span className={s.consejoIcono} aria-hidden="true">
          <Icono name="expuesto" />
        </span>
        <p className="um-etiqueta">{t('fuera.consejo', horas)}</p>
      </div>
      <div className={s.botones}>
        {center && (
          <a
            className={`${b.boton} ${b.primario} ${b.ancho} ${s.enlaceBoton} um-cuerpo-fuerte`}
            href={googleMapsDirections(center)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('fuera.comoLlegar')}
          </a>
        )}
        <p className={`${s.secundario} um-micro`}>{t('fuera.abreMaps')}</p>
        <Boton variant="secundario" onClick={explore}>
          {t('fuera.explorar')}
        </Boton>
      </div>
    </main>
  )
}
