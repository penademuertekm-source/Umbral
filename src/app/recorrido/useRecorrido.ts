import { useEffect, useState } from 'react'
import type { ThermalContext, ThermalState } from '../../clima/estado'
import type { HeatLevel, HeatProfile } from '../../config/reglas-semaforo'
import { GPS_MAX_TOLERANCE_M, GPS_TOLERANCE_M, SIMULATION_SPEEDUP, SIMULATION_TICK_MS } from '../../config/recorrido'
import type { LonLat } from '../../rutas/geometria'
import { snap, type Graph } from '../../rutas/grafo'
import { advance, buildTrack, type Track, type TrackState } from '../../rutas/recorrido'
import { findRoute, type Route, type RouteMode } from '../../rutas/rutas'
import { motorSombra } from '../../sombra/cliente'
import { costModel, levelOfRoute } from '../rutas/useContextoRutas'

// Pantalla 13: la ruta del recorrido (fija desde que empieza), el seguimiento por GPS y el modo simulación.
// Nada de esto se guarda: las posiciones viven solo en memoria mientras la pantalla está abierta.

export interface RutaRecorrido {
  route: Route
  /** La ruta más corta a la misma hora, para "minutos de sol evitados" (pantalla 22). */
  shortest: Route
  track: Track
  level: HeatLevel | null
  time: Date
}

interface Entrada {
  graph: Graph | null
  origin: LonLat | null
  destination: LonLat | null
  mode: RouteMode
  profile: HeatProfile
  time: Date
  context: ThermalContext | null
  thermalAt: (date: Date) => ThermalState | null
  /** Cambia cuando llega un pronóstico nuevo (para recalcular el nivel). */
  forecastKey: number
}

/** La ruta a una hora dada. undefined mientras se calcula; null si no hay ruta. */
export function useRutaRecorrido(input: Entrada): RutaRecorrido | null | undefined {
  const { graph, origin, destination, mode, profile, time, context, thermalAt, forecastKey } = input
  const [result, setResult] = useState<{ key: string; value: RutaRecorrido | null } | null>(null)
  const key =
    graph && origin && destination && context
      ? `${origin.join(',')}|${destination.join(',')}|${mode}|${profile}|${time.getTime()}|${context.elNino}|${forecastKey}`
      : ''

  useEffect(() => {
    if (!key || !graph || !origin || !destination || !context) return
    let vigente = true
    motorSombra.calcular(time).then((shade) => {
      if (!vigente) return
      const from = snap(graph, origin)
      const to = snap(graph, destination)
      const chosen = from && to ? findRoute(graph, from, to, costModel(graph, shade.fraction, mode, profile)) : null
      const shortest = from && to ? findRoute(graph, from, to, costModel(graph, shade.fraction, 'corta', profile)) : null
      const value =
        chosen && shortest
          ? {
              route: chosen,
              shortest,
              track: buildTrack(chosen, graph.projection),
              level: levelOfRoute(chosen, thermalAt(time), context),
              time,
            }
          : null
      setResult({ key, value })
    })
    return () => {
      vigente = false
    }
    // `key` resume todas las entradas; las funciones y objetos cambian de identidad en cada render.
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  return result?.key === key ? result.value : undefined
}

export interface Seguimiento {
  state: TrackState
  point: LonLat
  accuracy: number
}

/**
 * Sigue la posición con watchPosition (alta precisión) y la ubica sobre la ruta con un margen de 20 m (o la
 * precisión que informe el teléfono, hasta 40 m). Solo se conserva el último punto.
 */
export function useSeguimientoGps(track: Track | null, active: boolean): Seguimiento | null {
  const [last, setLast] = useState<(Seguimiento & { track: Track }) | null>(null)
  useEffect(() => {
    if (!active || !track || !('geolocation' in navigator)) return
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const point: LonLat = [p.coords.longitude, p.coords.latitude]
        const tolerance = Math.min(GPS_MAX_TOLERANCE_M, Math.max(GPS_TOLERANCE_M, p.coords.accuracy))
        setLast((previous) => {
          const along = previous && previous.track === track ? previous.state.along : 0
          return { track, state: advance(track, along, point, tolerance), point, accuracy: p.coords.accuracy }
        })
      },
      () => undefined,
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [active, track])
  return last && last.track === track ? last : null
}

/** Modo simulación: avanza solo por la ruta, SIMULATION_SPEEDUP veces más rápido que caminando. */
export function useSimulacion(track: Track | null, active: boolean, paused: boolean, speed: number): number {
  const [sim, setSim] = useState<{ track: Track; along: number } | null>(null)
  useEffect(() => {
    if (!active || paused || !track) return
    const step = (speed * SIMULATION_SPEEDUP * SIMULATION_TICK_MS) / 1000
    const id = window.setInterval(() => {
      setSim((previous) => {
        const along = previous && previous.track === track ? previous.along : 0
        return { track, along: Math.min(track.route.meters, along + step) }
      })
    }, SIMULATION_TICK_MS)
    return () => window.clearInterval(id)
  }, [active, paused, track, speed])
  return sim && sim.track === track ? sim.along : 0
}
