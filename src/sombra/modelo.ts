// Modelo de sombra (CLAUDE.md, "Modelo de sombra"). Código puro: no usa el DOM ni la red,
// así que corre igual en el Web Worker y en las pruebas.
//
// Un punto de acera está en sombra si la elevación del sol es menor que su horizonte en el sector del
// azimut del sol, en algún canal activo (edificios, árboles perennes y, fuera de los meses sin hojas,
// árboles caducifolios). Si el sol está en el horizonte o por debajo, el punto queda "sin sol".

import { getPosition } from 'suncalc'
import type { SegmentState } from '../config/niveles'
import { classifySegment, DAY_PROFILE, LEAFLESS_MONTHS, SHADE_UNTIL_STEP_MIN } from '../config/umbrales'
import { atLocalTime, localParts } from './tiempo'

export type SideLetter = 'a' | 'b'
export type SideState = SegmentState | 'sin_sol'
export type ShadeChannel = 'ninguno' | 'edificio' | 'arbol' | 'mixto'
/** automatica: cañaguates sin hojas en los meses de LEAFLESS_MONTHS · seca: sin hojas · lluvias: con hojas */
export type Season = 'automatica' | 'seca' | 'lluvias'

export interface ShadeOptions {
  season?: Season
}

/** Códigos de los arreglos del resultado (Uint8Array), en este orden. */
export const STATE_CODES: readonly SideState[] = ['sombra', 'parcial', 'expuesto', 'sin_sol']
export const CHANNEL_CODES: readonly ShadeChannel[] = ['ninguno', 'edificio', 'arbol', 'mixto']

/** Índice de public/datos/muestras.json (Fase 2). */
export interface SampleIndex {
  cantidad: number
  sectores: number
  paso_grados: number
  canales: string[]
  bytes_por_muestra: number
  archivo?: string
  compresion?: string
  lon: number[]
  lat: number[]
  arista: number[]
  lado: SideLetter[]
  svf: number[]
}

/** Un lado de acera: sus muestras ocupan [start, start + count) en el arreglo de perfiles. */
export interface Side {
  edge: number
  side: SideLetter
  start: number
  count: number
}

export interface ShadeModel {
  profiles: Uint8Array
  sampleCount: number
  channelCount: number
  sectorCount: number
  stepDeg: number
  sides: Side[]
  /** "arista:lado" → posición en `sides` y en los arreglos del resultado. */
  sideIndex: Map<string, number>
  /** Centro de las muestras: el sol se calcula aquí (en 1,5 km la diferencia no importa). */
  lat: number
  lon: number
}

export interface SunPosition {
  /** Grados desde el norte, sentido horario. */
  azimuth: number
  /** Elevación aparente en grados. */
  elevation: number
}

export interface ShadeResult {
  /** Instante calculado (ms desde 1970). */
  time: number
  sun: SunPosition
  noSun: boolean
  deciduousActive: boolean
  /** Por lado de acera, en el orden de `ShadeModel.sides`. */
  fraction: Float32Array
  state: Uint8Array
  channel: Uint8Array
  counts: Record<SideState, number>
}

export interface SideShade {
  fraction: number
  state: SideState
  channel: ShadeChannel
}

export function sideKey(edge: number, side: SideLetter): string {
  return `${edge}:${side}`
}

export function buildModel(index: SampleIndex, profiles: Uint8Array): ShadeModel {
  const channelCount = index.canales.length
  const expected = index.cantidad * channelCount * index.sectores
  if (profiles.length !== expected) {
    throw new Error(`Perfiles incompletos: ${profiles.length} bytes en lugar de ${expected}`)
  }
  // Las muestras de cada lado son contiguas (la Fase 2 las escribe así).
  const sides: Side[] = []
  for (let i = 0; i < index.cantidad; i++) {
    const last = sides[sides.length - 1]
    if (last && last.edge === index.arista[i] && last.side === index.lado[i]) last.count++
    else sides.push({ edge: index.arista[i], side: index.lado[i], start: i, count: 1 })
  }
  const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / (values.length || 1)
  return {
    profiles,
    sampleCount: index.cantidad,
    channelCount,
    sectorCount: index.sectores,
    stepDeg: index.paso_grados,
    sides,
    sideIndex: new Map(sides.map((s, i) => [sideKey(s.edge, s.side), i])),
    lat: mean(index.lat),
    lon: mean(index.lon),
  }
}

export function sunPosition(model: Pick<ShadeModel, 'lat' | 'lon'>, date: Date): SunPosition {
  const { azimuth, altitude } = getPosition(date, model.lat, model.lon)
  return { azimuth, elevation: altitude }
}

export function deciduousActive(date: Date, season: Season = 'automatica'): boolean {
  if (season === 'seca') return false
  if (season === 'lluvias') return true
  return !LEAFLESS_MONTHS.includes(localParts(date).month)
}

/** Estado de un lado para una posición del sol ya calculada. */
function shadeOfSide(model: ShadeModel, side: Side, sun: SunPosition, deciduous: boolean): SideShade {
  if (sun.elevation <= 0) return { fraction: 1, state: 'sin_sol', channel: 'ninguno' }
  const { profiles, channelCount, sectorCount, stepDeg } = model
  const sector = Math.floor((((sun.azimuth % 360) + 360) % 360) / (360 / sectorCount)) % sectorCount
  // Horizonte codificado en pasos de stepDeg: en sombra si elevación < valor × stepDeg.
  const limit = sun.elevation / stepDeg
  const stride = channelCount * sectorCount
  let byBuilding = 0
  let byTreeOnly = 0
  for (let i = side.start, base = side.start * stride + sector; i < side.start + side.count; i++, base += stride) {
    if (profiles[base] > limit) byBuilding++
    else if (profiles[base + sectorCount] > limit || (deciduous && profiles[base + 2 * sectorCount] > limit)) {
      byTreeOnly++
    }
  }
  const shaded = byBuilding + byTreeOnly
  const fraction = shaded / side.count
  let channel: ShadeChannel = 'ninguno'
  if (shaded > 0) {
    const buildingShare = byBuilding / shaded
    channel = buildingShare >= 0.7 ? 'edificio' : buildingShare <= 0.3 ? 'arbol' : 'mixto'
  }
  return { fraction, state: classifySegment(fraction), channel }
}

/** Sombra de todos los lados de acera a una hora. */
export function computeShade(model: ShadeModel, date: Date, options: ShadeOptions = {}): ShadeResult {
  const sun = sunPosition(model, date)
  const deciduous = deciduousActive(date, options.season)
  const n = model.sides.length
  const fraction = new Float32Array(n)
  const state = new Uint8Array(n)
  const channel = new Uint8Array(n)
  const counts: Record<SideState, number> = { sombra: 0, parcial: 0, expuesto: 0, sin_sol: 0 }
  for (let i = 0; i < n; i++) {
    const result = shadeOfSide(model, model.sides[i], sun, deciduous)
    fraction[i] = result.fraction
    state[i] = STATE_CODES.indexOf(result.state)
    channel[i] = CHANNEL_CODES.indexOf(result.channel)
    counts[result.state]++
  }
  return { time: date.getTime(), sun, noSun: sun.elevation <= 0, deciduousActive: deciduous, fraction, state, channel, counts }
}

/** Sombra de un solo lado de acera a una hora. */
export function sideShadeAt(model: ShadeModel, sideIdx: number, date: Date, options: ShadeOptions = {}): SideShade {
  return shadeOfSide(model, model.sides[sideIdx], sunPosition(model, date), deciduousActive(date, options.season))
}

export interface ShadeUntil {
  /** Primer instante (cada 5 min) en que el lado deja de estar en sombra plena. */
  until: number
  /** true si la sombra dura hasta que se oculta el sol. */
  untilSunset: boolean
}

/**
 * ¿Hasta qué hora sigue en sombra plena? Para "Sombra plena hasta la 1:20 p. m.".
 * Devuelve null si el lado no está en sombra plena en `from`.
 */
export function shadeUntil(
  model: ShadeModel,
  sideIdx: number,
  from: Date,
  options: ShadeOptions = {},
): ShadeUntil | null {
  if (sideShadeAt(model, sideIdx, from, options).state !== 'sombra') return null
  const stepMs = SHADE_UNTIL_STEP_MIN * 60 * 1000
  const limit = from.getTime() + 24 * 60 * 60 * 1000
  for (let t = from.getTime() + stepMs; t <= limit; t += stepMs) {
    const { state } = sideShadeAt(model, sideIdx, new Date(t), options)
    if (state === 'sin_sol') return { until: t, untilSunset: true }
    if (state !== 'sombra') return { until: t, untilSunset: false }
  }
  return { until: limit, untilSunset: true }
}

export interface ProfilePoint {
  time: number
  fraction: number
  state: SideState
}

/** % de sombra de un lado cada 15 min de 6:00 a 18:00 del día de `date` (hora de Valledupar). */
export function dayProfile(model: ShadeModel, sideIdx: number, date: Date, options: ShadeOptions = {}): ProfilePoint[] {
  const points: ProfilePoint[] = []
  const start = atLocalTime(date, DAY_PROFILE.startHour).getTime()
  const end = atLocalTime(date, DAY_PROFILE.endHour).getTime()
  for (let t = start; t <= end; t += DAY_PROFILE.stepMin * 60 * 1000) {
    const { fraction, state } = sideShadeAt(model, sideIdx, new Date(t), options)
    points.push({ time: t, fraction, state })
  }
  return points
}
