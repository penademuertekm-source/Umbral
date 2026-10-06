import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Boton, Icono } from '../../componentes'
import { ARRIVAL_RADIUS_M, FAR_FROM_ROUTE_M, SIMULATION_SPEEDUP } from '../../config/recorrido'
import { ROUTE_PROFILES } from '../../config/rutas'
import { laHora } from '../../i18n/hora'
import { formatDistance, roundMinutes } from '../../i18n/numeros'
import { useT } from '../../i18n/useT'
import { MapaRutas } from '../../mapa/MapaRutas'
import { abbreviate, indexEdges } from '../../mapa/tramos'
import type { LonLat } from '../../rutas/geometria'
import { buildLegs, guidanceAt, hasArrived, pointAt, type Guidance, type Maneuver } from '../../rutas/recorrido'
import { formatTime } from '../../sombra/tiempo'
import { formatHora } from '../useHoraElegida'
import { useVolver } from '../useVolver'
import { useEnlace } from '../rutas/enlaces'
import { NotaEstimado } from '../rutas/NotaEstimado'
import { useContextoRutas } from '../rutas/useContextoRutas'
import s from './RutaEnCurso.module.css'
import { useRutaRecorrido, useSeguimientoGps, useSimulacion } from './useRecorrido'

// Pantalla 13 (nodo 13:35): ruta en curso. Instrucción del tramo con la acera recomendada, aviso ámbar antes
// de un tramo expuesto, progreso y "Salir del recorrido". Con GPS sigue la posición (watchPosition); sin GPS,
// el modo simulación recorre la ruta solo. No se guarda el trazado y nunca se avisa "te desviaste".

const ROTATION: Record<Maneuver, number> = { recto: -90, izquierda: 180, derecha: 0 }

export function RutaEnCurso() {
  const i18n = useT()
  const { t, language } = i18n
  const navigate = useNavigate()
  const enlace = useEnlace()
  const [params] = useSearchParams()
  const ctx = useContextoRutas()
  const { data, graph, origen, ubicacion, gpsOutside, profile, context } = ctx
  const volver = useVolver(enlace('/rutas', { destino: params.get('destino') ?? undefined }))

  const destino = data?.destinos.find((d) => d.id === params.get('destino'))
  const nombre = destino ? (language === 'es' ? destino.nombre.es : destino.nombre.en) : ''
  const destKey = destino?.lat != null && destino.lon != null ? `${destino.lon},${destino.lat}` : ''
  const destination = useMemo((): LonLat | null => (destKey ? (destKey.split(',').map(Number) as LonLat) : null), [destKey])
  const mode = params.get('ruta') === 'corta' ? 'corta' : 'sombra'

  // El punto de partida queda fijo al empezar (con GPS, la posición sigue cambiando mientras se camina).
  const [origin, setOrigin] = useState<LonLat | null>(null)
  if (origin === null && origen) setOrigin(origen.point)

  // Modo: simulación (botón) o GPS (permiso concedido y dentro del centro). El recorrido real usa la hora
  // a la que se abrió esta pantalla; la simulación, la hora elegida en el deslizador.
  const [simulating, setSimulating] = useState(false)
  const [paused, setPaused] = useState(false)
  const [startedAt] = useState(() => new Date())
  const gpsActive = ubicacion.status === 'activa' && !gpsOutside
  const live = !simulating && gpsActive
  const time = live ? startedAt : ctx.hora.time

  const ruta = useRutaRecorrido({
    graph,
    origin,
    destination,
    mode,
    profile,
    time,
    context,
    thermalAt: ctx.thermalAt,
    forecastKey: ctx.forecast?.fetchedAt ?? 0,
  })
  const track = ruta?.track ?? null
  const speed = ROUTE_PROFILES[profile].speed
  const gps = useSeguimientoGps(track, live)
  const simulatedAlong = useSimulacion(track, simulating, paused, speed)
  const along = simulating ? simulatedAlong : (gps?.state.along ?? 0)
  const userPoint = track ? (simulating ? pointAt(track, along) : (gps?.point ?? null)) : null

  const edgeIndex = useMemo(() => (data ? indexEdges(data.red) : null), [data])
  const legs = useMemo(() => {
    if (!track || !graph || !edgeIndex) return []
    return buildLegs(track, graph, (edge) => edgeIndex.byId.get(edge)?.properties.nombre ?? '')
  }, [track, graph, edgeIndex])
  const guidance = track ? guidanceAt(track, legs, along, ROUTE_PROFILES[profile]) : null
  const streetName = (edge: number) => abbreviate(edgeIndex?.byId.get(edge)?.properties.nombre ?? '')

  // Llegada (pantalla 22): a menos de 25 m del destino o al final de la simulación.
  const arrived =
    !!track &&
    !!destination &&
    (simulating
      ? along >= track.route.meters
      : !!gps && hasArrived(track, gps.state, gps.point, destination, ARRIVAL_RADIUS_M))
  useEffect(() => {
    if (!arrived || !ruta || !destino) return
    const summary = {
      destino: destino.id,
      min: String(roundMinutes(ruta.route.minutes)),
      sombra: String(Math.round(ruta.route.shadePercent)),
      evitado: String(Math.max(0, Math.round(ruta.shortest.sunMinutes - ruta.route.sunMinutes))),
      nivel: ruta.level ?? undefined,
      hora: formatHora(Math.round((ruta.time.getTime() - ctx.hora.at(0).getTime()) / 60_000)),
      sim: simulating ? '1' : undefined,
    }
    navigate(enlace('/llegada', summary), { replace: true })
  }, [arrived]) // eslint-disable-line react-hooks/exhaustive-deps

  const startSimulation = () => {
    setPaused(false)
    setSimulating(true)
  }

  // Sin destino o sin punto de partida no hay recorrido.
  if (data && (!destino || !destination)) return <SinRuta mensaje={t('recorrido.destinoDesconocido')} enlace={enlace('/buscar')} />
  if (data && !origen && !origin && ubicacion.status !== 'buscando' && !simulating) {
    return <SinRuta mensaje={t('origen.falta')} enlace={enlace('/buscar')} />
  }
  if (ruta === null) return <SinRuta mensaje={t('rutas.sinRuta')} enlace={enlace('/buscar')} />

  const gpsMessage =
    ubicacion.status === 'insegura'
      ? t('recorrido.insegura')
      : ubicacion.status === 'denegada'
        ? t('recorrido.denegada')
        : ubicacion.status === 'no_disponible'
          ? t('recorrido.noDisponible')
          : gpsOutside
            ? t('origen.fueraDelCentro')
            : ubicacion.status === 'buscando'
              ? t('recorrido.buscando')
              : ''
  const far = live && gps && !gps.state.onRoute && gps.state.along === 0 && gps.state.distance > FAR_FROM_ROUTE_M

  return (
    <div className={s.pantalla}>
      {guidance ? <Banda guidance={guidance} streetName={streetName} /> : <div className={s.banda} />}

      <div className={s.mapa}>
        {data && ruta && origin && destination && (
          <MapaRutas
            data={data}
            shaded={mode === 'sombra' ? ruta.route : null}
            shortest={mode === 'corta' ? ruta.route : null}
            selected={mode}
            destination={destination}
            origin={userPoint ? null : origin}
            user={userPoint}
            follow={!!userPoint}
            label={t('recorrido.mapa', { destino: nombre })}
          />
        )}
        {!ruta && <p className={`${s.estado} um-cuerpo`}>{t('recorrido.calculando')}</p>}
        {simulating && (
          <div className={s.simulacion}>
            <span className="um-etiqueta">{t('recorrido.simulacion', { hora: formatTime(time, language) })}</span>
            <button type="button" className={`${s.pausa} um-etiqueta`} onClick={() => setPaused((p) => !p)} aria-pressed={paused}>
              {paused ? t('recorrido.continuar') : t('recorrido.pausar')}
            </button>
          </div>
        )}
      </div>

      {guidance?.exposed && !far && <AvisoExpuesto exposed={guidance.exposed} speed={speed} />}

      <section className={s.panel}>
        {!simulating && !live && (
          <div className={s.tarjeta}>
            <p className="um-cuerpo-fuerte">{t('recorrido.gpsTitulo')}</p>
            <p className={`${s.secundario} um-etiqueta`}>{t('recorrido.gpsTexto')}</p>
            {gpsMessage && (
              <p className="um-etiqueta" role="status">
                {gpsMessage}
              </p>
            )}
            {(ubicacion.status === 'inactiva' || ubicacion.status === 'no_disponible') && (
              <Boton variant="secundario" icon="mi-ubicacion" onClick={() => ubicacion.start()}>
                {t('origen.usarUbicacion')}
              </Boton>
            )}
            <Boton variant="secundario" onClick={startSimulation} disabled={!track}>
              {t('recorrido.simular')}
            </Boton>
          </div>
        )}
        {far && gps && (
          <div className={s.tarjeta}>
            <p className="um-etiqueta" role="status">
              {t('recorrido.lejos', { distancia: formatDistance(gps.state.distance, language) })}
            </p>
            <Boton variant="secundario" onClick={startSimulation}>
              {t('recorrido.simular')}
            </Boton>
          </div>
        )}
        {guidance && (simulating || live) && <Progreso guidance={guidance} shadePercent={ruta?.route.shadePercent ?? 0} />}
        {simulating && (
          <p className={`${s.secundario} um-micro`}>
            {t('recorrido.simulacionNota', { x: SIMULATION_SPEEDUP, laHora: laHora(i18n, time) })}
          </p>
        )}
        <NotaEstimado time={time} provisional={!!data?.meta.datos_provisionales} />
        <Boton variant="secundario" onClick={volver}>
          {t('recorrido.salir')}
        </Boton>
      </section>
    </div>
  )
}

/** Banda verde con la instrucción del tramo actual y la flecha. */
function Banda({ guidance, streetName }: { guidance: Guidance; streetName: (edge: number) => string }) {
  const { t, language } = useT()
  const { leg, next } = guidance
  const distancia = formatDistance(guidance.toLegEnd, language)
  const acera = (orientation: string | null) => (orientation ? t(`recorrido.orientaciones.${orientation as 'norte'}`) : '')
  let title: string
  let detail: string
  let arrow: Maneuver = 'recto'
  if (leg.kind === 'acera') {
    title = t('recorrido.sigue', { acera: acera(leg.orientation) })
    const calle = next ? streetName(next.edge) : ''
    detail = !next
      ? t('recorrido.hastaDestino', { distancia })
      : calle
        ? t('recorrido.hastaEsquina', { distancia, calle })
        : t('recorrido.hastaProxima', { distancia })
  } else {
    const calle = streetName(leg.edge)
    title = calle ? t('recorrido.cruza', { calle }) : t('recorrido.cruzaSinNombre')
    detail = next?.kind === 'acera' ? t('recorrido.luego', { acera: acera(next.orientation) }) : t('recorrido.hastaDestino', { distancia })
    arrow = leg.maneuver
  }
  return (
    <header className={s.banda}>
      <div className={s.instruccion}>
        <span className={`${s.claro} um-micro`}>{t('recorrido.ahora')}</span>
        <h1 className="um-titulo" aria-live="polite">
          {title}
        </h1>
        <p className={`${s.claro} um-etiqueta`}>{detail}</p>
      </div>
      <span className={s.flecha} role="img" aria-label={t(`recorrido.flecha.${arrow}`)} style={{ rotate: `${ROTATION[arrow]}deg` }}>
        <Icono name="avanzar" size={48} />
      </span>
    </header>
  )
}

/** Aviso ámbar: 150 m antes de un tramo expuesto, o mientras se lo recorre. */
function AvisoExpuesto({ exposed, speed }: { exposed: NonNullable<Guidance['exposed']>; speed: number }) {
  const { t, language } = useT()
  const seconds = exposed.length / speed
  const tiempo = seconds < 90 ? t('recorrido.segundos', { n: Math.max(5, Math.round(seconds / 5) * 5) }) : t('recorrido.minutos', { n: roundMinutes(seconds / 60) })
  const largo = formatDistance(exposed.length, language)
  return (
    <div className={s.expuesto} role="status">
      <Icono name="expuesto" />
      <div>
        <p className="um-cuerpo-fuerte">
          {exposed.ahead > 0 ? t('recorrido.avisoExpuesto', { distancia: formatDistance(exposed.ahead, language) }) : t('recorrido.enExpuesto')}
        </p>
        <p className="um-etiqueta">{exposed.ahead > 0 ? t('recorrido.sinSombra', { largo, tiempo }) : t('recorrido.hastaSombra', { largo })}</p>
      </div>
    </div>
  )
}

function Progreso({ guidance, shadePercent }: { guidance: Guidance; shadePercent: number }) {
  const { t, language } = useT()
  const percent = Math.round(guidance.progress * 100)
  return (
    <div className={s.tarjeta}>
      <p className="um-subtitulo">{t('recorrido.restantes', { n: roundMinutes(guidance.remainingMinutes) })}</p>
      <p className={`${s.secundario} um-etiqueta`}>
        {t('recorrido.progreso', { distancia: formatDistance(guidance.remainingMeters, language), p: Math.round(shadePercent) })}
      </p>
      <div
        className={s.barra}
        role="progressbar"
        aria-label={t('recorrido.progresoEtiqueta')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <span className={s.relleno} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function SinRuta({ mensaje, enlace }: { mensaje: string; enlace: string }) {
  const { t } = useT()
  return (
    <main className={s.vacio}>
      <p className="um-cuerpo">{mensaje}</p>
      <Link className={`${s.enlace} um-cuerpo-fuerte`} to={enlace}>
        {t('rutas.verDestinos')}
      </Link>
    </main>
  )
}
