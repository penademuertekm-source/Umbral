import type { Feature, FeatureCollection, LineString, Polygon } from 'geojson'
import { describe, expect, it } from 'vitest'
import { openSpaceKind, sideReferences, type SideReferenceInput } from './andenes'
import type { EdgeProps, SidewalkProps } from './datos'

// Un metro en grados, cerca de Valledupar.
const M_LAT = 1 / 110_574
const M_LON = 1 / (111_320 * Math.cos((10.478 * Math.PI) / 180))
const at = (x: number, y: number): [number, number] => [-73.245 + x * M_LON, 10.478 + y * M_LAT]

function street(id: number, nombre: string, from: [number, number], to: [number, number]): Feature<LineString, EdgeProps> {
  return {
    type: 'Feature',
    properties: { id, u: id * 10, v: id * 10 + 1, nombre, tipo: 'residential', longitud_m: 100, lados: [] },
    geometry: { type: 'LineString', coordinates: [at(...from), at(...to)] },
  }
}

/** Los dos andenes de la calle 0 (este-oeste en y = 0): a al norte y b al sur, a 6 m del eje. */
function sidewalks(): FeatureCollection<LineString, SidewalkProps> {
  const side = (lado: 'a' | 'b', y: number, orientacion: 'norte' | 'sur'): Feature<LineString, SidewalkProps> => ({
    type: 'Feature',
    properties: { id: `0${lado}`, arista: 0, lado, orientacion },
    geometry: { type: 'LineString', coordinates: [at(0, y), at(100, y)] },
  })
  return { type: 'FeatureCollection', features: [side('a', 6, 'norte'), side('b', -6, 'sur')] }
}

function square(nombre: string, x0: number, y0: number, size: number): Feature<Polygon, { nombre: string }> {
  return {
    type: 'Feature',
    properties: { nombre },
    geometry: { type: 'Polygon', coordinates: [[at(x0, y0), at(x0 + size, y0), at(x0 + size, y0 + size), at(x0, y0 + size), at(x0, y0)]] },
  }
}

const input = (streets: Feature<LineString, EdgeProps>[], plazas: Feature<Polygon, { nombre: string }>[] = []): SideReferenceInput => ({
  red: { type: 'FeatureCollection', features: streets },
  aceras: sidewalks(),
  plazas: { type: 'FeatureCollection', features: plazas },
})

describe('nombres de los andenes en la ficha (07-2)', () => {
  it('reconoce plazas y parques, no otros polígonos', () => {
    expect(openSpaceKind('Plaza Alfonso López de Valledupar')).toBe('plaza')
    expect(openSpaceKind('Parque de las Madres')).toBe('parque')
    expect(openSpaceKind('mz 55')).toBeNull()
  })

  it('junto a la plaza: "del lado de la plaza" y "de enfrente"', () => {
    const refs = sideReferences(0, input([street(0, 'Calle 16', [0, 0], [100, 0])], [square('Plaza Alfonso López', 10, 15, 60)]))
    expect(refs).toEqual({ a: { kind: 'espacio', space: 'plaza' }, b: { kind: 'enfrente', space: 'plaza' } })
  })

  it('sin plaza: la calle paralela más cercana de cada lado, y el costado si no hay', () => {
    const streets = [
      street(0, 'Calle 16', [0, 0], [100, 0]),
      street(1, 'Calle 15', [0, 90], [100, 90]),
      street(2, 'Calle 14', [0, 180], [100, 180]),
      // Perpendicular: no cuenta como paralela.
      street(3, 'Carrera 5', [0, -80], [0, 80]),
    ]
    expect(sideReferences(0, input(streets))).toEqual({ a: { kind: 'calle', street: 'Calle 15' }, b: { kind: 'costado', orientation: 'sur' } })
  })
})
