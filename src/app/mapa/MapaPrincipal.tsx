import { useEffect, useId, useMemo, useState, type CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { BarraSuperior, Boton, Icono, MuestraTramo } from '../../componentes'
import { SEGMENT_STATES } from '../../config/niveles'
import { laHora } from '../../i18n/hora'
import { useT } from '../../i18n/useT'
import { loadMapData, type MapData } from '../../mapa/datos'
import { MapaSombra } from '../../mapa/MapaSombra'
import { indexEdges, treesByEdge } from '../../mapa/tramos'
import { useUbicacion } from '../../mapa/useUbicacion'
import { formatTime, localDate, localParts, minutesOfDay } from '../../sombra/tiempo'
import { useSombra } from '../../sombra/useSombra'
import { FichaTramo } from './FichaTramo'
import s from './MapaPrincipal.module.css'

// Pantalla 04 (nodo 3:2): mapa de sombra del centro a la hora del deslizador.
// El semáforo y el UTCI llegan en la Fase 5; por ahora el chip es un valor fijo y el UTCI dice "—".

const MIN_MINUTE = 6 * 60
const MAX_MINUTE = 18 * 60
const STEP_MIN = 15
/** Espera antes de recalcular mientras se arrastra el deslizador. */
const DEBOUNCE_MS = 80
/** Cada cuánto se revisa la hora real mientras el usuario no mueve el deslizador. */
const CLOCK_MS = 30_000

function clampToQuarter(minute: number): number {
  const quarter = Math.floor(minute / STEP_MIN) * STEP_MIN
  return Math.min(MAX_MINUTE, Math.max(MIN_MINUTE, quarter))
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms)
    return () => window.clearTimeout(id)
  }, [value, ms])
  return debounced
}

export function MapaPrincipal() {
  const i18n = useT()
  const { t, language } = i18n
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const sliderId = useId()

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

  // Hora: sigue la hora real (al cuarto de hora) hasta que el usuario mueve el deslizador.
  const [now, setNow] = useState(() => new Date())
  const [chosenMinute, setChosenMinute] = useState<number | null>(null)
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), CLOCK_MS)
    return () => window.clearInterval(id)
  }, [])
  const minute = chosenMinute ?? clampToQuarter(minutesOfDay(now))
  const shadeMinute = useDebounced(minute, DEBOUNCE_MS)
  const { year, month, day } = localParts(now)
  const at = (m: number) => localDate(year, month, day, Math.floor(m / 60), m % 60)
  const shownTime = at(minute)
  // useSombra solo depende del instante (número), así que un Date nuevo en cada render no recalcula.
  const shadeTime = at(shadeMinute)
  const sombra = useSombra(shadeTime)
  const resultado = sombra.resultado

  // Tramo elegido: va en la URL (?tramo=<id>) para poder enlazarlo y para que "atrás" funcione igual.
  const edgeIndex = useMemo(() => (data ? indexEdges(data.red) : null), [data])
  const trees = useMemo(() => (data ? treesByEdge(data.red, data.arboles) : null), [data])
  const rawEdge = params.get('tramo')
  const selected = rawEdge && /^\d+$/.test(rawEdge) && edgeIndex?.byId.has(Number(rawEdge)) ? Number(rawEdge) : null
  const select = (edge: number) => setParams({ tramo: String(edge) }, { replace: true })
  const close = () => setParams({}, { replace: true })

  // Ubicación: solo con permiso; el botón la pide y centra el mapa.
  const ubicacion = useUbicacion()
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

  return (
    <div className={s.pantalla}>
      <BarraSuperior time={formatTime(shownTime, language)} level="precaucion" />

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
            {data?.meta.datos_provisionales ? (
              <details className={s.provisional}>
                <summary>
                  <span className={`${s.chip} um-etiqueta`}>
                    <Icono name="informacion" size={20} />
                    {t('mapa.provisional')}
                  </span>
                </summary>
                <p className={`${s.globo} um-etiqueta`}>{t('mapa.provisionalDetalle')}</p>
              </details>
            ) : (
              <span />
            )}
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
              {locationMessage && (
                <p className={`${s.globo} um-etiqueta`} role="status">
                  {locationMessage}
                </p>
              )}
            </div>
          </div>

          <div className={s.abajo}>
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
            <p className={`${s.atribucion} um-micro`}>{t('mapa.atribucion')}</p>
          </div>
        </div>

        <section className={s.panel}>
          <label htmlFor={sliderId} className={`${s.panelTitulo} um-etiqueta`}>
            {t('mapa.otraHora')}
          </label>
          <input
            id={sliderId}
            className={s.deslizador}
            type="range"
            min={MIN_MINUTE}
            max={MAX_MINUTE}
            step={STEP_MIN}
            value={minute}
            onChange={(e) => setChosenMinute(Number(e.target.value))}
            aria-valuetext={formatTime(shownTime, language)}
            style={{ '--progreso': `${progress}%` } as CSSProperties}
          />
          <div className={`${s.eje} um-micro`} aria-hidden="true">
            <span>{formatTime(at(MIN_MINUTE), language)}</span>
            <span>{formatTime(at(MAX_MINUTE), language)}</span>
          </div>
        </section>

        <div className={s.acciones}>
          <Boton onClick={() => navigate('/buscar')}>{t('mapa.buscarRuta')}</Boton>
        </div>
      </main>

      {selected !== null && data && edgeIndex && trees && resultado && (
        <FichaTramo
          edge={selected}
          data={data}
          index={edgeIndex}
          trees={trees}
          resultado={resultado}
          onClose={close}
        />
      )}
    </div>
  )
}
