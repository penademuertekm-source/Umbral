// API del motor de sombra para la app: promesas sobre el Web Worker.
import type { TimedShadeResult, WorkerRequest, WorkerResponse, WorkerResult } from './mensajes'
import {
  CHANNEL_CODES,
  STATE_CODES,
  sideKey,
  type ProfilePoint,
  type ShadeOptions,
  type ShadeUntil,
  type Side,
  type SideLetter,
  type SideShade,
} from './modelo'

export interface ResultadoSombra extends TimedShadeResult {
  /** Sombra de un lado de acera (o undefined si no existe). */
  lado(arista: number, lado: SideLetter): SideShade | undefined
}

type Pending = { resolve: (value: WorkerResult) => void; reject: (error: Error) => void }
type RequestBody = WorkerRequest extends infer R ? (R extends WorkerRequest ? Omit<R, 'id'> : never) : never

let worker: Worker | null = null
let nextId = 1
const pending = new Map<number, Pending>()
let sides: Promise<{ list: Side[]; index: Map<string, number> }> | null = null

function getWorker(): Worker {
  if (worker) return worker
  worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const response = event.data
    const waiting = pending.get(response.id)
    if (!waiting) return
    pending.delete(response.id)
    if (response.ok) waiting.resolve(response.result)
    else waiting.reject(new Error(response.error))
  }
  worker.onerror = (event) => {
    const error = new Error(event.message || 'Error en el motor de sombra')
    for (const waiting of pending.values()) waiting.reject(error)
    pending.clear()
  }
  return worker
}

function request<T extends WorkerResult>(body: RequestBody): Promise<T> {
  const id = nextId++
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as (value: WorkerResult) => void, reject })
    getWorker().postMessage({ ...body, id } as WorkerRequest)
  })
}

function getSides() {
  sides ??= request<Side[]>({ type: 'lados' }).then((list) => ({
    list,
    index: new Map(list.map((s, i) => [sideKey(s.edge, s.side), i])),
  }))
  return sides
}

export const motorSombra = {
  /** Lados de acera en el orden de los resultados. */
  async lados(): Promise<Side[]> {
    return (await getSides()).list
  },

  /** Sombra de todo el centro a una hora (se calcula al cuarto de hora y queda en caché). */
  async calcular(fechaHora: Date, opciones: ShadeOptions = {}): Promise<ResultadoSombra> {
    const [{ index }, result] = await Promise.all([
      getSides(),
      request<TimedShadeResult>({ type: 'calcular', time: fechaHora.getTime(), options: opciones }),
    ])
    return {
      ...result,
      lado(arista, lado) {
        const i = index.get(sideKey(arista, lado))
        if (i === undefined) return undefined
        return {
          fraction: result.fraction[i],
          state: STATE_CODES[result.state[i]],
          channel: CHANNEL_CODES[result.channel[i]],
        }
      },
    }
  },

  /** ¿Hasta qué hora sigue en sombra plena? null si no está en sombra plena en `desde`. */
  sombraHasta(arista: number, lado: SideLetter, desde: Date, opciones: ShadeOptions = {}): Promise<ShadeUntil | null> {
    return request({ type: 'sombraHasta', edge: arista, side: lado, time: desde.getTime(), options: opciones })
  },

  /** % de sombra cada 15 min de 6:00 a 18:00 del día de `fecha`. */
  perfilDelDia(arista: number, lado: SideLetter, fecha: Date, opciones: ShadeOptions = {}): Promise<ProfilePoint[]> {
    return request({ type: 'perfilDelDia', edge: arista, side: lado, time: fecha.getTime(), options: opciones })
  },
}
