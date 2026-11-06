// Nombres de calles sobre el mapa (04-7, Figma 110:78): dónde va cada nombre y con qué giro. Código puro.
import type { FeatureCollection, LineString } from 'geojson'
import type { IconName } from '../componentes'
import type { EdgeProps } from './datos'
import { abbreviate } from './tramos'

export type LonLat = [number, number]

export interface StreetLabel {
  id: string
  /** Nombre abreviado, como en la ficha ("Cra. 6"). */
  text: string
  point: LonLat
  /** Giro en pantalla (grados, sentido horario), siempre entre -90 y 90 para que el texto no quede al revés. */
  angle: number
}

/** Lugares de referencia del mapa (04-7), por su id en destinos.json, con su ícono. */
export const LANDMARKS: readonly { id: string; icon: IconName }[] = [
  { id: 'plaza-alfonso-lopez', icon: 'plaza' },
  { id: 'iglesia-concepcion', icon: 'iglesia' },
]

/** Una cuadra más corta que esto no lleva nombre: no le cabe la pastilla (m). */
export const STREET_LABEL_MIN_EDGE_M = 35
/** Distancia mínima entre dos etiquetas con el mismo nombre (m). */
export const STREET_LABEL_SAME_NAME_M = 250

const M_PER_DEG_LAT = 111_320

function toMeters([lon, lat]: LonLat, lat0: number): [number, number] {
  return [lon * M_PER_DEG_LAT * Math.cos((lat0 * Math.PI) / 180), lat * M_PER_DEG_LAT]
}

function metersBetween(a: LonLat, b: LonLat): number {
  const lat0 = (a[1] + b[1]) / 2
  const [ax, ay] = toMeters(a, lat0)
  const [bx, by] = toMeters(b, lat0)
  return Math.hypot(ax - bx, ay - by)
}

/** Punto a mitad del largo de la línea. */
function midpoint(coords: LonLat[]): LonLat {
  const lengths = coords.slice(1).map((c, i) => metersBetween(coords[i], c))
  let rest = lengths.reduce((sum, l) => sum + l, 0) / 2
  for (let i = 0; i < lengths.length; i++) {
    if (rest <= lengths[i] && lengths[i] > 0) {
      const f = rest / lengths[i]
      const [a, b] = [coords[i], coords[i + 1]]
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]
    }
    rest -= lengths[i]
  }
  return coords[Math.floor(coords.length / 2)]
}

/** Giro de la calle en pantalla: el mapa no rota, así que basta con la dirección entre sus extremos. */
export function screenAngle(from: LonLat, to: LonLat): number {
  const lat0 = (from[1] + to[1]) / 2
  const [ax, ay] = toMeters(from, lat0)
  const [bx, by] = toMeters(to, lat0)
  // En pantalla la y crece hacia abajo.
  let angle = (Math.atan2(-(by - ay), bx - ax) * 180) / Math.PI
  if (angle > 90) angle -= 180
  if (angle <= -90) angle += 180
  const rounded = Math.round(angle * 10) / 10
  return rounded === 0 ? 0 : rounded // sin -0
}

/**
 * Etiquetas de las calles: una por cuadra con nombre, de la más larga a la más corta, saltando las que
 * repiten un nombre ya puesto a menos de STREET_LABEL_SAME_NAME_M. El orden es también la prioridad cuando
 * en pantalla se montan unas sobre otras.
 */
export function streetLabels(red: FeatureCollection<LineString, EdgeProps>): StreetLabel[] {
  const candidates = red.features
    .filter((f) => f.properties.nombre?.trim() && f.properties.longitud_m >= STREET_LABEL_MIN_EDGE_M)
    .sort((a, b) => b.properties.longitud_m - a.properties.longitud_m)
  const chosen: StreetLabel[] = []
  for (const feature of candidates) {
    const coords = feature.geometry.coordinates as LonLat[]
    const text = abbreviate(feature.properties.nombre.trim())
    const point = midpoint(coords)
    if (chosen.some((label) => label.text === text && metersBetween(label.point, point) < STREET_LABEL_SAME_NAME_M)) {
      continue
    }
    chosen.push({ id: `calle-${feature.properties.id}`, text, point, angle: screenAngle(coords[0], coords[coords.length - 1]) })
  }
  return chosen
}
