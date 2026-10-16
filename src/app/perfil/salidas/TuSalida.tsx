import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { BarraInferior, Boton, ChipEstimado, Encabezado, FormaSemaforo, Icono } from '../../../componentes'
import { readHeatProfile } from '../../../clima/configClima'
import niveles from '../../../estilos/niveles.module.css'
import { roundMinutes } from '../../../i18n/numeros'
import { useT } from '../../../i18n/useT'
import { arrivesInHeat } from '../../../rutas/agenda'
import type { LonLat } from '../../../rutas/geometria'
import { buildIcs, downloadIcs } from '../../../perfil/calendario'
import { markTripInCalendar, MAX_TRIPS, saveTrip } from '../../../perfil/almacen'
import { usePerfil } from '../../../perfil/usePerfil'
import { formatTime, TIME_ZONE } from '../../../sombra/tiempo'
import { useOrigen } from '../../rutas/useOrigen'
import { useGraph, useMapData } from '../../rutas/useContextoRutas'
import { useVolver } from '../../useVolver'
import s from '../Perfil.module.css'
import { dayOffset, destinationPoint, tripNames, usePlanSalida } from './comun'
import { routeLink } from './enlaces'

// Tu salida (S2, Figma 146:2724): a qué hora salir para llegar a tiempo por la ruta con más sombra. Las
// cifras son estimadas. La app no puede avisar con la pantalla apagada: por eso ofrece el calendario.

/** Alarma del evento de calendario, en minutos antes de la salida (especificación S2). */
const CALENDAR_ALARM_MIN = 10

export function TuSalida() {
  const { t, language } = useT()
  const navigate = useNavigate()
  const volver = useVolver('/perfil/salidas/nueva')
  const [params] = useSearchParams()
  const profile = usePerfil()
  const { data } = useMapData()
  const graph = useGraph(data)
  const [heatProfile] = useState(readHeatProfile)
  const { origen } = useOrigen(data?.meta ?? null)
  const [now] = useState(() => new Date())

  const destinationId = params.get('destino') ?? ''
  const placeId = params.get('lugar') || undefined
  const editing = profile.trips.find((trip) => trip.id === params.get('editar'))
  const arrivalValue = params.get('llegada')
  const arrival = arrivalValue && !Number.isNaN(Date.parse(arrivalValue)) ? new Date(arrivalValue) : null
  const destino = data?.destinos.find((d) => d.id === destinationId)
  // Al cambiar una salida guardada se conserva su punto de partida; si es nueva, el de ahora.
  const origin: LonLat | null = editing?.origin ?? origen?.point ?? null
  const plan = usePlanSalida(graph, origin, destinationPoint(destino), arrival, heatProfile)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [full, setFull] = useState(false)
  const names = tripNames({ destinationId, placeId }, profile, data?.destinos, language)

  const save = (inCalendar: boolean): string | null => {
    if (!plan || !origin || !arrival) return null
    const result = saveTrip({
      id: savedId ?? editing?.id,
      destinationId,
      placeId,
      origin,
      arrival: arrival.toISOString(),
      departure: plan.departure.toISOString(),
      inCalendar: inCalendar || !!editing?.inCalendar,
    })
    if (!result.ok) {
      setFull(true)
      return null
    }
    setSavedId(result.trip.id)
    return result.trip.id
  }

  const addToCalendar = () => {
    if (!plan || !origin) return
    const id = savedId ?? editing?.id ?? `${destinationId}-${plan.departure.getTime()}`
    const title = t('tuSalida.eventoTitulo', { nombre: names.name })
    downloadIcs(
      buildIcs({
        id,
        title,
        description: t('tuSalida.eventoTexto', { hora: formatTime(plan.arrival, language) }),
        start: plan.departure,
        end: plan.arrival,
        url: routeLink(destinationId, plan.departure, origin, true),
        alarmMin: CALENDAR_ALARM_MIN,
      }),
      'umbral-salida.ics',
    )
    if (savedId) markTripInCalendar(savedId)
  }

  const offset = arrival ? dayOffset(arrival, now) : 0
  const day = !arrival
    ? ''
    : offset === 0
      ? t('tuSalida.hoy')
      : offset === 1
        ? t('tuSalida.manana')
        : shortDay(arrival, language)
  const message = !origin
    ? t('origen.falta')
    : plan === null
      ? t('tuSalida.sinSalida')
      : plan === undefined || !data
        ? t('tuSalida.calculando')
        : null

  return (
    <div className={s.pantalla}>
      <Encabezado title={t('tuSalida.titulo')} onBack={volver} />
      <main className={s.contenido}>
        {data && <ChipEstimado time={day} provisional={data.meta.datos_provisionales} />}
        {message || !plan ? (
          <p className="um-cuerpo" role="status">
            {message}
          </p>
        ) : (
          <>
            <section className={s.salida} aria-live="polite">
              <p className={`${s.secundario} um-etiqueta`}>{t('tuSalida.salA')}</p>
              <p className={`${s.horaSalida} um-dato`}>{formatTime(plan.departure, language)}</p>
              <p className="um-cuerpo">
                {names.name !== names.real
                  ? t('tuSalida.llegasLugar', { nombre: names.name, lugar: names.real, hora: formatTime(plan.arrival, language) })
                  : t('tuSalida.llegas', { lugar: names.real, hora: formatTime(plan.arrival, language) })}
              </p>
            </section>
            <div className={s.cifras}>
              <p className={s.cifra}>
                <span className="um-dato">{t('tuSalida.minutos', { n: roundMinutes(plan.route.sunMinutes) })}</span>
                <span className={`${s.secundario} um-etiqueta`}>{t('tuSalida.alSol')}</span>
              </p>
              <p className={s.cifra}>
                <span className="um-dato">{t('tuSalida.porcentaje', { p: Math.round(plan.route.shadePercent) })}</span>
                <span className={`${s.secundario} um-etiqueta`}>{t('tuSalida.enSombra')}</span>
              </p>
            </div>
            {arrival && arrivesInHeat(arrival) && (
              <div className={`${s.franja} ${niveles.precaucion}`}>
                <FormaSemaforo level="precaucion" size={16} />
                <p className="um-etiqueta">{t('tuSalida.calor')}</p>
              </div>
            )}
            {full && (
              <p className={`${s.error} um-etiqueta`} role="status">
                {t('tuSalida.limite', { n: MAX_TRIPS })}
              </p>
            )}
            {savedId ? (
              <Boton onClick={() => navigate('/perfil/salidas')}>{t('tuSalida.verMisSalidas')}</Boton>
            ) : (
              <Boton onClick={() => save(false)}>{t('tuSalida.guardar')}</Boton>
            )}
            {savedId && (
              <p className={`${s.avisoHecho} ${s.avisoTexto} um-etiqueta`} role="status">
                <Icono name="guardado" size={20} />
                {t('tuSalida.guardada')}
              </p>
            )}
            <Boton variant="secundario" onClick={addToCalendar}>
              {t('tuSalida.calendario')}
            </Boton>
            <p className={`${s.secundario} um-etiqueta`}>{t('tuSalida.nota')}</p>
            {origin && (
              <Link className={`${s.enlaceCentro} um-cuerpo-fuerte`} to={routeLink(destinationId, plan.departure, origin, false)}>
                <Icono name="mapa" size={20} />
                {t('tuSalida.verRuta')}
              </Link>
            )}
          </>
        )}
      </main>
      <BarraInferior active="perfil" />
    </div>
  )
}

/** "sábado 17" para el chip Estimado cuando la salida es otro día. */
function shortDay(date: Date, language: string): string {
  return new Intl.DateTimeFormat(language === 'es' ? 'es-CO' : 'en-US', { weekday: 'long', day: 'numeric', timeZone: TIME_ZONE }).format(date)
}
