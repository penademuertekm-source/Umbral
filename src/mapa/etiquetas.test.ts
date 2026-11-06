import type { Feature, FeatureCollection, LineString } from 'geojson'
import { describe, expect, it } from 'vitest'
import type { EdgeProps } from './datos'
import { screenAngle, STREET_LABEL_MIN_EDGE_M, streetLabels } from './etiquetas'

/** Calle recta de `from` a `to`, con su largo aproximado. */
function edge(id: number, nombre: string, from: [number, number], to: [number, number], longitud_m: number): Feature<LineString, EdgeProps> {
  return {
    type: 'Feature',
    properties: { id, u: id * 10, v: id * 10 + 1, nombre, tipo: 'residential', longitud_m, lados: [] },
    geometry: { type: 'LineString', coordinates: [from, to] },
  }
}

const red = (features: Feature<LineString, EdgeProps>[]): FeatureCollection<LineString, EdgeProps> => ({ type: 'FeatureCollection', features })

describe('nombres de calles en el mapa (04-7)', () => {
  it('el giro sigue la calle y el texto nunca queda al revés', () => {
    expect(screenAngle([-73.245, 10.478], [-73.244, 10.478])).toBe(0)
    // Hacia el noreste sube en pantalla: giro negativo. Al revés da lo mismo.
    const ne = screenAngle([-73.245, 10.478], [-73.244, 10.479])
    expect(ne).toBeLessThan(0)
    expect(screenAngle([-73.244, 10.479], [-73.245, 10.478])).toBe(ne)
    expect(Math.abs(screenAngle([-73.245, 10.478], [-73.245, 10.479]))).toBe(90)
  })

  it('abrevia, salta las cuadras cortas y no repite el mismo nombre cerca', () => {
    const labels = streetLabels(
      red([
        edge(1, 'Carrera 6', [-73.245, 10.478], [-73.245, 10.4788], 90),
        // Misma calle, a unos 100 m: no se repite.
        edge(2, 'Carrera 6', [-73.245, 10.4788], [-73.245, 10.4796], 85),
        // Misma calle, a unos 400 m: sí.
        edge(3, 'Carrera 6', [-73.245, 10.4815], [-73.245, 10.4823], 80),
        edge(4, 'Calle 16', [-73.246, 10.478], [-73.2452, 10.478], STREET_LABEL_MIN_EDGE_M - 1),
        edge(5, '', [-73.246, 10.479], [-73.2452, 10.479], 120),
      ]),
    )
    expect(labels.map((l) => [l.id, l.text])).toEqual([
      ['calle-1', 'Cra. 6'],
      ['calle-3', 'Cra. 6'],
    ])
    expect(labels[0].point[1]).toBeCloseTo(10.4784, 4)
  })
})
