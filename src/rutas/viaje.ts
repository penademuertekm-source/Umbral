// G3: una sola fuente para las cifras del viaje. La ruta entre un origen y un destino se calcula una vez por
// hora de sombra, modo y perfil, y la leen todas las pantallas (05, 06, 13, 15, 16, Mis lugares y la agenda
// de salidas). Así la distancia, los minutos y el % coinciden en todas. Código puro, sin React.
import type { LonLat } from './geometria'
import { snap, type Graph } from './grafo'
import { findRoute, type CostModel, type Route, type RouteMode } from './rutas'

/** La sombra con la que se calcula: su instante (cuarto de hora del motor) y la fracción de cada lado. */
export interface ShadeAt {
  time: number
  fraction: Float32Array
}

/** Rutas guardadas por grafo. Al pasar el tope se olvidan las más viejas. */
export const TRIP_CACHE_LIMIT = 600
const caches = new WeakMap<Graph, Map<string, Route | null>>()

/**
 * La ruta de `from` a `to` con la sombra de `shade`. Si ya se calculó con la misma hora, modo y perfil,
 * devuelve el mismo objeto. `model` es el costo de esa sombra y ese modo (lo arma quien llama). No se debe
 * modificar la ruta devuelta: la comparten las pantallas.
 */
export function tripRoute(
  graph: Graph,
  from: LonLat,
  to: LonLat,
  shade: ShadeAt,
  mode: RouteMode,
  profile: string,
  model: CostModel,
): Route | null {
  const key = `${shade.time}|${mode}|${profile}|${from[0]},${from[1]}|${to[0]},${to[1]}`
  let cache = caches.get(graph)
  if (!cache) {
    cache = new Map()
    caches.set(graph, cache)
  }
  if (cache.has(key)) return cache.get(key) ?? null
  const a = snap(graph, from)
  const b = snap(graph, to)
  const route = a && b ? findRoute(graph, a, b, model) : null
  cache.set(key, route)
  if (cache.size > TRIP_CACHE_LIMIT) cache.delete(cache.keys().next().value as string)
  return route
}
