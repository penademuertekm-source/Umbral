// Mensajes entre la app y el Web Worker del motor de sombra.
import type { ShadeOptions, ShadeResult, ShadeUntil, ProfilePoint, Side, SideLetter } from './modelo'

export type WorkerRequest =
  | { id: number; type: 'lados' }
  | { id: number; type: 'calcular'; time: number; options: ShadeOptions }
  | { id: number; type: 'sombraHasta'; edge: number; side: SideLetter; time: number; options: ShadeOptions }
  | { id: number; type: 'perfilDelDia'; edge: number; side: SideLetter; time: number; options: ShadeOptions }

export interface TimedShadeResult extends ShadeResult {
  /** Tiempo del cálculo dentro del worker (ms). */
  ms: number
  /** true si salió de la caché por cuarto de hora. */
  cached: boolean
}

export type WorkerResult = Side[] | TimedShadeResult | ShadeUntil | ProfilePoint[] | null

export type WorkerResponse = { id: number; ok: true; result: WorkerResult } | { id: number; ok: false; error: string }
