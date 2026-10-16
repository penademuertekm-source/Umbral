import { describe, expect, it } from 'vitest'
import { emptyProfile, type Arrival } from './almacen'
import { cardsFromRoute, earnedCards, earnedStamps, isNewStamp } from './colecciones'

const arrival = (id: string, date: string, destinationId: string, cards?: Arrival['cards']): Arrival => ({
  id,
  date,
  destinationId,
  avoided: 1,
  departure: date,
  simulated: false,
  cards,
})

describe('Pasaporte del centro', () => {
  it('un sello por destino, con la fecha de la primera llegada', () => {
    const profile = {
      ...emptyProfile(),
      arrivals: [
        arrival('a', '2026-10-14T15:00:00.000Z', 'iglesia'),
        arrival('b', '2026-10-16T15:00:00.000Z', 'plaza'),
        arrival('c', '2026-10-17T15:00:00.000Z', 'plaza'),
      ],
    }
    expect([...earnedStamps(profile)]).toEqual([
      ['iglesia', '2026-10-14T15:00:00.000Z'],
      ['plaza', '2026-10-16T15:00:00.000Z'],
    ])
    expect(isNewStamp(profile, 'b')).toBe(true)
    expect(isNewStamp(profile, 'c')).toBe(false)
    expect(earnedStamps(emptyProfile()).size).toBe(0)
  })
})

describe('Álbum de la sombra (regla aproximada)', () => {
  const trees = new Map([
    [1, { mango: 2, canaguate: 0, otro: 0 }],
    [2, { mango: 0, canaguate: 3, otro: 1 }],
  ])

  it('la sombra de árbol da la lámina de los árboles de esa cuadra', () => {
    expect(cardsFromRoute([{ edge: 1, fraction: 0.8, channel: 'arbol' }], trees, new Set(), true)).toEqual(['mango'])
    expect(cardsFromRoute([{ edge: 2, fraction: 0.5, channel: 'arbol' }], trees, new Set(), true)).toEqual(['canaguate', 'otros'])
    // Sin hojas (meses secos), el cañaguate no da sombra.
    expect(cardsFromRoute([{ edge: 2, fraction: 0.5, channel: 'arbol' }], trees, new Set(), false)).toEqual(['otros'])
  })

  it('la sombra de edificio da Alero si la cuadra tiene alero y, si no, Muro alto', () => {
    expect(cardsFromRoute([{ edge: 3, fraction: 0.9, channel: 'edificio' }], trees, new Set(), true)).toEqual(['muro'])
    expect(cardsFromRoute([{ edge: 3, fraction: 0.9, channel: 'edificio' }], trees, new Set([3]), true)).toEqual(['alero'])
    expect(cardsFromRoute([{ edge: 1, fraction: 0.6, channel: 'mixto' }], trees, new Set(), true)).toEqual(['mango', 'muro'])
  })

  it('no cuentan los tramos casi al sol ni las esquinas', () => {
    expect(cardsFromRoute([{ edge: 1, fraction: 0.2, channel: 'arbol' }], trees, new Set(), true)).toEqual([])
    expect(cardsFromRoute([{ edge: -1, fraction: 1, channel: 'edificio' }], trees, new Set(), true)).toEqual([])
  })

  it('las láminas ganadas salen de las llegadas', () => {
    const profile = {
      ...emptyProfile(),
      arrivals: [arrival('a', '2026-10-14T15:00:00.000Z', 'plaza', ['mango']), arrival('b', '2026-10-16T15:00:00.000Z', 'plaza', ['mango', 'muro'])],
    }
    expect([...earnedCards(profile)]).toEqual([
      ['mango', '2026-10-14T15:00:00.000Z'],
      ['muro', '2026-10-16T15:00:00.000Z'],
    ])
  })
})
