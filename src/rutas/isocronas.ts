// Isócronas (Fase 6): hasta dónde se llega en 5, 10 y 15 minutos caminando, con el costo de sombra
// (los minutos al sol "pesan" más). Se dibujan sobre la red de aceras, recortando cada acera donde
// cambia de banda. Código puro.
import type { Feature, FeatureCollection, LineString } from 'geojson'
import { slice } from './geometria'
import type { Graph, Snap } from './grafo'
import { dijkstra, type CostModel } from './rutas'

export interface IsochroneProps {
  /** 1 = primera banda (hasta 5 min), 2, 3… */
  band: number
}

/** Cada cuántos metros se evalúa el costo a lo largo de una acera. */
const STEP_M = 2

export function isochrones(
  graph: Graph,
  origin: Snap,
  model: CostModel,
  bandsMinutes: readonly number[],
): FeatureCollection<LineString, IsochroneProps> {
  const O = graph.links.length
  const s0 = origin.segment
  const segment0 = graph.segments[s0]
  const extra = new Map([
    [
      O,
      [
        { to: 2 * s0, length: origin.along, kind: 'acera' as const, segment: s0, fromAlong: origin.along, toAlong: 0 },
        {
          to: 2 * s0 + 1,
          length: segment0.length - origin.along,
          kind: 'acera' as const,
          segment: s0,
          fromAlong: origin.along,
          toAlong: segment0.length,
        },
      ],
    ],
  ])
  const { dist } = dijkstra(graph, O, extra, model, O + 1)
  const limits = bandsMinutes.map((m) => m * 60)
  const max = limits[limits.length - 1]
  const { speed, sunPenalty } = model.profile
  const features: Feature<LineString, IsochroneProps>[] = []

  graph.segments.forEach((segment, s) => {
    const c0 = dist[2 * s]
    const c1 = dist[2 * s + 1]
    const fromOrigin = s === s0
    if (!fromOrigin && Math.min(c0, c1) > max) return
    // Costo por metro sobre esta acera (con la ruta "corta" vale 1/velocidad).
    const perMeter = model.mode === 'corta' ? 1 / speed : (1 + sunPenalty * (1 - model.shade(s))) / speed
    const costAt = (x: number) => {
      let c = Math.min(c0 + perMeter * x, c1 + perMeter * (segment.length - x))
      if (fromOrigin) c = Math.min(c, perMeter * Math.abs(x - origin.along))
      return c
    }
    const bandAt = (x: number) => {
      const c = costAt(x)
      const i = limits.findIndex((limit) => c <= limit)
      return i < 0 ? 0 : i + 1
    }
    const steps = Math.max(1, Math.ceil(segment.length / STEP_M))
    let runStart = 0
    let runBand = bandAt(0)
    for (let k = 1; k <= steps; k++) {
      const x = Math.min(segment.length, k * STEP_M)
      const band = k === steps ? -1 : bandAt(x)
      if (band !== runBand) {
        const end = k === steps ? segment.length : x - STEP_M / 2
        if (runBand > 0 && end > runStart) {
          features.push({
            type: 'Feature',
            properties: { band: runBand },
            geometry: {
              type: 'LineString',
              coordinates: slice(segment.xy, segment.cum, runStart, end).map((p) => graph.projection.toLonLat(p)),
            },
          })
        }
        runStart = end
        runBand = band
      }
    }
  })
  return { type: 'FeatureCollection', features }
}
