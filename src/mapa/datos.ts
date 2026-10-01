// Datos del mapa (public/datos, Fase 2). Se piden una sola vez y quedan en memoria.
import type { FeatureCollection, LineString, MultiPolygon, Point, Polygon } from 'geojson'
import { dataBaseUrl } from '../sombra/cargar'
import type { SideLetter } from '../sombra/modelo'

export type Orientation = 'norte' | 'sur' | 'oriental' | 'occidental'
export type Species = 'mango' | 'canaguate' | 'otro'

export interface SideInfo {
  lado: SideLetter
  orientacion: Orientation
  muestra_inicio: number
  muestra_cantidad: number
}

export interface EdgeProps {
  id: number
  u: number
  v: number
  nombre: string
  tipo: string
  longitud_m: number
  lados: SideInfo[]
}

export interface SidewalkProps {
  id: string
  arista: number
  lado: SideLetter
  orientacion: Orientation
}

export interface TreeProps {
  id: string
  especie: Species
  altura_m: number
  diametro_copa_m: number
  caducifolio: boolean
  fuente: string
}

export interface Meta {
  datos_provisionales: boolean
  area: { centro: [number, number]; bbox: [number, number, number, number] }
}

export interface MapData {
  meta: Meta
  manzanas: FeatureCollection<Polygon | MultiPolygon>
  edificios: FeatureCollection<Polygon | MultiPolygon>
  plazas: FeatureCollection<Polygon | MultiPolygon>
  red: FeatureCollection<LineString, EdgeProps>
  aceras: FeatureCollection<LineString, SidewalkProps>
  arboles: FeatureCollection<Point, TreeProps>
}

let cache: Promise<MapData> | null = null

async function getJson<T>(file: string): Promise<T> {
  const response = await fetch(`${dataBaseUrl()}${file}`)
  if (!response.ok) throw new Error(`No se pudo cargar ${file} (${response.status})`)
  return (await response.json()) as T
}

export function loadMapData(): Promise<MapData> {
  cache ??= Promise.all([
    getJson<Meta>('meta.json'),
    getJson<MapData['manzanas']>('manzanas.geojson'),
    getJson<MapData['edificios']>('edificios.geojson'),
    getJson<MapData['plazas']>('plazas.geojson'),
    getJson<MapData['red']>('red.geojson'),
    getJson<MapData['aceras']>('aceras.geojson'),
    getJson<MapData['arboles']>('arboles.geojson'),
  ])
    .then(([meta, manzanas, edificios, plazas, red, aceras, arboles]) => ({
      meta,
      manzanas,
      edificios,
      plazas,
      red,
      aceras,
      arboles,
    }))
    .catch((error: unknown) => {
      cache = null
      throw error
    })
  return cache
}
