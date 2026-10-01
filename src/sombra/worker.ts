// Web Worker del motor de sombra: carga los datos una sola vez y calcula fuera del hilo de la pantalla.
import { loadModel } from './cargar'
import type { WorkerRequest, WorkerResponse, TimedShadeResult } from './mensajes'
import {
  computeShade,
  dayProfile,
  meanSkyViewFactor,
  shadeUntil,
  sideKey,
  type ShadeModel,
  type ShadeOptions,
} from './modelo'
import { floorToQuarter } from './tiempo'

let model: Promise<ShadeModel> | null = null
/** Caché por cuarto de hora: "inicio del cuarto|temporada" → resultado. */
const cache = new Map<string, TimedShadeResult>()
const CACHE_LIMIT = 200

function getModel(): Promise<ShadeModel> {
  model ??= loadModel().catch((error: unknown) => {
    model = null // permite reintentar si falló la red
    throw error
  })
  return model
}

function sideIndex(m: ShadeModel, edge: number, side: 'a' | 'b'): number {
  const index = m.sideIndex.get(sideKey(edge, side))
  if (index === undefined) throw new Error(`No existe el lado ${side} de la arista ${edge}`)
  return index
}

function calculate(m: ShadeModel, time: number, options: ShadeOptions): TimedShadeResult {
  const quarter = floorToQuarter(new Date(time))
  const key = `${quarter.getTime()}|${options.season ?? 'automatica'}`
  const hit = cache.get(key)
  if (hit) return { ...hit, cached: true }
  const start = performance.now()
  const result: TimedShadeResult = { ...computeShade(m, quarter, options), ms: 0, cached: false }
  result.ms = performance.now() - start
  if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!)
  cache.set(key, result)
  return result
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data
  let response: WorkerResponse
  try {
    const m = await getModel()
    switch (request.type) {
      case 'lados':
        response = { id: request.id, ok: true, result: m.sides }
        break
      case 'calcular':
        response = { id: request.id, ok: true, result: calculate(m, request.time, request.options) }
        break
      case 'sombraHasta':
        response = {
          id: request.id,
          ok: true,
          result: shadeUntil(m, sideIndex(m, request.edge, request.side), new Date(request.time), request.options),
        }
        break
      case 'svf':
        response = { id: request.id, ok: true, result: meanSkyViewFactor(m, sideIndex(m, request.edge, request.side)) }
        break
      case 'perfilDelDia':
        response = {
          id: request.id,
          ok: true,
          result: dayProfile(m, sideIndex(m, request.edge, request.side), new Date(request.time), request.options),
        }
        break
    }
  } catch (error) {
    response = { id: request.id, ok: false, error: error instanceof Error ? error.message : String(error) }
  }
  self.postMessage(response)
}
