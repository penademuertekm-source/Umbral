// @vitest-environment node
// Rutas con los datos reales de public/datos: el grafo está conectado y el cálculo es rápido.
import { readFile } from 'node:fs/promises'
import type { FeatureCollection, LineString } from 'geojson'
import { describe, expect, it } from 'vitest'
import { ROUTE_PROFILES } from '../config/rutas'
import type { EdgeProps, SidewalkProps } from '../mapa/datos'
import { loadModel } from '../sombra/cargar'
import { computeShade } from '../sombra/modelo'
import { localDate } from '../sombra/tiempo'
import { buildGraph, snap } from './grafo'
import { isochrones } from './isocronas'
import { findRoute, type CostModel } from './rutas'

const DATOS = new URL('../../public/datos/', import.meta.url)
const json = async <T,>(file: string) => JSON.parse(await readFile(new URL(file, DATOS), 'utf8')) as T
const fetchLocal = async (url: string) => new Response(await readFile(new URL(url, DATOS)))

describe('rutas con los datos reales', async () => {
  const model = await loadModel('', fetchLocal)
  const red = await json<FeatureCollection<LineString, EdgeProps>>('red.geojson')
  const aceras = await json<FeatureCollection<LineString, SidewalkProps>>('aceras.geojson')
  const t0 = performance.now()
  const graph = buildGraph(red, aceras, model.sides)
  const buildMs = performance.now() - t0
  const plaza = snap(graph, [-73.244632, 10.477751])!
  const callejon = snap(graph, [-73.24644, 10.47895])!

  const costModel = (date: Date, mode: CostModel['mode']): CostModel => {
    const result = computeShade(model, date)
    return {
      mode,
      profile: ROUTE_PROFILES.estandar,
      shade: (s) => {
        const i = graph.segments[s].shadeIndex
        return i < 0 ? 0 : result.fraction[i]
      },
    }
  }

  it('el grafo une todas las aceras con esquinas y cruces', () => {
    const kinds = graph.links.flat().reduce<Record<string, number>>((acc, l) => ({ ...acc, [l.kind]: (acc[l.kind] ?? 0) + 1 }), {})
    console.info(`[medición] grafo: ${graph.segments.length} aceras, ${JSON.stringify(kinds)}, ${buildMs.toFixed(1)} ms`)
    expect(graph.segments).toHaveLength(aceras.features.length)
    expect(kinds.esquina).toBeGreaterThan(500)
    expect(kinds.cruce).toBeGreaterThan(500)
  })

  it('calcula la ruta de la Plaza al Callejón de la Purrututú a mediodía y en la tarde, rápido', () => {
    const noon = localDate(2026, 10, 6, 12)
    const afternoon = localDate(2026, 10, 6, 16)
    const t = performance.now()
    const short = findRoute(graph, plaza, callejon, costModel(noon, 'corta'))!
    const shadeNoon = findRoute(graph, plaza, callejon, costModel(noon, 'sombra'))!
    const shadeAfternoon = findRoute(graph, plaza, callejon, costModel(afternoon, 'sombra'))!
    const ms = (performance.now() - t) / 3
    console.info(
      `[medición] ruta: ${ms.toFixed(1)} ms · corta ${Math.round(short.meters)} m · sombra 12 m. ${Math.round(shadeNoon.meters)} m ${Math.round(shadeNoon.shadePercent)} % · 4 p. m. ${Math.round(shadeAfternoon.meters)} m ${Math.round(shadeAfternoon.shadePercent)} %`,
    )
    expect(short.meters).toBeGreaterThan(150)
    expect(short.meters).toBeLessThan(600)
    expect(shadeNoon.shadePercent).toBeGreaterThanOrEqual(short.shadePercent - 1e-9)
    expect(ms).toBeLessThan(100)
  })

  it('las isócronas de 5, 10 y 15 min desde la Plaza cubren buena parte del centro', () => {
    const t = performance.now()
    const bands = isochrones(graph, plaza, costModel(localDate(2026, 10, 6, 16), 'sombra'), [5, 10, 15])
    const ms = performance.now() - t
    const count = (b: number) => bands.features.filter((f) => f.properties.band === b).length
    console.info(`[medición] isócronas: ${ms.toFixed(1)} ms · tramos por banda ${count(1)} / ${count(2)} / ${count(3)}`)
    expect(count(1)).toBeGreaterThan(0)
    expect(count(2)).toBeGreaterThan(count(1) / 2)
    expect(ms).toBeLessThan(300)
  })
})
