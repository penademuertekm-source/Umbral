import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { BarraInferior, Boton, ChipEstimado, Encabezado, Icono } from '../../../componentes'
import { readHeatProfile } from '../../../clima/configClima'
import { roundMinutes } from '../../../i18n/numeros'
import { useT } from '../../../i18n/useT'
import type { PlannedTrip } from '../../../perfil/almacen'
import { usePerfil } from '../../../perfil/usePerfil'
import { formatTime, isoLocalDate } from '../../../sombra/tiempo'
import { useGraph, useMapData } from '../../rutas/useContextoRutas'
import { useVolver } from '../../useVolver'
import { destinationIcon } from '../lugares'
import s from '../Perfil.module.css'
import { dayLabel, tripNames, useRutasSalidas } from './comun'
import { routeLink } from './enlaces'

// Mis salidas (S2, Figma 148:2516; vacío 148:2615): las salidas planeadas, agrupadas por día. Los minutos al
// sol y la hora de llegada se recalculan al abrir, a la hora de cada salida y desde su punto de partida.

export function MisSalidas() {
  const i18n = useT()
  const { t, language } = i18n
  const navigate = useNavigate()
  const volver = useVolver('/perfil')
  const profile = usePerfil()
  const { data } = useMapData()
  const graph = useGraph(data)
  const [heatProfile] = useState(readHeatProfile)
  const [now] = useState(() => new Date())
  const routes = useRutasSalidas(graph, profile.trips, data?.destinos, heatProfile)
  const count = profile.trips.length
  const subtitle = count === 0 ? t('miPerfil.salidasNinguna') : count === 1 ? t('misSalidas.totalUna') : t('misSalidas.total', { n: count })

  const groups = new Map<string, PlannedTrip[]>()
  for (const trip of profile.trips) {
    const key = isoLocalDate(new Date(trip.departure))
    groups.set(key, [...(groups.get(key) ?? []), trip])
  }

  return (
    <div className={s.pantalla}>
      <Encabezado title={t('misSalidas.titulo')} subtitle={subtitle} onBack={volver} />
      {count === 0 ? (
        <main className={`${s.contenido} ${s.vacio}`}>
          <span className={s.iconoGrande} aria-hidden="true">
            <Icono name="reloj" size={32} />
          </span>
          <p className="um-subtitulo">{t('misSalidas.vacioTitulo')}</p>
          <p className={`${s.secundario} um-cuerpo`}>{t('misSalidas.vacioTexto')}</p>
          <Boton onClick={() => navigate('/perfil/salidas/nueva')}>{t('misSalidas.planear')}</Boton>
        </main>
      ) : (
        <main className={s.contenido}>
          {data && <ChipEstimado time={t('tuSalida.hoy')} provisional={data.meta.datos_provisionales} />}
          {[...groups.values()].map((trips) => (
            <section key={trips[0].id}>
              <h2 className={`${s.grupo} um-etiqueta`}>{dayLabel(i18n, new Date(trips[0].departure), now)}</h2>
              <ul className={s.tarjeta}>
                {trips.map((trip) => {
                  const departure = new Date(trip.departure)
                  const names = tripNames(trip, profile, data?.destinos, language)
                  const route = routes?.get(trip.id)
                  const hora = formatTime(departure, language)
                  const details = [
                    route
                      ? t('misSalidas.llegas', {
                          hora: formatTime(new Date(departure.getTime() + route.minutes * 60_000), language),
                          min: roundMinutes(route.sunMinutes),
                        })
                      : routes
                        ? ''
                        : t('buscar.calculando'),
                    trip.inCalendar ? t('misSalidas.enCalendario') : '',
                  ].filter(Boolean)
                  return (
                    <li key={trip.id} className={s.filaConAccion}>
                      <Link className={s.fila} to={routeLink(trip.destinationId, departure, trip.origin, false)}>
                        <span className={s.icono} aria-hidden="true">
                          <Icono name={destinationIcon(data?.destinos.find((d) => d.id === trip.destinationId))} />
                        </span>
                        <span className={s.textos}>
                          <span className="um-cuerpo-fuerte">{t('misSalidas.fila', { hora, nombre: names.name })}</span>
                          {names.real !== names.name && <span className={`${s.secundario} um-etiqueta`}>{names.real}</span>}
                          {details.length > 0 && <span className={`${s.secundario} um-etiqueta`}>{details.join(' · ')}</span>}
                        </span>
                      </Link>
                      <button
                        type="button"
                        className={`${s.editar} um-etiqueta`}
                        aria-label={t('misSalidas.editarAria', { hora, nombre: names.name })}
                        onClick={() => navigate(`/perfil/salidas/nueva?editar=${encodeURIComponent(trip.id)}`)}
                      >
                        {t('misSalidas.editar')}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
          <Boton onClick={() => navigate('/perfil/salidas/nueva')}>{t('misSalidas.planear')}</Boton>
          <p className={`${s.nota} um-etiqueta`}>{t('misSalidas.nota')}</p>
        </main>
      )}
      <BarraInferior active="perfil" />
    </div>
  )
}
