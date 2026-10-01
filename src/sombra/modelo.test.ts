import { describe, expect, it } from 'vitest'
import { classifySegment } from '../config/umbrales'
import {
  buildModel,
  computeShade,
  dayProfile,
  sideShadeAt,
  shadeUntil,
  STATE_CODES,
  type SampleIndex,
  type SideLetter,
} from './modelo'
import { formatTime, localDate, localParts } from './tiempo'

const SECTORS = 72
const CHANNELS = 3
const EDIFICIOS = 0
const CADUCIFOLIOS = 2

/** Modelo sintético: `samples` muestras en un solo lado de acera, con el perfil que diga `horizon`. */
function syntheticModel(samples: number, horizon: (sample: number, channel: number, sector: number) => number) {
  const index: SampleIndex = {
    cantidad: samples,
    sectores: SECTORS,
    paso_grados: 0.5,
    canales: ['edificios', 'arboles_perennes', 'arboles_caducifolios'],
    bytes_por_muestra: CHANNELS * SECTORS,
    lon: Array(samples).fill(-73.2446),
    lat: Array(samples).fill(10.4778),
    arista: Array(samples).fill(0),
    lado: Array<SideLetter>(samples).fill('a'),
    svf: Array(samples).fill(1),
  }
  const profiles = new Uint8Array(samples * CHANNELS * SECTORS)
  for (let i = 0; i < samples; i++)
    for (let c = 0; c < CHANNELS; c++)
      for (let k = 0; k < SECTORS; k++) profiles[(i * CHANNELS + c) * SECTORS + k] = horizon(i, c, k)
  return buildModel(index, profiles)
}

const encode = (degrees: number) => Math.min(180, Math.max(0, Math.round(degrees / 0.5)))
const at = (month: number, day: number, hour: number, minute = 0) => localDate(2026, month, day, hour, minute)

/** Muro infinito de 12 m al oriente, a 5 m: en el azimut a se ve a atan(10,5 · sen a / 5). */
function eastWall(_: number, channel: number, sector: number): number {
  if (channel !== EDIFICIOS) return 0
  const azimuth = ((sector * 5 + 2.5) * Math.PI) / 180
  if (Math.sin(azimuth) <= 0) return 0
  return encode((Math.atan2(10.5 * Math.sin(azimuth), 5) * 180) / Math.PI)
}

describe('modelo de sombra', () => {
  it('un punto sin obstáculos está siempre al sol de día', () => {
    const model = syntheticModel(1, () => 0)
    for (const month of [1, 4, 7, 10]) {
      for (let hour = 7; hour <= 17; hour++) {
        expect(sideShadeAt(model, 0, at(month, 15, hour))).toMatchObject({ fraction: 0, state: 'expuesto', channel: 'ninguno' })
      }
    }
    expect(sideShadeAt(model, 0, at(3, 15, 2)).state).toBe('sin_sol')
  })

  it('un muro alto al oriente da sombra en la mañana y sol en la tarde', () => {
    const model = syntheticModel(1, eastWall)
    expect(sideShadeAt(model, 0, at(3, 15, 8))).toMatchObject({ state: 'sombra', channel: 'edificio' })
    expect(sideShadeAt(model, 0, at(3, 15, 15)).state).toBe('expuesto')
  })

  it('un cañaguate no da sombra en febrero y sí en agosto', () => {
    // Punto bajo la copa de un cañaguate: 90° en todo el canal caducifolio.
    const model = syntheticModel(1, (_, channel) => (channel === CADUCIFOLIOS ? 180 : 0))
    expect(sideShadeAt(model, 0, at(2, 15, 12)).state).toBe('expuesto')
    expect(sideShadeAt(model, 0, at(8, 15, 12))).toMatchObject({ state: 'sombra', channel: 'arbol' })
  })

  it('la temporada forzada manda sobre el mes', () => {
    const model = syntheticModel(1, (_, channel) => (channel === CADUCIFOLIOS ? 180 : 0))
    expect(sideShadeAt(model, 0, at(2, 15, 12), { season: 'lluvias' }).state).toBe('sombra')
    expect(sideShadeAt(model, 0, at(8, 15, 12), { season: 'seca' }).state).toBe('expuesto')
  })

  it('clasifica con los umbrales provisionales', () => {
    expect(classifySegment(0.7)).toBe('sombra')
    expect(classifySegment(0.69)).toBe('parcial')
    expect(classifySegment(0.3)).toBe('parcial')
    expect(classifySegment(0.29)).toBe('expuesto')
    // Un lado de 10 muestras con la mitad bajo un edificio queda "parcial".
    const half = syntheticModel(10, (sample, channel) => (channel === EDIFICIOS && sample < 5 ? 180 : 0))
    expect(sideShadeAt(half, 0, at(6, 15, 12))).toMatchObject({ fraction: 0.5, state: 'parcial', channel: 'edificio' })
  })

  it('calcula todos los lados y cuenta los estados', () => {
    const model = syntheticModel(4, eastWall)
    const result = computeShade(model, at(3, 15, 8))
    expect(result.fraction).toHaveLength(1)
    expect(STATE_CODES[result.state[0]]).toBe('sombra')
    expect(result.counts).toEqual({ sombra: 1, parcial: 0, expuesto: 0, sin_sol: 0 })
    expect(computeShade(model, at(3, 15, 22)).noSun).toBe(true)
  })

  it('dice hasta qué hora sigue en sombra plena, en pasos de 5 minutos', () => {
    const wall = syntheticModel(1, eastWall)
    const from = at(3, 15, 8)
    const result = shadeUntil(wall, 0, from)
    expect(result).not.toBeNull()
    expect(result!.untilSunset).toBe(false)
    expect(result!.until).toBeGreaterThan(from.getTime())
    expect(result!.until).toBeLessThan(at(3, 15, 13).getTime())
    expect((result!.until - from.getTime()) % (5 * 60 * 1000)).toBe(0)
    expect(sideShadeAt(wall, 0, new Date(result!.until)).state).not.toBe('sombra')
    // Al sol a las 3 p. m.: no aplica.
    expect(shadeUntil(wall, 0, at(3, 15, 15))).toBeNull()
    // Un callejón cerrado por todos lados: sombra hasta que se oculta el sol.
    const alley = syntheticModel(1, (_, channel) => (channel === EDIFICIOS ? 180 : 0))
    expect(shadeUntil(alley, 0, at(3, 15, 9))?.untilSunset).toBe(true)
  })

  it('arma el perfil del día de 6:00 a 18:00 cada 15 minutos', () => {
    const model = syntheticModel(1, eastWall)
    const profile = dayProfile(model, 0, at(3, 15, 10, 7))
    expect(profile).toHaveLength(49)
    expect(localParts(new Date(profile[0].time))).toMatchObject({ day: 15, hour: 6, minute: 0 })
    expect(localParts(new Date(profile[48].time))).toMatchObject({ hour: 18, minute: 0 })
    // Muro al oriente: más sombra en la mañana que en la tarde.
    const morning = profile.filter((p) => localParts(new Date(p.time)).hour < 11 && p.state !== 'sin_sol')
    const afternoon = profile.filter((p) => localParts(new Date(p.time)).hour >= 14 && p.state !== 'sin_sol')
    expect(morning.some((p) => p.state === 'sombra')).toBe(true)
    expect(afternoon.every((p) => p.state === 'expuesto')).toBe(true)
  })

  it('agrupa las muestras por lado y rechaza perfiles incompletos', () => {
    const index = {
      cantidad: 3,
      sectores: SECTORS,
      paso_grados: 0.5,
      canales: ['a', 'b', 'c'],
      bytes_por_muestra: 216,
      lon: [0, 0, 0],
      lat: [0, 0, 0],
      arista: [7, 7, 9],
      lado: ['a', 'b', 'b'] as SideLetter[],
      svf: [1, 1, 1],
    }
    const model = buildModel(index, new Uint8Array(3 * 216))
    expect(model.sides).toEqual([
      { edge: 7, side: 'a', start: 0, count: 1 },
      { edge: 7, side: 'b', start: 1, count: 1 },
      { edge: 9, side: 'b', start: 2, count: 1 },
    ])
    expect(model.sideIndex.get('9:b')).toBe(2)
    expect(() => buildModel(index, new Uint8Array(10))).toThrow(/incompletos/)
  })
})

describe('hora de Valledupar', () => {
  it('convierte de ida y vuelta sin importar la zona del equipo', () => {
    const date = localDate(2026, 8, 15, 13, 20)
    expect(date.toISOString()).toBe('2026-08-15T18:20:00.000Z')
    expect(localParts(date)).toEqual({ year: 2026, month: 8, day: 15, hour: 13, minute: 20 })
  })

  it('formatea la hora en español y en inglés', () => {
    const date = localDate(2026, 8, 15, 13, 20)
    const normal = (text: string) => text.replace(/\s/g, ' ')
    expect(normal(formatTime(date, 'es'))).toBe('1:20 p. m.')
    expect(normal(formatTime(date, 'en'))).toBe('1:20 PM')
  })
})
