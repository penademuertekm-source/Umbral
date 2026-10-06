// Pronóstico horario de Open-Meteo (https://open-meteo.com): sin clave, uso no comercial, datos CC BY 4.0
// (atribución visible "Clima: Open-Meteo"). Variables y validez verificadas en https://open-meteo.com/en/docs
// (docs/BITACORA.md, Fase 5). Privacidad: se consulta el centro fijo del área, nunca la ubicación de la persona.
import { TIME_ZONE } from '../sombra/tiempo'

export const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast'

/** Nombre en Open-Meteo de cada dato que usa la app. */
const VARIABLES = {
  airTemp: 'temperature_2m',
  humidity: 'relative_humidity_2m',
  windSpeed: 'wind_speed_10m',
  shortwave: 'shortwave_radiation',
  direct: 'direct_radiation',
  diffuse: 'diffuse_radiation',
  directNormal: 'direct_normal_irradiance',
  cloudCover: 'cloud_cover',
  uvIndex: 'uv_index',
  rainProbability: 'precipitation_probability',
} as const

export type WeatherField = keyof typeof VARIABLES

/** Valores instantáneos (a la hora indicada). El resto es el promedio o la probabilidad de la hora anterior. */
const INSTANT: ReadonlySet<WeatherField> = new Set(['airTemp', 'humidity', 'windSpeed', 'cloudCover', 'uvIndex'])

const HOUR_MS = 60 * 60 * 1000
/** El pronóstico guardado se renueva cada hora. */
export const REFRESH_MS = HOUR_MS
const REQUEST_TIMEOUT_MS = 12_000
const STORAGE_KEY = 'umbral.clima'

export interface Forecast {
  /** Cuándo se descargó (ms desde 1970). */
  fetchedAt: number
  latitude: number
  longitude: number
  /** Inicio de cada hora (ms). */
  times: number[]
  values: Record<WeatherField, (number | null)[]>
}

/** Clima estimado para un instante. null si Open-Meteo no da ese dato. */
export type Weather = { time: number } & Record<WeatherField, number | null>

export function forecastUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    hourly: Object.values(VARIABLES).join(','),
    timezone: TIME_ZONE,
    wind_speed_unit: 'ms',
    timeformat: 'unixtime',
    forecast_days: '2',
  })
  return `${OPEN_METEO_URL}?${params}`
}

const isNumberOrNull = (value: unknown) => value === null || (typeof value === 'number' && Number.isFinite(value))

/** Convierte la respuesta de Open-Meteo. Lanza un error si viene incompleta. */
export function parseForecast(json: unknown, fetchedAt: number): Forecast {
  const data = json as { latitude?: unknown; longitude?: unknown; hourly?: Record<string, unknown> }
  const hourly = data?.hourly
  const time = hourly?.time
  if (!Array.isArray(time) || time.length === 0 || !time.every((t) => typeof t === 'number')) {
    throw new Error('Respuesta de Open-Meteo sin horas')
  }
  const values = {} as Forecast['values']
  for (const [field, name] of Object.entries(VARIABLES) as [WeatherField, string][]) {
    const series = hourly?.[name]
    if (!Array.isArray(series) || series.length !== time.length || !series.every(isNumberOrNull)) {
      throw new Error(`Respuesta de Open-Meteo sin ${name}`)
    }
    values[field] = series as (number | null)[]
  }
  return {
    fetchedAt,
    latitude: Number(data.latitude),
    longitude: Number(data.longitude),
    times: (time as number[]).map((seconds) => seconds * 1000),
    values,
  }
}

function lerp(a: number | null, b: number | null, share: number): number | null {
  if (a === null) return share > 0.5 ? b : null
  if (b === null) return share < 0.5 ? a : null
  return a + (b - a) * share
}

/**
 * Clima para un instante: los valores instantáneos se interpolan entre las dos horas vecinas y los de
 * "hora anterior" se toman del registro que cierra la hora en curso (a las 10:15, el de las 11:00).
 */
export function weatherAt(forecast: Forecast, date: Date): Weather | null {
  const t = date.getTime()
  const { times, values } = forecast
  let k = -1
  for (let i = 0; i < times.length && times[i] <= t; i++) k = i
  if (k < 0 || k + 1 >= times.length) return null
  const share = (t - times[k]) / (times[k + 1] - times[k])
  const weather = { time: t } as Weather
  for (const field of Object.keys(VARIABLES) as WeatherField[]) {
    const series = values[field]
    weather[field] = INSTANT.has(field) ? lerp(series[k], series[k + 1], share) : series[k + 1]
  }
  return weather
}

export interface RainOutlook {
  /** Probabilidad de lluvia (%). */
  probability: number
  /** Inicio de la hora con la probabilidad más alta. */
  time: number
}

/** La hora con más probabilidad de lluvia en las próximas `hours` horas (la primera si empatan). */
export function rainOutlook(forecast: Forecast, from: Date, hours = 3): RainOutlook | null {
  const start = Math.floor(from.getTime() / HOUR_MS) * HOUR_MS
  let best: RainOutlook | null = null
  for (let h = 0; h < hours; h++) {
    const hourStart = start + h * HOUR_MS
    // La probabilidad de la hora [hourStart, hourStart + 1 h) va en el registro que la cierra.
    const i = forecast.times.indexOf(hourStart + HOUR_MS)
    const probability = i < 0 ? null : forecast.values.rainProbability[i]
    if (probability !== null && (!best || probability > best.probability)) best = { probability, time: hourStart }
  }
  return best
}

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>

function defaultStorage(): KeyValueStorage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

/** Pronóstico guardado, si es del mismo lugar (±0,01°). */
export function readCachedForecast(lat: number, lon: number, storage = defaultStorage()): Forecast | null {
  try {
    const raw = storage?.getItem(STORAGE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw) as Forecast
    const sameSpot = Math.abs(cached.latitude - lat) < 0.01 && Math.abs(cached.longitude - lon) < 0.01
    return sameSpot && Array.isArray(cached.times) && typeof cached.fetchedAt === 'number' ? cached : null
  } catch {
    return null
  }
}

function saveForecast(forecast: Forecast, storage: KeyValueStorage | null) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(forecast))
  } catch {
    // Sin espacio o almacenamiento bloqueado: se sigue con el dato en memoria.
  }
}

export async function fetchForecast(lat: number, lon: number, fetchFn: typeof fetch = fetch, now = Date.now()) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const response = await fetchFn(forecastUrl(lat, lon), { signal: controller.signal })
    if (!response.ok) throw new Error(`Open-Meteo respondió ${response.status}`)
    const forecast = parseForecast(await response.json(), now)
    // Open-Meteo devuelve la celda de su malla; se guarda el punto pedido para reconocer la caché.
    return { ...forecast, latitude: lat, longitude: lon }
  } finally {
    clearTimeout(timer)
  }
}

export interface ForecastResult {
  forecast: Forecast
  /** true si no se pudo renovar y se usa un dato guardado más viejo que REFRESH_MS. */
  stale: boolean
}

/** Pronóstico con caché: usa el guardado si tiene menos de una hora; si no, lo renueva y, sin red, usa el guardado. */
export async function getForecast(
  lat: number,
  lon: number,
  { fetchFn = fetch, now = Date.now(), storage = defaultStorage() }: { fetchFn?: typeof fetch; now?: number; storage?: KeyValueStorage | null } = {},
): Promise<ForecastResult> {
  const cached = readCachedForecast(lat, lon, storage)
  if (cached && now - cached.fetchedAt < REFRESH_MS) return { forecast: cached, stale: false }
  try {
    const forecast = await fetchForecast(lat, lon, fetchFn, now)
    saveForecast(forecast, storage)
    return { forecast, stale: false }
  } catch (error) {
    if (cached) return { forecast: cached, stale: true }
    throw error
  }
}
