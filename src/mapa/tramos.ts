// Lógica de la ficha de tramo (pantalla 07): nombre, árboles cercanos y acera protegida. Código puro.
import type { Feature, FeatureCollection, LineString, Point } from 'geojson'
import type { SideLetter } from '../sombra/modelo'
import type { EdgeProps, Species, TreeProps } from './datos'

/** Distancia máxima de un árbol al eje para contarlo en el arbolado del tramo (m). */
export const TREE_DISTANCE_M = 12

export interface EdgeIndex {
  byId: Map<number, Feature<LineString, EdgeProps>>
  byNode: Map<number, number[]>
}

export function indexEdges(red: FeatureCollection<LineString, EdgeProps>): EdgeIndex {
  const byId = new Map<number, Feature<LineString, EdgeProps>>()
  const byNode = new Map<number, number[]>()
  for (const feature of red.features) {
    const { id, u, v } = feature.properties
    byId.set(id, feature)
    for (const node of [u, v]) byNode.set(node, [...(byNode.get(node) ?? []), id])
  }
  return { byId, byNode }
}

const ABBREVIATIONS: [RegExp, string][] = [
  [/^Carrera\b/i, 'Cra.'],
  [/^Avenida\b/i, 'Av.'],
  [/^Diagonal\b/i, 'Dg.'],
  [/^Transversal\b/i, 'Tv.'],
]

/** "Carrera 5" → "Cra. 5", como en Figma ("Calle 16 entre Cra. 5 y Cra. 6"). */
export function abbreviate(name: string): string {
  for (const [pattern, short] of ABBREVIATIONS) if (pattern.test(name)) return name.replace(pattern, short)
  return name
}

export interface SegmentName {
  street: string
  /** Calles que cruzan en cada extremo (0, 1 o 2), abreviadas. */
  crossings: string[]
}

/** Nombre del tramo y las calles que lo cortan en sus dos esquinas. */
export function segmentName(edgeId: number, index: EdgeIndex): SegmentName {
  const edge = index.byId.get(edgeId)
  if (!edge) return { street: '', crossings: [] }
  const street = edge.properties.nombre
  const crossings: string[] = []
  for (const node of [edge.properties.u, edge.properties.v]) {
    const other = (index.byNode.get(node) ?? [])
      .map((id) => index.byId.get(id)?.properties.nombre ?? '')
      .find((name) => name && name !== street)
    if (other && !crossings.includes(abbreviate(other))) crossings.push(abbreviate(other))
  }
  return { street, crossings }
}

export type TreeCounts = Record<Species, number>

/** Metros por grado en la latitud de Valledupar (aproximación plana, suficiente a escala de calle). */
function metersPerDegree(lat: number): [number, number] {
  return [111_320 * Math.cos((lat * Math.PI) / 180), 110_574]
}

function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax
  const dy = by - ay
  const length2 = dx * dx + dy * dy
  const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length2))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

/**
 * Árboles de cada arista: cada árbol cuenta para la arista más cercana, si está a menos de 12 m de su eje.
 * Usa una rejilla de 50 m para no comparar cada árbol con todas las calles.
 */
export function treesByEdge(
  red: FeatureCollection<LineString, EdgeProps>,
  trees: FeatureCollection<Point, TreeProps>,
  maxDistance = TREE_DISTANCE_M,
): Map<number, TreeCounts> {
  const result = new Map<number, TreeCounts>()
  if (red.features.length === 0) return result
  const lat0 = red.features[0].geometry.coordinates[0][1]
  const [mx, my] = metersPerDegree(lat0)
  const cell = 50
  const grid = new Map<string, { id: number; ax: number; ay: number; bx: number; by: number }[]>()
  const key = (x: number, y: number) => `${Math.floor(x / cell)}:${Math.floor(y / cell)}`

  for (const edge of red.features) {
    const coords = edge.geometry.coordinates.map(([lon, lat]) => [lon * mx, lat * my])
    for (let i = 1; i < coords.length; i++) {
      const [ax, ay] = coords[i - 1]
      const [bx, by] = coords[i]
      const segment = { id: edge.properties.id, ax, ay, bx, by }
      const x0 = Math.floor((Math.min(ax, bx) - maxDistance) / cell)
      const x1 = Math.floor((Math.max(ax, bx) + maxDistance) / cell)
      const y0 = Math.floor((Math.min(ay, by) - maxDistance) / cell)
      const y1 = Math.floor((Math.max(ay, by) + maxDistance) / cell)
      for (let gx = x0; gx <= x1; gx++)
        for (let gy = y0; gy <= y1; gy++) grid.set(`${gx}:${gy}`, [...(grid.get(`${gx}:${gy}`) ?? []), segment])
    }
  }

  for (const tree of trees.features) {
    const [lon, lat] = tree.geometry.coordinates
    const px = lon * mx
    const py = lat * my
    let best: { id: number; d: number } | null = null
    for (const s of grid.get(key(px, py)) ?? []) {
      const d = distanceToSegment(px, py, s.ax, s.ay, s.bx, s.by)
      if (d <= maxDistance && (!best || d < best.d)) best = { id: s.id, d }
    }
    if (!best) continue
    const counts = result.get(best.id) ?? { mango: 0, canaguate: 0, otro: 0 }
    counts[tree.properties.especie in counts ? tree.properties.especie : 'otro']++
    result.set(best.id, counts)
  }
  return result
}

export type ProtectedSide = SideLetter | 'ambas' | 'ninguna'

/** Lado con más sombra; "ninguna" si ninguno llega a parcial (30 %), "ambas" si quedan casi iguales. */
export function protectedSide(fractionA: number | undefined, fractionB: number | undefined): ProtectedSide {
  const a = fractionA ?? 0
  const b = fractionB ?? 0
  if (Math.max(a, b) < 0.3) return 'ninguna'
  if (Math.abs(a - b) < 0.1) return 'ambas'
  return a > b ? 'a' : 'b'
}
