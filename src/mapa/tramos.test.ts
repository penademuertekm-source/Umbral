import type { FeatureCollection, LineString, Point } from 'geojson'
import { describe, expect, it } from 'vitest'
import type { EdgeProps, Species, TreeProps } from './datos'
import { abbreviate, indexEdges, protectedSide, segmentName, treesByEdge } from './tramos'

// Cuadrícula pequeña: la Calle 16 entre la Carrera 5 (nodo 1) y la Carrera 6 (nodo 2).
//   Cra. 5      Cra. 6
//     |           |
//     1 — Cl 16 — 2
//     |           |
const LAT = 10.4778
const LON = -73.2446
const D = 0.0009 // ~100 m

function edge(id: number, u: number, v: number, nombre: string, coords: [number, number][]) {
  return {
    type: 'Feature' as const,
    properties: { id, u, v, nombre, tipo: 'residential', longitud_m: 100, lados: [] } satisfies EdgeProps,
    geometry: { type: 'LineString' as const, coordinates: coords },
  }
}

const red: FeatureCollection<LineString, EdgeProps> = {
  type: 'FeatureCollection',
  features: [
    edge(0, 1, 2, 'Calle 16', [[LON, LAT], [LON + D, LAT]]),
    edge(1, 1, 3, 'Carrera 5', [[LON, LAT], [LON, LAT + D]]),
    edge(2, 2, 4, 'Carrera 6', [[LON + D, LAT], [LON + D, LAT + D]]),
    edge(3, 5, 1, 'Carrera 5', [[LON, LAT - D], [LON, LAT]]),
  ],
}

function tree(lon: number, lat: number, especie: Species) {
  return {
    type: 'Feature' as const,
    properties: { id: `${lon}`, especie, altura_m: 10, diametro_copa_m: 8, caducifolio: false, fuente: 'osm' } satisfies TreeProps,
    geometry: { type: 'Point' as const, coordinates: [lon, lat] },
  }
}

describe('ficha de tramo', () => {
  it('abrevia como en Figma', () => {
    expect(abbreviate('Carrera 5')).toBe('Cra. 5')
    expect(abbreviate('Calle 16')).toBe('Calle 16')
    expect(abbreviate('Avenida Simón Bolívar')).toBe('Av. Simón Bolívar')
  })

  it('nombra el tramo con las calles de sus dos esquinas', () => {
    const index = indexEdges(red)
    expect(segmentName(0, index)).toEqual({ street: 'Calle 16', crossings: ['Cra. 5', 'Cra. 6'] })
    // La Carrera 5 sigue derecho en el nodo 1: la esquina es la Calle 16.
    expect(segmentName(1, index)).toEqual({ street: 'Carrera 5', crossings: ['Calle 16'] })
    expect(segmentName(99, index)).toEqual({ street: '', crossings: [] })
  })

  it('cuenta los árboles a menos de 12 m del eje, cada uno en la calle más cercana', () => {
    const m = 1 / 110_574 // un metro en grados de latitud
    const trees: FeatureCollection<Point, TreeProps> = {
      type: 'FeatureCollection',
      features: [
        tree(LON + D / 2, LAT + 5 * m, 'mango'),
        tree(LON + D / 3, LAT - 8 * m, 'mango'),
        tree(LON + D / 2, LAT + 6 * m, 'canaguate'),
        tree(LON + D / 2, LAT + 30 * m, 'mango'), // lejos de todo
      ],
    }
    const counts = treesByEdge(red, trees)
    expect(counts.get(0)).toEqual({ mango: 2, canaguate: 1, otro: 0 })
    expect(counts.has(1)).toBe(false)
  })

  it('elige la acera protegida', () => {
    expect(protectedSide(0.9, 0.2)).toBe('a')
    expect(protectedSide(0.1, 0.5)).toBe('b')
    expect(protectedSide(0.8, 0.75)).toBe('ambas')
    expect(protectedSide(0.1, 0.2)).toBe('ninguna')
    expect(protectedSide(undefined, undefined)).toBe('ninguna')
  })
})
