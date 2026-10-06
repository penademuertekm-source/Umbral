// Grafo peatonal (Fase 6): cada lado de acera es una arista y en las esquinas se puede doblar sin costo o
// cruzar la calle con un costo pequeño. Código puro: lo usan las pantallas de rutas y las pruebas.
//
// Vértices: la acera s tiene su inicio en el vértice 2s y su fin en 2s + 1, en el sentido de la geometría
// de su calle. En cada nodo, los extremos de acera se ordenan por ángulo: entre dos calles vecinas hay una
// esquina (se dobla por la misma acera) y entre los dos lados de una misma calle hay un cruce.
//
// Los nodos se reconocen por las coordenadas de los extremos de cada calle, no por `u` y `v`: en la red no
// dirigida de OSMnx la geometría de algunas calles va de v a u, y las aceras siguen a la geometría.
import type { FeatureCollection, LineString } from 'geojson'
import { CROSSING_WIDTH_M, DEFAULT_CROSSING_WIDTH_M } from '../config/rutas'
import type { EdgeProps, Orientation, SidewalkProps } from '../mapa/datos'
import { sideKey, type Side, type SideLetter } from '../sombra/modelo'
import { cumulative, distance, project, projection, type LonLat, type Projection, type XY } from './geometria'

export type LinkKind = 'acera' | 'esquina' | 'cruce'

export interface Link {
  to: number
  length: number
  kind: LinkKind
  /** Acera recorrida (-1 en esquinas y cruces) y desde/hasta qué metro de ella. */
  segment: number
  fromAlong: number
  toAlong: number
  /** En los cruces: la calle que se cruza (id de arista). Para las instrucciones del recorrido (pantalla 13). */
  crossed?: number
}

export interface Segment {
  edge: number
  side: SideLetter
  /** Hacia dónde da la acera: "Sigue por la acera occidental". */
  orientation: Orientation
  /** Posición del lado en los arreglos del motor de sombra (-1 si no tiene muestras). */
  shadeIndex: number
  coords: LonLat[]
  xy: XY[]
  cum: number[]
  length: number
}

export interface Graph {
  segments: Segment[]
  /** Enlaces que salen de cada vértice real. */
  links: Link[][]
  projection: Projection
}

interface End {
  vertex: number
  edge: number
  atStart: boolean
  angle: number
}

/** Identidad de un nodo: las calles que se cruzan comparten exactamente la coordenada del extremo. */
const nodeKey = (c: number[]) => `${c[0].toFixed(7)},${c[1].toFixed(7)}`

/** Separación angular de cada acera respecto al eje de su calle al ordenar los extremos en un nodo. */
const SIDE_OFFSET_RAD = 0.01

export function vertexXY(graph: Graph, vertex: number): XY {
  const segment = graph.segments[vertex >> 1]
  return vertex % 2 === 0 ? segment.xy[0] : segment.xy[segment.xy.length - 1]
}

export function buildGraph(
  red: FeatureCollection<LineString, EdgeProps>,
  aceras: FeatureCollection<LineString, SidewalkProps>,
  sides: readonly Side[],
): Graph {
  const first = red.features[0]?.geometry.coordinates[0] ?? [0, 0]
  const proj = projection(first[1], first[0])
  const shadeIndex = new Map(sides.map((s, i) => [sideKey(s.edge, s.side), i]))
  const edges = new Map(red.features.map((f) => [f.properties.id, f]))

  const segments: Segment[] = []
  const links: Link[][] = []
  for (const feature of aceras.features) {
    const { arista, lado, orientacion } = feature.properties
    if (!edges.has(arista)) continue
    const coords = feature.geometry.coordinates as LonLat[]
    const xy = coords.map((c) => proj.toXY(c))
    const cum = cumulative(xy)
    const s = segments.length
    const length = cum[cum.length - 1]
    segments.push({
      edge: arista,
      side: lado,
      orientation: orientacion,
      shadeIndex: shadeIndex.get(sideKey(arista, lado)) ?? -1,
      coords,
      xy,
      cum,
      length,
    })
    links.push([{ to: 2 * s + 1, length, kind: 'acera', segment: s, fromAlong: 0, toAlong: length }])
    links.push([{ to: 2 * s, length, kind: 'acera', segment: s, fromAlong: length, toAlong: 0 }])
  }

  // Extremos de acera en cada nodo, con su ángulo alrededor del nodo.
  const ends = new Map<string, End[]>()
  segments.forEach((segment, s) => {
    const edge = edges.get(segment.edge)!
    const axis = edge.geometry.coordinates.map((c) => proj.toXY(c as LonLat))
    for (const atStart of [true, false]) {
      const [from, next] = atStart ? [axis[0], axis[1]] : [axis[axis.length - 1], axis[axis.length - 2]]
      const bearing = Math.atan2(next[1] - from[1], next[0] - from[0])
      // "a" va a la izquierda del sentido u→v: mirando desde u queda a la izquierda; desde v, a la derecha.
      const left = (segment.side === 'a') === atStart
      const angle = bearing + (left ? SIDE_OFFSET_RAD : -SIDE_OFFSET_RAD)
      const coords = edge.geometry.coordinates
      const node = nodeKey(atStart ? coords[0] : coords[coords.length - 1])
      const list = ends.get(node) ?? []
      list.push({ vertex: 2 * s + (atStart ? 0 : 1), edge: segment.edge, atStart, angle: (angle + 2 * Math.PI) % (2 * Math.PI) })
      ends.set(node, list)
    }
  })

  const add = (a: number, b: number, length: number, kind: LinkKind, crossed?: number) => {
    links[a].push({ to: b, length, kind, segment: -1, fromAlong: 0, toAlong: 0, crossed })
    links[b].push({ to: a, length, kind, segment: -1, fromAlong: 0, toAlong: 0, crossed })
  }
  for (const list of ends.values()) {
    if (list.length < 2) continue
    list.sort((p, q) => p.angle - q.angle)
    const seen = new Set<string>()
    for (let i = 0; i < list.length; i++) {
      const p = list[i]
      const q = list[(i + 1) % list.length]
      const key = p.vertex < q.vertex ? `${p.vertex}-${q.vertex}` : `${q.vertex}-${p.vertex}`
      if (p.vertex === q.vertex || seen.has(key)) continue
      seen.add(key)
      if (p.edge === q.edge && p.atStart === q.atStart) {
        const type = edges.get(p.edge)!.properties.tipo
        add(p.vertex, q.vertex, CROSSING_WIDTH_M[type] ?? DEFAULT_CROSSING_WIDTH_M, 'cruce', p.edge)
      } else {
        const gap = distance(vertexXYFrom(segments, p.vertex), vertexXYFrom(segments, q.vertex))
        add(p.vertex, q.vertex, gap, 'esquina')
      }
    }
  }
  return { segments, links, projection: proj }
}

function vertexXYFrom(segments: Segment[], vertex: number): XY {
  const segment = segments[vertex >> 1]
  return vertex % 2 === 0 ? segment.xy[0] : segment.xy[segment.xy.length - 1]
}

export interface Snap {
  segment: number
  /** Metros desde el inicio de la acera. */
  along: number
  /** Distancia del punto a la acera (m). */
  distance: number
  point: LonLat
}

/** La acera más cercana a un punto. */
export function snap(graph: Graph, point: LonLat): Snap | null {
  const xy = graph.projection.toXY(point)
  let best: Snap | null = null
  graph.segments.forEach((segment, s) => {
    const hit = project(xy, segment.xy, segment.cum)
    if (!best || hit.distance < best.distance) best = { segment: s, along: hit.along, distance: hit.distance, point }
  })
  return best
}
