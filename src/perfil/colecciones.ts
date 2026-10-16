// Colecciones de S3: Pasaporte del centro (sellos) y Álbum de la sombra (láminas). Código puro.
import { CARD_MIN_SHADE, CARDS, type CardId } from '../config/logros'
import type { TreeCounts } from '../mapa/tramos'
import type { ShadeChannel } from '../sombra/modelo'
import type { ProfileData } from './almacen'

/** Sellos ganados: destino → fecha de la primera llegada (ISO). Salen de las llegadas guardadas. */
export function earnedStamps(profile: ProfileData): Map<string, string> {
  const stamps = new Map<string, string>()
  for (const arrival of profile.arrivals) {
    const previous = stamps.get(arrival.destinationId)
    if (!previous || Date.parse(arrival.date) < Date.parse(previous)) stamps.set(arrival.destinationId, arrival.date)
  }
  return stamps
}

/** ¿Esta llegada ganó un sello nuevo? (la primera llegada a ese destino). */
export function isNewStamp(profile: ProfileData, arrivalId: string): boolean {
  const arrival = profile.arrivals.find((a) => a.id === arrivalId)
  if (!arrival) return false
  return earnedStamps(profile).get(arrival.destinationId) === arrival.date
}

/** Láminas ganadas: lámina → fecha de la primera llegada que la ganó (ISO). */
export function earnedCards(profile: ProfileData): Map<CardId, string> {
  const cards = new Map<CardId, string>()
  for (const arrival of profile.arrivals) {
    for (const card of arrival.cards ?? []) {
      const previous = cards.get(card)
      if (!previous || Date.parse(arrival.date) < Date.parse(previous)) cards.set(card, arrival.date)
    }
  }
  return cards
}

export interface ShadedPiece {
  /** Calle del tramo (-1 en esquinas). */
  edge: number
  /** Fracción del andén en sombra a la hora de salida (0–1). */
  fraction: number
  /** De dónde viene la sombra de ese andén, según el motor. */
  channel: ShadeChannel
}

/**
 * Láminas que gana una ruta, con la sombra a la hora de salida. Regla APROXIMADA (especificación S3): el
 * motor dice si la sombra de cada andén es de edificios, de árboles o de ambos, pero no de qué árbol ni si
 * hay alero; eso se deduce de lo que hay cerca de la cuadra.
 * - Sombra de árbol: Mango si hay mangos cerca de la cuadra; Cañaguate si hay cañaguates y tienen hojas;
 *   Otros árboles si hay árboles de especie "otro".
 * - Sombra de edificio: Alero si la cuadra tiene un alero registrado (aleros.csv); si no, Muro alto.
 * Solo cuentan los tramos con al menos CARD_MIN_SHADE de sombra.
 */
export function cardsFromRoute(
  pieces: ShadedPiece[],
  trees: Map<number, TreeCounts>,
  eavesEdges: ReadonlySet<number>,
  deciduousActive: boolean,
): CardId[] {
  const won = new Set<CardId>()
  for (const piece of pieces) {
    if (piece.edge < 0 || piece.fraction < CARD_MIN_SHADE) continue
    if (piece.channel === 'arbol' || piece.channel === 'mixto') {
      const counts = trees.get(piece.edge)
      if (counts?.mango) won.add('mango')
      if (counts?.canaguate && deciduousActive) won.add('canaguate')
      if (counts?.otro) won.add('otros')
    }
    if (piece.channel === 'edificio' || piece.channel === 'mixto') won.add(eavesEdges.has(piece.edge) ? 'alero' : 'muro')
  }
  return CARDS.filter((card) => won.has(card))
}
