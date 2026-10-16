import { describe, expect, it } from 'vitest'
import { localDate } from '../sombra/tiempo'
import { arrivesInHeat, candidateDepartures, chooseDeparture, targetArrival, type DepartureCandidate } from './agenda'
import type { Route } from './rutas'

const route = (minutes: number, sunMinutes: number): Route =>
  ({ mode: 'sombra', pieces: [], meters: minutes * 80, minutes, shadePercent: 50, sunMinutes, exposed: [], edges: [] }) as Route

const at = (hour: number, minute: number) => localDate(2026, 10, 16, hour, minute)
const fmt = (d: Date) => d.toISOString().slice(11, 16)

describe('agenda de salidas', () => {
  it('llega 5 minutos antes de la hora pedida', () => {
    expect(targetArrival(at(15, 0))).toEqual(at(14, 55))
  })

  it('prueba salidas cada 5 minutos en la hora anterior', () => {
    const list = candidateDepartures(at(15, 0))
    expect(list[0]).toEqual(at(13, 55))
    expect(list.at(-1)).toEqual(at(14, 55))
    expect(list).toHaveLength(13)
    // Con una hora que no cae en múltiplo de 5, se ajusta al reloj.
    expect(candidateDepartures(at(15, 2)).at(-1)).toEqual(at(14, 55))
  })

  it('elige la salida con menos minutos al sol que llega a tiempo', () => {
    const candidates: DepartureCandidate[] = candidateDepartures(at(15, 0)).map((departure, i) => ({
      departure,
      route: route(7, i === 4 ? 1 : 3),
    }))
    const plan = chooseDeparture(candidates, at(15, 0))!
    expect(plan.departure).toEqual(at(14, 15))
    expect(plan.arrival).toEqual(at(14, 22))
  })

  it('entre dos iguales, la más tarde (sin pasarse de la llegada)', () => {
    const candidates = candidateDepartures(at(15, 0)).map((departure) => ({ departure, route: route(7, 2.2) }))
    const plan = chooseDeparture(candidates, at(15, 0))!
    // 14:50 + 7 min = 14:57, después de 14:55: no sirve. 14:45 + 7 = 14:52, sí.
    expect(fmt(plan.departure)).toBe(fmt(at(14, 45)))
    // Iguales al minuto: 1,6 y 2,4 redondean a 2.
    const mixed = candidateDepartures(at(15, 0)).map((departure, i) => ({ departure, route: route(7, i % 2 ? 1.6 : 2.4) }))
    expect(chooseDeparture(mixed, at(15, 0))!.departure).toEqual(at(14, 45))
  })

  it('ignora las horas sin ruta y devuelve null si ninguna llega a tiempo', () => {
    expect(chooseDeparture([{ departure: at(14, 0), route: null }], at(15, 0))).toBeNull()
    expect(chooseDeparture([{ departure: at(14, 50), route: route(10, 0) }], at(15, 0))).toBeNull()
  })

  it('la franja de calor va de 11 a. m. a 3 p. m. (hora de Valledupar)', () => {
    expect(arrivesInHeat(at(10, 59))).toBe(false)
    expect(arrivesInHeat(at(11, 0))).toBe(true)
    expect(arrivesInHeat(at(14, 55))).toBe(true)
    expect(arrivesInHeat(at(15, 1))).toBe(false)
  })
})
