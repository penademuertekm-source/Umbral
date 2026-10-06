import { useCallback, useEffect, useId, useMemo, useState, type CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { BarraSuperior, Boton, Icono, MuestraTramo } from '../../componentes'
import { readHeatProfile } from '../../clima/configClima'
import { simulateOvercast, thermalStateAt, type ThermalContext } from '../../clima/estado'
import { rainOutlook } from '../../clima/openMeteo'
import { useClima, useClimaConfig } from '../../clima/useClima'
import { SEGMENT_STATES } from '../../config/niveles'
import { ISOCHRONE_BANDS_MIN } from '../../config/rutas'
import { laHora } from '../../i18n/hora'
import { useT } from '../../i18n/useT'
import { insideArea, loadMapData, type MapData } from '../../mapa/datos'
import { MapaSombra } from '../../mapa/MapaSombra'
import { indexEdges, treesByEdge } from '../../mapa/tramos'
import { snap } from '../../rutas/grafo'
import { isochrones } from '../../rutas/isocronas'
import { formatDateTime, formatTime, isoLocalDate } from '../../sombra/tiempo'
import { useSombra } from '../../sombra/useSombra'
import { AvisoElNino } from '../elnino/AvisoElNino'
import { markElNinoSeen, seenElNinoToday } from '../elnino/visto'
import { costModel, useGraph } from '../rutas/useContextoRutas'
import { formatDesde, parseDesde, useOrigen } from '../rutas/useOrigen'
import { MAX_MINUTE, MIN_MINUTE, STEP_MIN, useHoraElegida } from '../useHoraElegida'
import { AvisoNublado } from './AvisoNublado'
import { FichaTramo } from './FichaTramo'
import s from './MapaPrincipal.module.css'

// Pantalla 04 (nodo 3:2): mapa de sombra del centro a la hora del deslizador, con el semáforo y el UTCI
// estimados para esa hora (Fase 5). Con el cielo cubierto pasa al estado nublado (pantalla 20) y, si El Niño
// está activo, muestra una vez al día la pantalla 09. Fase 6: capa de isócronas y modo "elegir el punto de
// partida" (?elegir=1&volver=/buscar).

/** Espera antes de recalcular mientras se arrastra el deslizador. */
const DEBOUNCE_MS = 80

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms)
    return () => window.clearTimeout(id)
  }, [value, ms])
  return debounced
}

interface MapaPrincipalProps {
  /** Ruta /mapa/nublado: simula el cielo cubierto (pantalla 20) con un aviso visible de simulación. */
  simulateCloudy?: boolean
}

export function MapaPrincipal({ simulateCloudy = false }: MapaPrincipalProps) {
  const i18n = useT()
  const { t, language } = i18n
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const sliderId = useId()
  /** Cambia parámetros de la dirección sin perder los demás (hora, punto de partida…). */
  const updateParams = useCallback(
    (changes: Record<string, string | null>) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(changes)) {
            if (value === null) next.delete(key)
            else next.set(key, value)
          }
          return next
        },
        { replace: true },
      ),
    [setParams],
  )

  // Datos del mapa (public/datos).
  const [data, setData] = useState<MapData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let vigente = true
    loadMapData()
      .then((loaded) => vigente && setData(loaded))
      .catch((error: unknown) => vigente && setLoadError(error instanceof Error ? error.message : String(error)))
    return () => {
      vigente = false
    }
  }, [attempt])

  // Hora: la del deslizador, compartida con las demás pantallas por ?hora=.
  const hora = useHoraElegida()
  const { minute, now, at } = hora
  const shadeMinute = useDebounced(minute, DEBOUNCE_MS)
  const shownTime = at(minute)
  // useSombra solo depende del instante (número), así que un Date nuevo en cada render no recalcula.
  const shadeTime = at(shadeMinute)
  const sombra = useSombra(shadeTime)
  const resultado = sombra.resultado

  // Clima (Open-Meteo) y semáforo para la hora del deslizador.
  const center = data?.meta.area.centro ?? null
  const clima = useClima(center)
  const climaConfig = useClimaConfig()
  const [profile] = useState(readHeatProfile)
  const forecast = clima.status === 'listo' ? clima.forecast : null
  const context: ThermalContext | null = center ? { center, elNino: climaConfig?.elNino ?? false, profile } : null
  const transform = simulateCloudy ? simulateOvercast : undefined
  const thermal = context ? thermalStateAt(forecast, shownTime, context, transform) : null
  const decision = thermal?.decision ?? null
  const cloudy = decision?.cloudy ?? false
  const rain = cloudy && forecast ? rainOutlook(forecast, shownTime) : null
  const levelLabel = decision
    ? decision.level === 'nublado'
      ? t('semaforo.nubladoRiesgoBajo')
      : undefined
    : clima.status === 'cargando'
      ? t('semaforo.cargandoClima')
      : t('semaforo.sinClima')
  // Sin conexión se usa el pronóstico guardado y se dice de cuándo es.
  let weatherNote: string | undefined
  if (clima.status === 'listo' && clima.stale) {
    const fetched = new Date(clima.forecast.fetchedAt)
    weatherNote =
      isoLocalDate(fetched) === isoLocalDate(now)
        ? t('clima.datoDe', { laHora: laHora(i18n, fetched) })
        : t('clima.datoDel', { fecha: formatDateTime(fetched, language) })
  }

  const coveredPlaces = useMemo(
    () => data?.refugios.filter((r) => r.cubierto !== 'no' && r.lat !== null && r.lon !== null) ?? [],
    [data],
  )

  // Pantalla 09: una vez por día si El Niño está activo.
  const [elNinoClosed, setElNinoClosed] = useState(() => seenElNinoToday())

  // Modos del mapa (Fase 6): elegir el punto de partida o ver las isócronas.
  const picking = params.get('elegir') === '1'
  const showIsochrones = !picking && params.get('capa') === 'isocronas'
  const { origen, ubicacion, gpsOutside } = useOrigen(data?.meta ?? null)
  const [pickOutside, setPickOutside] = useState(false)
  const graph = useGraph(showIsochrones ? data : null)
  // La clave de texto evita recalcular cuando llega la misma posición en un objeto nuevo.
  const originKey = origen ? formatDesde(origen.point) : null
  const isochroneLayer = useMemo(() => {
    const point = parseDesde(originKey)
    if (!graph || !resultado || !point) return null
    const start = snap(graph, point)
    return start ? isochrones(graph, start, costModel(graph, resultado.fraction, 'sombra', profile), ISOCHRONE_BANDS_MIN) : null
  }, [graph, resultado, originKey, profile])
  const onMapClick = (point: [number, number]) => {
    if (!data) return
    if (!insideArea(data.meta, point)) {
      setPickOutside(true)
      return
    }
    setPickOutside(false)
    if (picking) {
      const back = params.get('volver') ?? '/buscar'
      const next = new URLSearchParams()
      for (const key of ['hora', 'destino']) {
        const value = params.get(key)
        if (value) next.set(key, value)
      }
      next.set('desde', formatDesde(point))
      navigate(`${back.startsWith('/') ? back : '/buscar'}?${next}`)
    } else {
      updateParams({ desde: formatDesde(point) })
    }
  }

  // Tramo elegido: va en la URL (?tramo=<id>) para poder enlazarlo y para que "atrás" funcione igual.
  const edgeIndex = useMemo(() => (data ? indexEdges(data.red) : null), [data])
  const trees = useMemo(() => (data ? treesByEdge(data.red, data.arboles) : null), [data])
  const rawEdge = params.get('tramo')
  const selected =
    !picking && !showIsochrones && rawEdge && /^\d+$/.test(rawEdge) && edgeIndex?.byId.has(Number(rawEdge))
      ? Number(rawEdge)
      : null
  const select = (edge: number) => updateParams({ tramo: String(edge) })
  const close = () => updateParams({ tramo: null })
  // La ficha usa la misma hora que el cálculo de sombra que muestra.
  const fichaUtci =
    context && resultado ? thermalStateAt(forecast, new Date(resultado.time), context, transform).utci : null

  // Ubicación: solo con permiso; el botón la pide y centra el mapa.
  const [focusUser, setFocusUser] = useState(0)
  const locationMessage =
    ubicacion.status === 'denegada'
      ? t('mapa.ubicacionDenegada')
      : ubicacion.status === 'no_disponible'
        ? t('mapa.ubicacionNoDisponible')
        : ubicacion.status === 'buscando'
          ? t('mapa.ubicacionBuscando')
          : ''

  const progress = ((minute - MIN_MINUTE) / (MAX_MINUTE - MIN_MINUTE)) * 100
  const originLabel = origen?.kind === 'gps' ? t('origen.tuUbicacion') : t('origen.puntoElegido')

  return (
    <div className={s.pantalla}>
      <BarraSuperior
        time={formatTime(shownTime, language)}
        level={decision?.level ?? 'nublado'}
        levelLabel={levelLabel}
        utciSun={thermal?.utci?.sun ?? null}
        utciShade={thermal?.utci?.shade ?? null}
        note={weatherNote}
      />

      <main className={s.principal}>
        <div className={s.mapaZona}>
          {data && (
            <MapaSombra
              data={data}
              resultado={resultado}
              selectedEdge={selected}
              onSelect={select}
              user={ubicacion.position}
              focusUser={focusUser}
              cloudy={cloudy}
              coveredPlaces={coveredPlaces}
              isochrones={showIsochrones ? isochroneLayer : null}
              onMapClick={picking || showIsochrones ? onMapClick : undefined}
              pin={(picking || showIsochrones) && origen?.kind === 'punto' ? origen.point : null}
            />
          )}

          <div className={s.estado} aria-live="polite">
            {loadError ? (
              <div className={s.aviso}>
                <p className="um-cuerpo">{t('mapa.error', { error: loadError })}</p>
                <Boton
                  variant="secundario"
                  onClick={() => {
                    setLoadError(null)
                    setAttempt((n) => n + 1)
                  }}
                >
                  {t('comun.reintentar')}
                </Boton>
              </div>
            ) : sombra.status === 'error' ? (
              <p className={`${s.aviso} um-cuerpo`}>{t('mapa.error', { error: sombra.error })}</p>
            ) : (
              (!data || !resultado) && <p className={`${s.aviso} um-cuerpo`}>{t('mapa.cargando')}</p>
            )}
          </div>

          <div className={s.arriba}>
            {picking ? (
              <div className={s.tarjetaModo} role="status">
                <p className="um-cuerpo-fuerte">{t('origen.elegirTitulo')}</p>
                {pickOutside && <p className={`${s.secundario} um-etiqueta`}>{t('origen.elegirFuera')}</p>}
                <Boton variant="secundario" onClick={() => navigate(-1)}>
                  {t('comun.cancelar')}
                </Boton>
              </div>
            ) : (
              <>
                <div className={s.filaArriba}>
                  <div className={s.chips}>
                    {simulateCloudy && (
                      <details className={s.desplegable}>
                        <summary>
                          <span className={`${s.chip} ${s.chipSimulacion} um-etiqueta`}>
                            <Icono name="nublado" size={20} />
                            {t('mapa.simulacion')}
                          </span>
                        </summary>
                        <p className={`${s.globo} um-etiqueta`}>{t('mapa.simulacionDetalle')}</p>
                      </details>
                    )}
                    {data?.meta.datos_provisionales && (
                      <details className={s.desplegable}>
                        <summary>
                          <span className={`${s.chip} um-etiqueta`}>
                            <Icono name="informacion" size={20} />
                            {t('mapa.provisional')}
                          </span>
                        </summary>
                        <p className={`${s.globo} um-etiqueta`}>{t('mapa.provisionalDetalle')}</p>
                      </details>
                    )}
                  </div>
                  <div className={s.ubicacion}>
                    <button
                      type="button"
                      className={s.botonFlotante}
                      aria-label={t('mapa.miUbicacion')}
                      onClick={() => {
                        ubicacion.start()
                        setFocusUser((n) => n + 1)
                      }}
                    >
                      <Icono name="mi-ubicacion" />
                    </button>
                    <button
                      type="button"
                      className={`${s.botonFlotante} ${showIsochrones ? s.botonActivo : ''}`}
                      aria-label={t('isocronas.boton')}
                      aria-pressed={showIsochrones}
                      onClick={() => updateParams({ capa: showIsochrones ? null : 'isocronas', tramo: null })}
                    >
                      <Icono name="capas" />
                    </button>
                    {locationMessage && (
                      <p className={`${s.globo} um-etiqueta`} role="status">
                        {locationMessage}
                      </p>
                    )}
                  </div>
                </div>
                {cloudy && !showIsochrones && (
                  <AvisoNublado rain={rain} hasCoveredPlaces={coveredPlaces.length > 0} />
                )}
              </>
            )}
          </div>

          <div className={s.abajo}>
            {showIsochrones ? (
              <div className={s.leyenda} role="group" aria-label={t('mapa.leyenda')}>
                <p className={`${s.leyendaHora} um-micro`}>
                  {origen
                    ? t('isocronas.titulo', { lugar: originLabel, hora: formatTime(shadeTime, language) })
                    : t('isocronas.tocar')}
                </p>
                {origen && (
                  <>
                    <div className={s.muestras}>
                      {ISOCHRONE_BANDS_MIN.map((n, i) => (
                        <span key={n} className={`${s.banda} um-etiqueta`}>
                          <svg width="28" height="12" viewBox="0 0 28 12" aria-hidden="true">
                            <line className={s[`banda${i + 1}`]} x1="2" y1="6" x2="26" y2="6" />
                          </svg>
                          {t('isocronas.banda', { n })}
                        </span>
                      ))}
                    </div>
                    <p className={`${s.leyendaHora} um-micro`}>
                      {gpsOutside ? t('origen.fueraDelCentro') : t('isocronas.nota')}
                    </p>
                  </>
                )}
              </div>
            ) : (
              !cloudy &&
              !picking && (
                <div className={s.leyenda} role="group" aria-label={t('mapa.leyenda')}>
                  <p className={`${s.leyendaHora} um-micro`}>
                    {t('mapa.horaElegida', { laHora: laHora(i18n, shadeTime) })}
                    {resultado?.noSun && ` · ${t('mapa.sinSol')}`}
                  </p>
                  <div className={s.muestras}>
                    {SEGMENT_STATES.map((state) => (
                      <MuestraTramo key={state} state={state} size="compacta" />
                    ))}
                  </div>
                </div>
              )
            )}
            <p className={`${s.atribucion} um-micro`}>
              {t('mapa.atribucion')} · {t('clima.atribucion')}
            </p>
          </div>
        </div>

        <section className={s.panel}>
          <label htmlFor={sliderId} className={`${s.panelTitulo} um-etiqueta`}>
            {t('mapa.otraHora')}
          </label>
          <input
            id={sliderId}
            className={`${s.deslizador} ${cloudy ? s.deslizadorNublado : ''}`}
            type="range"
            min={MIN_MINUTE}
            max={MAX_MINUTE}
            step={STEP_MIN}
            value={minute}
            onChange={(e) => hora.setMinute(Number(e.target.value))}
            aria-valuetext={formatTime(shownTime, language)}
            style={{ '--progreso': `${progress}%` } as CSSProperties}
          />
          <div className={`${s.eje} um-micro`} aria-hidden="true">
            <span>{formatTime(at(MIN_MINUTE), language)}</span>
            <span>{formatTime(at(MAX_MINUTE), language)}</span>
          </div>
        </section>

        <div className={s.acciones}>
          <Boton onClick={() => navigate(`/buscar?${new URLSearchParams(pickShared(params))}`)}>
            {cloudy ? t('mapa.buscarRutaSimple') : t('mapa.buscarRuta')}
          </Boton>
        </div>
      </main>

      {selected !== null && data && edgeIndex && trees && resultado && (
        <FichaTramo
          edge={selected}
          data={data}
          index={edgeIndex}
          trees={trees}
          resultado={resultado}
          utci={fichaUtci}
          onClose={close}
        />
      )}

      {climaConfig?.elNino && !elNinoClosed && !picking && (
        <AvisoElNino
          config={climaConfig}
          onClose={() => {
            markElNinoSeen()
            setElNinoClosed(true)
          }}
        />
      )}
    </div>
  )
}

/** Hora y punto de partida que viajan a la búsqueda. */
function pickShared(params: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {}
  for (const key of ['hora', 'desde']) {
    const value = params.get(key)
    if (value) out[key] = value
  }
  return out
}
