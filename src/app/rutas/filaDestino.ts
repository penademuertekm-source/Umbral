import type { ThermalContext, ThermalState } from '../../clima/estado'
import type { HeatLevel, HeatProfile } from '../../config/reglas-semaforo'
import { insideArea, metersBetween, type Destination, type MapData } from '../../mapa/datos'
import type { LonLat } from '../../rutas/geometria'
import type { Graph } from '../../rutas/grafo'
import type { Route } from '../../rutas/rutas'
import { levelOfRoute, routeBetween } from './useContextoRutas'

// Lo que se muestra de un destino en una lista (05 y Mis lugares): su ruta con más sombra a la hora
// elegida, desde el punto de partida, o por qué no la hay. Es la misma cuenta en las dos pantallas (G3).

export type FilaDestino =
  | { kind: 'sin_ubicacion' }
  | { kind: 'fuera'; meters: number }
  | { kind: 'sin_origen' }
  | { kind: 'calculando' }
  | { kind: 'sin_ruta' }
  | { kind: 'ruta'; route: Route; level: HeatLevel | null }

export interface EntradaFila {
  data: MapData
  graph: Graph | null
  fraction: Float32Array | null
  origin: LonLat | null
  profile: HeatProfile
  context: ThermalContext | null
  thermal: ThermalState | null
}

export function filaDestino(destino: Destination, input: EntradaFila): FilaDestino {
  const { data, graph, fraction, origin, profile, context, thermal } = input
  if (destino.lat === null || destino.lon === null) return { kind: 'sin_ubicacion' }
  const point: LonLat = [destino.lon, destino.lat]
  if (!insideArea(data.meta, point)) return { kind: 'fuera', meters: metersBetween(data.meta.area.centro, point) }
  if (!origin) return { kind: 'sin_origen' }
  if (!graph || !fraction || !context) return { kind: 'calculando' }
  const route = routeBetween(graph, origin, point, fraction, 'sombra', profile)
  if (!route) return { kind: 'sin_ruta' }
  return { kind: 'ruta', route, level: levelOfRoute(route, thermal, context) }
}
