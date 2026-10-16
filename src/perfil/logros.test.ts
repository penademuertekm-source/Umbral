import { describe, expect, it } from 'vitest'
import { CHALLENGES, CHALLENGES_PER_WEEK } from '../config/logros'
import { localDate } from '../sombra/tiempo'
import { emptyProfile, type Arrival, type ProfileData } from './almacen'
import {
  advancedChallenge,
  avoidedThisWeek,
  avoidedTotal,
  challengeProgress,
  earnedAchievements,
  levelFor,
  weekNumber,
  weeklyChallenges,
  weekStart,
} from './logros'

// Viernes 16 de octubre de 2026, 1:00 p. m. en Valledupar.
const NOW = localDate(2026, 10, 16, 13, 0)
let n = 0
const arrival = (day: number, hour: number, avoided: number, destinationId = 'plaza'): Arrival => ({
  id: `a${n++}`,
  date: localDate(2026, 10, day, hour, 15).toISOString(),
  departure: localDate(2026, 10, day, hour, 5).toISOString(),
  destinationId,
  avoided,
  simulated: false,
})
const profile = (patch: Partial<ProfileData>): ProfileData => ({ ...emptyProfile(), ...patch })

describe('semana de logros', () => {
  it('va de lunes a domingo, hora de Colombia', () => {
    expect(weekStart(NOW)).toEqual(localDate(2026, 10, 12))
    // Domingo 18 a las 11:30 p. m. sigue siendo la misma semana; el lunes 19 empieza otra.
    expect(weekStart(localDate(2026, 10, 18, 23, 30))).toEqual(localDate(2026, 10, 12))
    expect(weekStart(localDate(2026, 10, 19, 0, 10))).toEqual(localDate(2026, 10, 19))
    // A las 9 p. m. del domingo en Colombia ya es lunes en UTC: cuenta la hora de Colombia.
    expect(weekNumber(localDate(2026, 10, 18, 21, 0))).toBe(weekNumber(NOW))
  })

  it('suma el sol evitado de la semana y el total', () => {
    const p = profile({ arrivals: [arrival(9, 7, 10), arrival(13, 9, 2.5), arrival(16, 10, 4)] })
    expect(avoidedThisWeek(p, NOW)).toBe(6.5)
    expect(avoidedTotal(p)).toBe(16.5)
  })
})

describe('niveles', () => {
  it('sube por sol evitado total', () => {
    expect(levelFor(0)).toEqual({ level: 1, toNext: 30, fraction: 0 })
    expect(levelFor(48)).toEqual({ level: 2, toNext: 12, fraction: 0.6 })
    expect(levelFor(60).level).toBe(3)
    expect(levelFor(500)).toEqual({ level: 5, toNext: null, fraction: 1 })
  })
})

describe('retos', () => {
  it('cada semana tocan tres, siempre los mismos para esa semana, y rotan', () => {
    const week = weeklyChallenges(NOW)
    expect(week).toHaveLength(CHALLENGES_PER_WEEK)
    expect(weeklyChallenges(localDate(2026, 10, 18, 22, 0))).toEqual(week)
    expect(weeklyChallenges(localDate(2026, 10, 19, 8, 0))).not.toEqual(week)
    // En cinco semanas salen todos.
    const seen = new Set<string>()
    for (let i = 0; i < CHALLENGES.length; i++) for (const c of weeklyChallenges(new Date(NOW.getTime() + i * 7 * 86_400_000))) seen.add(c.id)
    expect(seen.size).toBe(CHALLENGES.length)
  })

  it('miden el avance de la semana', () => {
    const p = profile({
      arrivals: [arrival(9, 6, 20, 'iglesia'), arrival(13, 7, 9), arrival(14, 16, 5, 'callejon')],
      planned: [localDate(2026, 10, 15, 9, 0).toISOString()],
    })
    const progress = (id: string) => challengeProgress(CHALLENGES.find((c) => c.id === id)!, p, NOW)
    expect(progress('evitar-15')).toMatchObject({ value: 14, done: false })
    expect(progress('temprano')).toMatchObject({ value: 1, done: true })
    expect(progress('tarde')).toMatchObject({ value: 1, done: true })
    expect(progress('planear')).toMatchObject({ value: 1, done: true })
    // "plaza" e "callejon" son nuevos esta semana; "iglesia" fue la semana pasada.
    expect(progress('lugar-nuevo')).toMatchObject({ value: 1, done: true })
  })

  it('ninguno es de distancia ni de salir entre 11 a. m. y 3 p. m.', () => {
    expect(CHALLENGES.map((c) => c.kind).sort()).toEqual(['evitar', 'lugar_nuevo', 'planear', 'tarde', 'temprano'])
  })

  it('dice qué reto avanzó con una llegada', () => {
    // Semana 40 desde el 5 de enero: tocan evitar 15 min, salir antes de las 8 y planear una salida.
    expect(weeklyChallenges(NOW).map((c) => c.id)).toEqual(['evitar-15', 'temprano', 'planear'])
    const last = arrival(16, 10, 3)
    const p = profile({ arrivals: [arrival(13, 9, 9), last] })
    expect(advancedChallenge(p, last.id, NOW)).toMatchObject({ challenge: { id: 'evitar-15' }, value: 12 })
    const none = arrival(16, 10, 0)
    expect(advancedChallenge(profile({ arrivals: [none] }), none.id, NOW)).toBeUndefined()
  })
})

describe('logros', () => {
  it('se ganan con lo hecho y se pierden con "Borrar mis datos"', () => {
    expect(earnedAchievements(emptyProfile()).size).toBe(0)
    const p = profile({
      arrivals: [arrival(13, 7, 30), arrival(14, 17, 31)],
      planned: ['2026-10-10T12:00:00.000Z', '2026-10-11T12:00:00.000Z', '2026-10-12T12:00:00.000Z'],
      answered: ['2026-10-13T12:00:00.000Z'],
    })
    expect([...earnedAchievements(p)].sort()).toEqual(
      ['ayudaste', 'hora_evitada', 'madrugador', 'planificador', 'primera_ruta', 'tarde_fresca'].sort(),
    )
    expect(earnedAchievements(profile({ arrivals: [arrival(16, 12, 2)] }))).toEqual(new Set(['primera_ruta']))
  })
})
