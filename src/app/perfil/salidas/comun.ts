import { useEffect, useState } from 'react'
import type { HeatProfile } from '../../../config/reglas-semaforo'
import type { I18nValue } from '../../../i18n/contexto'
import type { Destination } from '../../../mapa/datos'
import { candidateDepartures, chooseDeparture, type PlannedDeparture } from '../../../rutas/agenda'
import type { LonLat } from '../../../rutas/geometria'
import { snap, type Graph } from '../../../rutas/grafo'
import { findRoute, type Route } from '../../../rutas/rutas'
import { motorSombra } from '../../../sombra/cliente'
import { localParts, TIME_ZONE } from '../../../sombra/tiempo'
import type { PlannedTrip, ProfileData } from '../../../perfil/almacen'
import { costModel } from '../../rutas/useContextoRutas'

// Lo que comparten las pantallas de la agenda de salidas (S2).

/** Ruta con más sombra saliendo a una hora: el mismo motor y el mismo costo que "¿Cuándo salir?" (15). */
export async function routeAt(graph: Graph, from: LonLat, to: LonLat, time: Date, profile: HeatProfile): Promise<Route | null> {
  const a = snap(graph, from)
  const b = snap(graph, to)
  if (!a || !b) return null
  const shade = await motorSombra.calcular(time)
  return findRoute(graph, a, b, costModel(graph, shade.fraction, 'sombra', profile))
}

/** La mejor hora de salida para llegar a `arrival`. undefined mientras calcula; null si no hay ninguna. */
export function usePlanSalida(
  graph: Graph | null,
  from: LonLat | null,
  to: LonLat | null,
  arrival: Date | null,
  profile: HeatProfile,
): PlannedDeparture | null | undefined {
  const key = graph && from && to && arrival ? `${from.join(',')}|${to.join(',')}|${arrival.getTime()}|${profile}` : ''
  const [result, setResult] = useState<{ key: string; plan: PlannedDeparture | null } | null>(null)
  useEffect(() => {
    if (!key || !graph || !from || !to || !arrival) return
    let vigente = true
    ;(async () => {
      const candidates = []
      for (const departure of candidateDepartures(arrival)) {
        const route = await routeAt(graph, from, to, departure, profile)
        if (!vigente) return
        candidates.push({ departure, route })
      }
      setResult({ key, plan: chooseDeparture(candidates, arrival) })
    })()
    return () => {
      vigente = false
    }
    // `key` resume todas las entradas.
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
  return result?.key === key ? result.plan : undefined
}

/** La ruta de cada salida guardada, a su hora y desde su punto de partida (las cifras no se guardan). */
export function useRutasSalidas(graph: Graph | null, trips: PlannedTrip[], destinos: Destination[] | undefined, profile: HeatProfile) {
  const key = graph && destinos ? trips.map((t) => `${t.id}|${t.departure}|${t.destinationId}`).join(';') + `|${profile}` : ''
  const [result, setResult] = useState<{ key: string; routes: Map<string, Route | null> } | null>(null)
  useEffect(() => {
    if (!key || !graph || !destinos) return
    let vigente = true
    ;(async () => {
      const routes = new Map<string, Route | null>()
      for (const trip of trips) {
        const to = destinationPoint(destinos.find((d) => d.id === trip.destinationId))
        routes.set(trip.id, to ? await routeAt(graph, trip.origin, to, new Date(trip.departure), profile) : null)
        if (!vigente) return
      }
      setResult({ key, routes })
    })()
    return () => {
      vigente = false
    }
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
  return result?.key === key ? result.routes : null
}

export function destinationPoint(destino: Destination | undefined): LonLat | null {
  return destino?.lat != null && destino.lon != null ? [destino.lon, destino.lat] : null
}

/** Nombre que puso la persona (si salió de un lugar guardado) y nombre real del destino. */
export function tripNames(
  trip: Pick<PlannedTrip, 'placeId' | 'destinationId'>,
  profile: ProfileData,
  destinos: Destination[] | undefined,
  language: string,
): { name: string; real: string } {
  const destino = destinos?.find((d) => d.id === trip.destinationId)
  const real = destino ? (language === 'es' ? destino.nombre.es : destino.nombre.en) : ''
  const place = trip.placeId ? profile.places.find((p) => p.id === trip.placeId) : undefined
  return { name: place?.name ?? real, real }
}

/** "viernes 16" (o "jueves 22 de octubre" si no es de esta semana o la siguiente). */
function weekday(date: Date, language: string, withMonth: boolean): string {
  return new Intl.DateTimeFormat(language === 'es' ? 'es-CO' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    ...(withMonth ? { month: 'long' } : {}),
    timeZone: TIME_ZONE,
  }).format(date)
}

/** Número de días entre dos fechas de Valledupar (0 = el mismo día). */
export function dayOffset(date: Date, now: Date): number {
  const a = localParts(date)
  const b = localParts(now)
  return Math.round((Date.UTC(a.year, a.month - 1, a.day) - Date.UTC(b.year, b.month - 1, b.day)) / 86_400_000)
}

/** "Hoy, viernes 16", "Mañana, sábado 17" o "jueves 22 de octubre". */
export function dayLabel({ t, language }: Pick<I18nValue, 't' | 'language'>, date: Date, now: Date): string {
  const offset = dayOffset(date, now)
  if (offset === 0) return t('misSalidas.hoyDia', { dia: weekday(date, language, false) })
  if (offset === 1) return t('misSalidas.mananaDia', { dia: weekday(date, language, false) })
  const text = weekday(date, language, true)
  return text.charAt(0).toLocaleUpperCase() + text.slice(1)
}
