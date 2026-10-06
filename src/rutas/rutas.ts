// Rutas sobre el grafo de aceras (Fase 6): Dijkstra con dos costos.
//   corta: distancia.
//   sombra: tiempo × (1 + k × fracción al sol). Los cruces cuentan al sol; las esquinas, no.
import { CROSSING_EXTRA_S, type RouteProfile } from '../config/rutas'
import { classifySegment } from '../config/umbrales'
import { slice, type LonLat, type XY } from './geometria'
import { vertexXY, type Graph, type Link, type LinkKind, type Snap } from './grafo'

export type RouteMode = 'corta' | 'sombra'

export interface CostModel {
  mode: RouteMode
  profile: RouteProfile
  /** Fracción en sombra (0–1) de cada acera, por índice de acera del grafo. */
  shade: (segment: number) => number
}

/** Fracción al sol de un enlace: las aceras según el motor de sombra, los cruces al sol, las esquinas no. */
function sunOf(link: Link, model: CostModel): number {
  if (link.kind === 'acera') return 1 - model.shade(link.segment)
  return link.kind === 'cruce' ? 1 : 0
}

function seconds(link: Link, speed: number): number {
  return link.length / speed + (link.kind === 'cruce' ? CROSSING_EXTRA_S : 0)
}

export function linkCost(link: Link, model: CostModel): number {
  const { speed, sunPenalty } = model.profile
  if (model.mode === 'corta') return link.length + (link.kind === 'cruce' ? CROSSING_EXTRA_S * speed : 0)
  return seconds(link, speed) * (1 + sunPenalty * sunOf(link, model))
}

class MinHeap {
  private items: { v: number; d: number }[] = []
  get size() {
    return this.items.length
  }
  push(v: number, d: number) {
    const a = this.items
    a.push({ v, d })
    let i = a.length - 1
    while (i > 0) {
      const p = (i - 1) >> 1
      if (a[p].d <= a[i].d) break
      ;[a[p], a[i]] = [a[i], a[p]]
      i = p
    }
  }
  pop(): { v: number; d: number } {
    const a = this.items
    const top = a[0]
    const last = a.pop()!
    if (a.length > 0) {
      a[0] = last
      let i = 0
      for (;;) {
        const l = 2 * i + 1
        const r = l + 1
        let m = i
        if (l < a.length && a[l].d < a[m].d) m = l
        if (r < a.length && a[r].d < a[m].d) m = r
        if (m === i) break
        ;[a[m], a[i]] = [a[i], a[m]]
        i = m
      }
    }
    return top
  }
}

/** Vértices virtuales para el origen y el destino, sobre su acera. */
function virtualLinks(graph: Graph, at: Snap, self: number, inbound: boolean): Map<number, Link[]> {
  const extra = new Map<number, Link[]>()
  const segment = graph.segments[at.segment]
  const s = at.segment
  const toStart: Link = { to: 2 * s, length: at.along, kind: 'acera', segment: s, fromAlong: at.along, toAlong: 0 }
  const toEnd: Link = {
    to: 2 * s + 1,
    length: segment.length - at.along,
    kind: 'acera',
    segment: s,
    fromAlong: at.along,
    toAlong: segment.length,
  }
  if (!inbound) {
    extra.set(self, [toStart, toEnd])
  } else {
    extra.set(2 * s, [{ ...toStart, to: self, fromAlong: 0, toAlong: at.along }])
    extra.set(2 * s + 1, [{ ...toEnd, to: self, fromAlong: segment.length, toAlong: at.along }])
  }
  return extra
}

function merge(...maps: Map<number, Link[]>[]): Map<number, Link[]> {
  const out = new Map<number, Link[]>()
  for (const map of maps) for (const [k, v] of map) out.set(k, [...(out.get(k) ?? []), ...v])
  return out
}

export interface Search {
  dist: Float64Array
  prev: Int32Array
  prevLink: (Link | null)[]
}

/** Dijkstra desde un vértice (real o virtual) con enlaces extra. Se detiene al llegar a `target` si se da. */
export function dijkstra(
  graph: Graph,
  source: number,
  extra: Map<number, Link[]>,
  model: CostModel,
  vertexCount: number,
  target = -1,
): Search {
  const dist = new Float64Array(vertexCount).fill(Infinity)
  const prev = new Int32Array(vertexCount).fill(-1)
  const prevLink: (Link | null)[] = new Array(vertexCount).fill(null)
  const heap = new MinHeap()
  dist[source] = 0
  heap.push(source, 0)
  while (heap.size > 0) {
    const { v, d } = heap.pop()
    if (d > dist[v]) continue
    if (v === target) break
    const out = v < graph.links.length ? graph.links[v] : []
    for (const link of [...out, ...(extra.get(v) ?? [])]) {
      const nd = d + linkCost(link, model)
      if (nd < dist[link.to]) {
        dist[link.to] = nd
        prev[link.to] = v
        prevLink[link.to] = link
        heap.push(link.to, nd)
      }
    }
  }
  return { dist, prev, prevLink }
}

export interface RoutePiece {
  kind: LinkKind
  /** Acera (-1 en esquinas y cruces). */
  segment: number
  length: number
  /** Fracción en sombra (0–1). */
  shade: number
  coords: LonLat[]
}

export interface ExposedStretch {
  /** Metros desde el inicio de la ruta. */
  startMeters: number
  length: number
  coords: LonLat[]
}

export interface Route {
  mode: RouteMode
  pieces: RoutePiece[]
  meters: number
  minutes: number
  /** % del recorrido en sombra (0–100). */
  shadePercent: number
  /** Minutos caminando al sol directo. */
  sunMinutes: number
  /** Tramos expuestos (sombra < 30 %), con su posición. */
  exposed: ExposedStretch[]
  /** Calles recorridas (para contar los árboles cercanos). */
  edges: number[]
}

/** Ruta del origen al destino con el costo indicado, o null si no hay camino. */
export function findRoute(graph: Graph, origin: Snap, destination: Snap, model: CostModel): Route | null {
  const real = graph.links.length
  const O = real
  const D = real + 1
  const extra = merge(virtualLinks(graph, origin, O, false), virtualLinks(graph, destination, D, true))
  if (origin.segment === destination.segment) {
    extra.get(O)!.push({
      to: D,
      length: Math.abs(destination.along - origin.along),
      kind: 'acera',
      segment: origin.segment,
      fromAlong: origin.along,
      toAlong: destination.along,
    })
  }
  const search = dijkstra(graph, O, extra, model, real + 2, D)
  if (!Number.isFinite(search.dist[D])) return null

  const path: Link[] = []
  for (let v = D; v !== O; v = search.prev[v]) path.push(search.prevLink[v]!)
  path.reverse()

  const position = (v: number): XY =>
    v === O ? graph.projection.toXY(origin.point) : v === D ? graph.projection.toXY(destination.point) : vertexXY(graph, v)
  const pieces: RoutePiece[] = []
  let from = O
  for (const link of path) {
    let xy: XY[]
    if (link.kind === 'acera') {
      const segment = graph.segments[link.segment]
      xy = slice(segment.xy, segment.cum, link.fromAlong, link.toAlong)
    } else {
      xy = [position(from), position(link.to)]
    }
    pieces.push({
      kind: link.kind,
      segment: link.segment,
      length: link.length,
      shade: link.kind === 'acera' ? model.shade(link.segment) : 0,
      coords: xy.map((p) => graph.projection.toLonLat(p)),
    })
    from = link.to
  }
  return summarize(graph, pieces, model)
}

export function summarize(graph: Graph, pieces: RoutePiece[], model: CostModel): Route {
  const { speed } = model.profile
  let meters = 0
  let shaded = 0
  let sunMeters = 0
  let crossings = 0
  const exposed: ExposedStretch[] = []
  const edges = new Set<number>()
  for (const piece of pieces) {
    const start = meters
    meters += piece.length
    if (piece.kind === 'cruce') {
      crossings++
      sunMeters += piece.length
      continue
    }
    if (piece.kind !== 'acera') continue
    edges.add(graph.segments[piece.segment].edge)
    shaded += piece.length * piece.shade
    sunMeters += piece.length * (1 - piece.shade)
    if (piece.length > 0 && classifySegment(piece.shade) === 'expuesto') {
      const last = exposed[exposed.length - 1]
      if (last && Math.abs(last.startMeters + last.length - start) < 0.5) {
        last.length += piece.length
        last.coords = [...last.coords, ...piece.coords.slice(1)]
      } else {
        exposed.push({ startMeters: start, length: piece.length, coords: piece.coords })
      }
    }
  }
  return {
    mode: model.mode,
    pieces,
    meters,
    minutes: (meters / speed + crossings * CROSSING_EXTRA_S) / 60,
    shadePercent: meters > 0 ? (100 * shaded) / meters : 100,
    sunMinutes: sunMeters / speed / 60,
    exposed,
    edges: [...edges],
  }
}

/** ¿Se muestra una sola ruta? Sí, si la de sombra no reduce al menos `minImprovement` los minutos al sol. */
export function singleRoute(shortest: Route, shaded: Route, minImprovement: number): boolean {
  if (shortest.sunMinutes <= 0) return true
  return (shortest.sunMinutes - shaded.sunMinutes) / shortest.sunMinutes < minImprovement
}
