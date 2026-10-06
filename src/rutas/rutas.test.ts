import type { FeatureCollection, LineString } from 'geojson'
import { describe, expect, it } from 'vitest'
import type { HeatLevel } from '../config/reglas-semaforo'
import type { EdgeProps, SidewalkProps } from '../mapa/datos'
import type { Side, SideLetter } from '../sombra/modelo'
import { projection, type LonLat, type XY } from './geometria'
import { buildGraph, snap, type Graph } from './grafo'
import { isochrones } from './isocronas'
import { findRoute, singleRoute, type CostModel, type Route, type RoutePiece } from './rutas'
import { bestWindows, shadedTail, suggestedWindow, type Departure } from './salidas'

// Una manzana de 100 × 300 m. Carreras en x = 0 y x = 100; calles en y = 0 y y = 300 (metros).
//
//   3 ─── e1 ─── 4      y = 300
//   │             │
//   e2   manzana  e3
//   │             │
//   1 ─── e0 ─── 2      y = 0
//
// Aceras a 4 m del eje: "a" a la izquierda del sentido u→v, "b" a la derecha.
const proj = projection(10.4778, -73.2446)
const ll = (p: XY): LonLat => proj.toLonLat(p)
const NODES: Record<number, XY> = { 1: [0, 0], 2: [100, 0], 3: [0, 300], 4: [100, 300] }
const EDGES: [id: number, u: number, v: number, name: string][] = [
  [0, 1, 2, 'Calle 1'],
  [1, 3, 4, 'Calle 2'],
  [2, 1, 3, 'Carrera 1'],
  [3, 2, 4, 'Carrera 2'],
]

function offset(a: XY, b: XY, d: number): [XY, XY] {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1])
  const nx = -(b[1] - a[1]) / len
  const ny = (b[0] - a[0]) / len
  return [
    [a[0] + nx * d, a[1] + ny * d],
    [b[0] + nx * d, b[1] + ny * d],
  ]
}

const red: FeatureCollection<LineString, EdgeProps> = {
  type: 'FeatureCollection',
  features: EDGES.map(([id, u, v, nombre]) => ({
    type: 'Feature',
    properties: { id, u, v, nombre, tipo: 'residential', longitud_m: 0, lados: [] },
    geometry: { type: 'LineString', coordinates: [ll(NODES[u]), ll(NODES[v])] },
  })),
}
const aceras: FeatureCollection<LineString, SidewalkProps> = {
  type: 'FeatureCollection',
  features: EDGES.flatMap(([id, u, v]) =>
    (['a', 'b'] as SideLetter[]).map((lado) => ({
      type: 'Feature' as const,
      properties: { id: `${id}${lado}`, arista: id, lado, orientacion: 'norte' as const },
      geometry: { type: 'LineString' as const, coordinates: offset(NODES[u], NODES[v], lado === 'a' ? 4 : -4).map(ll) },
    })),
  ),
}
const sides: Side[] = EDGES.flatMap(([id]) => (['a', 'b'] as SideLetter[]).map((side) => ({ edge: id, side, start: 0, count: 1 })))
const graph = buildGraph(red, aceras, sides)
const segmentOf = (edge: number, side: SideLetter) => graph.segments.findIndex((s) => s.edge === edge && s.side === side)

// Aceras interiores de la manzana en sombra, salvo la de la Carrera 2 (e3 a), que va directo y al sol.
const SHADED = new Set([segmentOf(0, 'a'), segmentOf(2, 'b'), segmentOf(1, 'b')])
const vulnerable = { speed: 1, sunPenalty: 3 }
const model = (mode: CostModel['mode']): CostModel => ({ mode, profile: vulnerable, shade: (s) => (SHADED.has(s) ? 1 : 0) })
const origin = snap(graph, ll([96, 20]))!
const destination = snap(graph, ll([96, 280]))!

function linkKind(g: Graph, from: number, to: number) {
  return g.links[from].find((l) => l.to === to)?.kind
}

describe('grafo de aceras', () => {
  it('tiene una acera por lado y une esquinas y cruces según la geometría', () => {
    expect(graph.segments).toHaveLength(8)
    // En el nodo 2: la acera norte de la Calle 1 (e0 a, fin) y la occidental de la Carrera 2 (e3 a, inicio)
    // comparten la esquina interior; para pasar a la acera sur hay que cruzar la Calle 1.
    const e0aEnd = 2 * segmentOf(0, 'a') + 1
    const e0bEnd = 2 * segmentOf(0, 'b') + 1
    const e3aStart = 2 * segmentOf(3, 'a')
    const e3bStart = 2 * segmentOf(3, 'b')
    expect(linkKind(graph, e0aEnd, e3aStart)).toBe('esquina')
    expect(linkKind(graph, e0aEnd, e0bEnd)).toBe('cruce')
    expect(linkKind(graph, e3aStart, e3bStart)).toBe('cruce')
    expect(linkKind(graph, e0bEnd, e3bStart)).toBe('esquina') // esquina exterior, sin calles al sur ni al oriente
    expect(linkKind(graph, e0aEnd, e3bStart)).toBeUndefined()
  })

  it('reconoce las esquinas por la geometría aunque u y v vengan al revés (como en OSMnx)', () => {
    const swapped = {
      ...red,
      features: red.features.map((f) => ({ ...f, properties: { ...f.properties, u: f.properties.v, v: f.properties.u } })),
    }
    const other = buildGraph(swapped, aceras, sides)
    expect(other.links.map((list) => list.map((l) => `${l.to}:${l.kind}`).sort())).toEqual(
      graph.links.map((list) => list.map((l) => `${l.to}:${l.kind}`).sort()),
    )
  })

  it('proyecta un punto sobre la acera más cercana', () => {
    expect(origin.segment).toBe(segmentOf(3, 'a'))
    expect(origin.along).toBeCloseTo(20, 0)
    expect(origin.distance).toBeLessThan(1)
  })
})

describe('rutas', () => {
  const shortest = findRoute(graph, origin, destination, model('corta'))!
  const shaded = findRoute(graph, origin, destination, model('sombra'))!

  it('la corta va derecho; la de sombra rodea la manzana por las aceras con sombra', () => {
    expect(shortest.meters).toBeCloseTo(260, 0)
    expect(shortest.shadePercent).toBe(0)
    expect(shaded.meters).toBeGreaterThan(500)
    expect(shaded.shadePercent).toBeGreaterThan(85)
    expect(shaded.sunMinutes).toBeLessThan(shortest.sunMinutes)
    expect(shaded.pieces.some((p) => p.kind === 'cruce')).toBe(false)
  })

  it('reporta minutos, minutos al sol y tramos expuestos con su posición', () => {
    expect(shortest.minutes).toBeCloseTo(260 / 60, 1)
    expect(shortest.sunMinutes).toBeCloseTo(260 / 60, 1)
    expect(shortest.exposed).toHaveLength(1)
    expect(shortest.exposed[0].startMeters).toBe(0)
    expect(shortest.exposed[0].length).toBeCloseTo(260, 0)
    expect(shortest.edges).toEqual([3])
    expect(shaded.edges.sort()).toEqual([0, 1, 2, 3])
  })

  it('muestra una sola ruta si la de sombra no mejora al menos 15 % los minutos al sol', () => {
    expect(singleRoute(shortest, shaded, 0.15)).toBe(false)
    expect(singleRoute(shortest, { ...shortest }, 0.15)).toBe(true)
    expect(singleRoute({ ...shortest, sunMinutes: 0 }, shaded, 0.15)).toBe(true)
  })

  it('las isócronas crecen por banda y llegan más lejos por la sombra', () => {
    const bands = isochrones(graph, origin, model('sombra'), [1, 2, 3])
    const lengthOf = (band: number) =>
      bands.features
        .filter((f) => f.properties.band === band)
        .reduce((sum, f) => {
          const xy = f.geometry.coordinates.map((c) => proj.toXY(c as LonLat))
          return sum + xy.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - xy[i][0], p[1] - xy[i][1]), 0)
        }, 0)
    expect(bands.features.length).toBeGreaterThan(0)
    // Primer minuto al sol (costo ×4): 15 m hacia cada lado del origen sobre la acera expuesta.
    expect(lengthOf(1)).toBeGreaterThan(25)
    expect(lengthOf(1)).toBeLessThan(40)
    expect(lengthOf(2)).toBeGreaterThan(0)
    expect(lengthOf(3)).toBeGreaterThan(0)
  })
})

describe('¿cuándo salir?', () => {
  const route = (sunMinutes: number, shadePercent = 50) => ({ sunMinutes, shadePercent }) as Route
  const dep = (h: number, m: number, sun: number, level: HeatLevel | null = 'comodo'): Departure => ({
    minute: h * 60 + m,
    route: route(sun),
    level,
  })
  const departures = [
    dep(6, 0, 0.5),
    dep(6, 15, 0.8),
    dep(6, 30, 1.4),
    dep(6, 45, 4, 'precaucion'),
    dep(9, 0, 6, 'evitar'),
    dep(12, 0, 7, 'evitar'),
    dep(15, 45, 3, 'precaucion'),
    dep(16, 0, 1.2),
    dep(17, 0, 1),
    dep(18, 0, 1.1),
  ]

  it('encuentra la mejor ventana de la mañana y de la tarde', () => {
    const { morning, afternoon } = bestWindows(departures)
    expect(morning).toMatchObject({ from: 6 * 60, to: 6 * 60 + 30, sunMin: 0.5, sunMax: 1.4, level: 'comodo' })
    expect(afternoon).toMatchObject({ from: 16 * 60, to: 18 * 60, sunMin: 1, level: 'comodo' })
  })

  it('sugiere la próxima ventana; si ya pasaron todas, la mejor', () => {
    const windows = bestWindows(departures)
    expect(suggestedWindow(windows, 11 * 60 + 47)?.part).toBe('tarde')
    expect(suggestedWindow(windows, 5 * 60)?.part).toBe('manana')
    expect(suggestedWindow(windows, 19 * 60)?.part).toBe('manana')
  })
})

describe('transporte hasta la sombra (pantalla 16)', () => {
  const piece = (kind: RoutePiece['kind'], length: number, shade: number, at: number): RoutePiece => ({
    kind,
    segment: kind === 'acera' ? 0 : -1,
    length,
    shade,
    coords: [
      [at, 0],
      [at + 1, 0],
    ],
  })
  const routeOf = (pieces: RoutePiece[]) => ({ pieces }) as Route

  it('encuentra el primer punto desde el que el resto va en sombra', () => {
    const tail = shadedTail(routeOf([piece('acera', 50, 0, 0), piece('cruce', 8, 0, 1), piece('acera', 40, 1, 2), piece('esquina', 3, 0, 3), piece('acera', 30, 0.9, 4)]))
    expect(tail).toEqual({ point: [1, 0], walkMeters: 81, pieceIndex: 1 })
  })

  it('no propone transporte si el final está al sol o si toda la ruta ya va en sombra', () => {
    expect(shadedTail(routeOf([piece('acera', 40, 1, 0), piece('acera', 30, 0.1, 1)]))).toBeNull()
    expect(shadedTail(routeOf([piece('acera', 40, 1, 0), piece('acera', 30, 1, 1)]))).toBeNull()
  })
})
