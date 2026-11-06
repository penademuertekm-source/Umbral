// Cómo se nombran los dos andenes de una cuadra en la ficha (07-2, 13-1): por una referencia y no por un
// punto cardinal. Junto a una plaza o un parque: "Andén del lado de la plaza" / "Andén de enfrente". Si no,
// por la calle paralela más cercana de cada lado: "Andén hacia la Calle 15". Código puro.
import type { Feature, FeatureCollection, LineString, MultiPolygon, Polygon, Position } from 'geojson'
import type { SideLetter } from '../sombra/modelo'
import type { EdgeProps, Orientation, SidewalkProps } from './datos'
import { abbreviate } from './tramos'

export type OpenSpace = 'plaza' | 'parque'

export type SideReference =
  | { kind: 'espacio'; space: OpenSpace }
  | { kind: 'enfrente'; space: OpenSpace }
  | { kind: 'calle'; street: string }
  | { kind: 'costado'; orientation: Orientation }

/** Un andén mira a una plaza o parque si está a menos de esto de su borde (m). */
export const OPEN_SPACE_NEAR_M = 25
/** Hasta dónde se busca la calle paralela de cada lado (m). */
export const PARALLEL_STREET_MAX_M = 160
/** Una calle cuenta como paralela si su dirección se aparta menos de esto (grados). */
const PARALLEL_MAX_DEG = 30

type XY = [number, number]

/** Coordenadas planas en metros alrededor de una latitud (suficiente a escala de calle). */
function planar(lat0: number) {
  const kx = 111_320 * Math.cos((lat0 * Math.PI) / 180)
  const ky = 110_574
  return ([lon, lat]: Position): XY => [lon * kx, lat * ky]
}

const sub = (a: XY, b: XY): XY => [a[0] - b[0], a[1] - b[1]]
const dot = (a: XY, b: XY) => a[0] * b[0] + a[1] * b[1]
const unit = (v: XY): XY => {
  const length = Math.hypot(v[0], v[1]) || 1
  return [v[0] / length, v[1] / length]
}

function midpoint(xy: XY[]): XY {
  const lengths = xy.slice(1).map((p, i) => Math.hypot(p[0] - xy[i][0], p[1] - xy[i][1]))
  let rest = lengths.reduce((a, b) => a + b, 0) / 2
  for (let i = 0; i < lengths.length; i++) {
    if (rest <= lengths[i] && lengths[i] > 0) {
      const f = rest / lengths[i]
      return [xy[i][0] + (xy[i + 1][0] - xy[i][0]) * f, xy[i][1] + (xy[i + 1][1] - xy[i][1]) * f]
    }
    rest -= lengths[i]
  }
  return xy[0]
}

function distanceToSegment(p: XY, a: XY, b: XY): number {
  const d = sub(b, a)
  const length2 = dot(d, d)
  const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, dot(sub(p, a), d) / length2))
  return Math.hypot(p[0] - (a[0] + t * d[0]), p[1] - (a[1] + t * d[1]))
}

function insideRing(p: XY, ring: XY[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** Distancia de un punto a un polígono (0 si está dentro). */
function distanceToPolygon(p: XY, rings: XY[][]): number {
  if (rings[0] && insideRing(p, rings[0])) return 0
  let best = Infinity
  for (const ring of rings) for (let i = 1; i < ring.length; i++) best = Math.min(best, distanceToSegment(p, ring[i - 1], ring[i]))
  return best
}

/** "Plaza…" o "Parque…": los demás polígonos de plazas.geojson (p. ej. manzanas sin nombre) no cuentan. */
export function openSpaceKind(name: string | undefined): OpenSpace | null {
  if (!name) return null
  if (/^plaza\b/i.test(name.trim())) return 'plaza'
  if (/^parque\b/i.test(name.trim())) return 'parque'
  return null
}

export interface SideReferenceInput {
  red: FeatureCollection<LineString, EdgeProps>
  aceras: FeatureCollection<LineString, SidewalkProps>
  plazas: FeatureCollection<Polygon | MultiPolygon>
}

/** Referencia de cada andén de la arista `edgeId` (solo los lados que existen). */
export function sideReferences(edgeId: number, input: SideReferenceInput): Partial<Record<SideLetter, SideReference>> {
  const edge = input.red.features.find((f) => f.properties.id === edgeId)
  if (!edge) return {}
  const coords = edge.geometry.coordinates
  const toXY = planar(coords[0][1])
  const axis = coords.map(toXY)
  const center = midpoint(axis)
  const tangent = unit(sub(axis[axis.length - 1], axis[0]))

  const sides = input.aceras.features.filter((f) => f.properties.arista === edgeId)
  const normals = new Map<SideLetter, { point: XY; normal: XY; orientation: Orientation }>()
  for (const side of sides) {
    const point = midpoint(side.geometry.coordinates.map(toXY))
    normals.set(side.properties.lado, { point, normal: unit(sub(point, center)), orientation: side.properties.orientacion })
  }
  if (normals.size === 0) return {}

  // 1. Plaza o parque al lado de uno de los andenes (el más cercano, y claramente más cerca que el otro).
  const spaces = input.plazas.features
    .map((f) => ({ kind: openSpaceKind(typeof f.properties?.nombre === 'string' ? f.properties.nombre : undefined), rings: polygonRings(f).map((ring) => ring.map(toXY)) }))
    .filter((space): space is { kind: OpenSpace; rings: XY[][] } => space.kind !== null)
  let nearest: { side: SideLetter; space: OpenSpace; distance: number } | null = null
  const distances = new Map<SideLetter, number>()
  for (const [letter, { point }] of normals) {
    for (const space of spaces) {
      const distance = distanceToPolygon(point, space.rings)
      distances.set(letter, Math.min(distances.get(letter) ?? Infinity, distance))
      if (distance <= OPEN_SPACE_NEAR_M && (!nearest || distance < nearest.distance)) nearest = { side: letter, space: space.kind, distance }
    }
  }
  if (nearest) {
    const others = [...normals.keys()].filter((letter) => letter !== nearest.side)
    if (others.every((letter) => (distances.get(letter) ?? Infinity) > nearest.distance + 5)) {
      const result: Partial<Record<SideLetter, SideReference>> = { [nearest.side]: { kind: 'espacio', space: nearest.space } }
      for (const letter of others) result[letter] = { kind: 'enfrente', space: nearest.space }
      return result
    }
  }

  // 2. La calle paralela más cercana de cada lado; si no hay, el costado.
  const ownName = edge.properties.nombre.trim()
  const result: Partial<Record<SideLetter, SideReference>> = {}
  for (const [letter, { normal, orientation }] of normals) {
    let best: { street: string; distance: number } | null = null
    for (const other of input.red.features) {
      const name = other.properties.nombre.trim()
      if (!name || name === ownName || other.properties.id === edgeId) continue
      const xy = other.geometry.coordinates.map(toXY)
      const direction = unit(sub(xy[xy.length - 1], xy[0]))
      if (Math.abs(dot(direction, tangent)) < Math.cos((PARALLEL_MAX_DEG * Math.PI) / 180)) continue
      const offset = sub(midpoint(xy), center)
      const across = dot(offset, normal)
      const along = Math.abs(dot(offset, tangent))
      if (across <= 10 || across > PARALLEL_STREET_MAX_M || along > PARALLEL_STREET_MAX_M) continue
      if (!best || across < best.distance) best = { street: abbreviate(name), distance: across }
    }
    result[letter] = best ? { kind: 'calle', street: best.street } : { kind: 'costado', orientation }
  }
  return result
}

function polygonRings(feature: Feature<Polygon | MultiPolygon>): Position[][] {
  return feature.geometry.type === 'Polygon' ? feature.geometry.coordinates : feature.geometry.coordinates.flat()
}
