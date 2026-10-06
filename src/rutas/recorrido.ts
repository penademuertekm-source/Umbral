// Recorrido en curso (pantalla 13): dónde va la persona sobre la ruta, qué hacer ahora y cuánto falta.
// Código puro. No guarda posiciones (CLAUDE.md, "Privacidad"): recibe un punto y devuelve metros recorridos.
import { CROSSING_EXTRA_S, type RouteProfile } from '../config/rutas'
import { EXPOSED_WARNING_M } from '../config/recorrido'
import type { Orientation } from '../mapa/datos'
import { cumulative, distance, pointAlong, project, type LonLat, type Projection, type XY } from './geometria'
import type { Graph } from './grafo'
import type { Route, RoutePiece } from './rutas'

interface TrackPiece {
  piece: RoutePiece
  /** Metros de ruta al inicio de la pieza. */
  start: number
  xy: XY[]
  cum: number[]
}

/** La ruta preparada para ubicar puntos sobre ella. */
export interface Track {
  route: Route
  pieces: TrackPiece[]
  projection: Projection
}

export function buildTrack(route: Route, projection: Projection): Track {
  let start = 0
  const pieces = route.pieces.map((piece) => {
    const xy = piece.coords.map((c) => projection.toXY(c))
    const item: TrackPiece = { piece, start, xy, cum: cumulative(xy) }
    start += piece.length
    return item
  })
  return { route, pieces, projection }
}

// Los metros de ruta de un cruce son el ancho de la calzada; su geometría puede medir un poco distinto.
const geometryLength = (p: TrackPiece) => p.cum[p.cum.length - 1]
const toRouteMeters = (p: TrackPiece, local: number) =>
  p.start + (geometryLength(p) > 0 ? (local / geometryLength(p)) * p.piece.length : 0)
const toLocalMeters = (p: TrackPiece, along: number) =>
  p.piece.length > 0 ? ((along - p.start) / p.piece.length) * geometryLength(p) : 0

/** Punto de la ruta a `along` metros del inicio. */
export function pointAt(track: Track, along: number): LonLat | null {
  const last = track.pieces[track.pieces.length - 1]
  if (!last) return null
  const d = Math.max(0, Math.min(track.route.meters, along))
  const p = track.pieces.find((q) => d <= q.start + q.piece.length) ?? last
  return track.projection.toLonLat(pointAlong(p.xy, p.cum, toLocalMeters(p, d)))
}

export interface Located {
  /** Metros de ruta desde el inicio. */
  along: number
  /** Distancia del punto a la ruta (m). */
  distance: number
}

/** La proyección más cercana del punto sobre la ruta, buscando solo entre `from` y `to` metros de ruta. */
export function locate(track: Track, point: LonLat, from = 0, to = Infinity): Located | null {
  const xy = track.projection.toXY(point)
  let best: Located | null = null
  for (const p of track.pieces) {
    if (p.start + p.piece.length < from || p.start > to) continue
    const hit = project(xy, p.xy, p.cum)
    if (!best || hit.distance < best.distance) best = { along: toRouteMeters(p, hit.along), distance: hit.distance }
  }
  return best
}

/** Ventana de búsqueda alrededor del último avance: evita saltar a otra parte de la ruta que pase cerca. */
const BACK_WINDOW_M = 30
const AHEAD_WINDOW_M = 200

export interface TrackState {
  along: number
  /** ¿El último punto quedó a menos del margen de la ruta? */
  onRoute: boolean
  distance: number
}

/**
 * Nueva posición del GPS. Si queda a menos de `tolerance` metros de la ruta, el avance se mueve hasta su
 * proyección; nunca retrocede (el GPS salta). Si queda más lejos, el avance se conserva y no se avisa nada:
 * la app no dice "te desviaste" (especificación, pantalla 13).
 */
export function advance(track: Track, previous: number, point: LonLat, tolerance: number): TrackState {
  const near = locate(track, point, previous - BACK_WINDOW_M, previous + AHEAD_WINDOW_M)
  const hit = near && near.distance <= tolerance ? near : locate(track, point)
  if (!hit || hit.distance > tolerance) return { along: previous, onRoute: false, distance: hit?.distance ?? Infinity }
  return { along: Math.max(previous, hit.along), onRoute: true, distance: hit.distance }
}

export type Maneuver = 'recto' | 'izquierda' | 'derecha'

/** Tramo de la instrucción: una acera de una misma calle, o un cruce. */
export interface Leg {
  kind: 'acera' | 'cruce'
  /** Metros de ruta al inicio y al final. */
  start: number
  end: number
  /** Calle de la acera, o la que se cruza. */
  edge: number
  orientation: Orientation | null
  /** Giro al empezar el tramo respecto del rumbo anterior. */
  maneuver: Maneuver
}

/** Tramos de acera más cortos que esto se suman al anterior (m). */
const MIN_LEG_M = 10

/** Ángulo a partir del cual se considera un giro (y no "seguir derecho"). */
const TURN_RAD = (35 * Math.PI) / 180

function heading(a: XY, b: XY): number {
  return Math.atan2(b[1] - a[1], b[0] - a[0])
}

function maneuverBetween(before: number | null, after: number | null): Maneuver {
  if (before === null || after === null) return 'recto'
  let diff = after - before
  while (diff > Math.PI) diff -= 2 * Math.PI
  while (diff <= -Math.PI) diff += 2 * Math.PI
  if (diff > TURN_RAD) return 'izquierda'
  if (diff < -TURN_RAD) return 'derecha'
  return 'recto'
}

const firstHeading = (xy: XY[]) => (xy.length >= 2 && distance(xy[0], xy[1]) > 0 ? heading(xy[0], xy[1]) : null)
const lastHeading = (xy: XY[]) => {
  const n = xy.length
  return n >= 2 && distance(xy[n - 2], xy[n - 1]) > 0 ? heading(xy[n - 2], xy[n - 1]) : null
}

/**
 * Agrupa las piezas de la ruta en tramos para las instrucciones. Las aceras seguidas de una misma calle y
 * orientación forman un tramo; las esquinas se suman al tramo en curso; cada cruce es su propio tramo.
 * `streetOf` da el nombre de una calle ("" si no tiene): dos aristas con el mismo nombre son la misma calle.
 */
export function buildLegs(track: Track, graph: Graph, streetOf: (edge: number) => string): Leg[] {
  const legs: Leg[] = []
  let lastDirection: number | null = null
  for (const p of track.pieces) {
    const end = p.start + p.piece.length
    const current = legs[legs.length - 1]
    if (p.piece.kind === 'esquina') {
      if (current) current.end = end
    } else if (p.piece.kind === 'acera') {
      const orientation = graph.segments[p.piece.segment].orientation
      const street = streetOf(p.piece.edge)
      const sameStreet = current?.kind === 'acera' && (current.edge === p.piece.edge || (street !== '' && streetOf(current.edge) === street))
      if (current && sameStreet && current.orientation === orientation) {
        current.end = end
      } else {
        legs.push({ kind: 'acera', start: p.start, end, edge: p.piece.edge, orientation, maneuver: maneuverBetween(lastDirection, firstHeading(p.xy)) })
      }
    } else {
      legs.push({ kind: 'cruce', start: p.start, end, edge: p.piece.edge, orientation: null, maneuver: maneuverBetween(lastDirection, firstHeading(p.xy)) })
    }
    // Las esquinas unen extremos de acera que se traslapan cerca del nodo: su dirección no es la de la marcha.
    if (p.piece.kind !== 'esquina') lastDirection = lastHeading(p.xy) ?? lastDirection
  }
  // Un trozo de acera de pocos metros entre dos cruces (cruces complejos) no merece instrucción propia.
  const merged: Leg[] = []
  for (const leg of legs) {
    const previous = merged[merged.length - 1]
    if (previous && leg.kind === 'acera' && leg.end - leg.start < MIN_LEG_M) previous.end = leg.end
    else merged.push(leg)
  }
  return merged
}

export interface Guidance {
  leg: Leg
  next: Leg | null
  /** Metros hasta el final del tramo actual (la próxima esquina, el cruce o el destino). */
  toLegEnd: number
  /** Tramo expuesto a menos de EXPOSED_WARNING_M (ahead > 0) o el que se está recorriendo (ahead = 0). */
  exposed: { ahead: number; length: number } | null
  remainingMeters: number
  remainingMinutes: number
  /** Avance de 0 a 1. */
  progress: number
}

export function guidanceAt(track: Track, legs: Leg[], along: number, profile: RouteProfile): Guidance | null {
  if (legs.length === 0) return null
  const { route } = track
  const d = Math.max(0, Math.min(route.meters, along))
  const index = Math.max(0, legs.findIndex((leg) => d < leg.end))
  const i = d >= route.meters ? legs.length - 1 : index
  const leg = legs[i]

  let exposed: Guidance['exposed'] = null
  for (const stretch of route.exposed) {
    const end = stretch.startMeters + stretch.length
    if (d >= stretch.startMeters && d < end) {
      exposed = { ahead: 0, length: end - d }
      break
    }
    if (stretch.startMeters > d && stretch.startMeters - d <= EXPOSED_WARNING_M) {
      exposed = { ahead: stretch.startMeters - d, length: stretch.length }
      break
    }
  }

  const remainingMeters = route.meters - d
  const crossingsAhead = track.pieces.filter((p) => p.piece.kind === 'cruce' && p.start >= d).length
  return {
    leg,
    next: legs[i + 1] ?? null,
    toLegEnd: Math.max(0, leg.end - d),
    exposed,
    remainingMeters,
    remainingMinutes: (remainingMeters / profile.speed + crossingsAhead * CROSSING_EXTRA_S) / 60,
    progress: route.meters > 0 ? d / route.meters : 1,
  }
}

/** ¿Llegó? A menos de `radius` del destino, o a menos de `radius` del final yendo sobre la ruta. */
export function hasArrived(
  track: Track,
  state: TrackState,
  point: LonLat | null,
  destination: LonLat,
  radius: number,
): boolean {
  if (state.along >= track.route.meters) return true
  if (state.onRoute && track.route.meters - state.along <= radius) return true
  return point !== null && distance(track.projection.toXY(point), track.projection.toXY(destination)) <= radius
}
