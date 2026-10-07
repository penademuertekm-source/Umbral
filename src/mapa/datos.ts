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

/** Lugar para resguardarse (public/datos/refugios.json). Sin coordenadas si no se encontró en OSM. */
export interface Refuge {
  id: string
  nombre: string
  tipo: string
  descripcion: { es: string; en: string }
  asientos: 'si' | 'no'
  agua_potable: 'si' | 'no'
  cubierto: 'si' | 'parcial' | 'no'
  lat: number | null
  lon: number | null
  provisional: boolean
}

/** Destino de public/datos/destinos.json (sin coordenadas si todavía no se ubicó). */
export interface Destination {
  id: string
  nombre: { es: string; en: string }
  tipo: string
  lat: number | null
  lon: number | null
  fuente: string
  provisional: boolean
}

export interface Meta {
  /** Fecha y hora en que se generó el modelo (ISO 8601). */
  generado: string
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
  refugios: Refuge[]
  destinos: Destination[]
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
    getJson<Refuge[]>('refugios.json'),
    getJson<Destination[]>('destinos.json'),
  ])
    .then(([meta, manzanas, edificios, plazas, red, aceras, arboles, refugios, destinos]) => ({
      meta,
      manzanas,
      edificios,
      plazas,
      red,
      aceras,
      arboles,
      refugios,
      destinos,
    }))
    .catch((error: unknown) => {
      cache = null
      throw error
    })
  return cache
}

/** Metros entre dos puntos [lon, lat] (aproximación plana, suficiente a escala de ciudad). */
export function metersBetween(a: [number, number], b: [number, number]): number {
  const mx = 111_320 * Math.cos((a[1] * Math.PI) / 180)
  return Math.hypot((a[0] - b[0]) * mx, (a[1] - b[1]) * 110_574)
}

/** ¿Está el punto dentro del área de estudio? (círculo inscrito en el bbox de meta.json). */
export function insideArea(meta: Meta, point: [number, number]): boolean {
  const [west, south, east, north] = meta.area.bbox
  const radius = Math.min(metersBetween([west, south], [east, south]), metersBetween([west, south], [west, north])) / 2
  return metersBetween(meta.area.centro, point) <= radius
}
