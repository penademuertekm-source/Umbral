import { describe, expect, it, vi } from 'vitest'
import { localDate } from '../sombra/tiempo'
import { forecastUrl, getForecast, parseForecast, rainOutlook, REFRESH_MS, weatherAt } from './openMeteo'

const START = localDate(2026, 10, 6, 0).getTime() / 1000
const HOURS = 48

/** Respuesta con la forma de Open-Meteo (timeformat=unixtime): la hora h vale h en cada serie. */
function response(changes: Record<string, unknown> = {}) {
  const series = (f: (h: number) => number | null) => Array.from({ length: HOURS }, (_, h) => f(h))
  return {
    latitude: 10.48,
    longitude: -73.24,
    hourly: {
      time: series((h) => START + h * 3600),
      temperature_2m: series((h) => 20 + h),
      relative_humidity_2m: series(() => 60),
      wind_speed_10m: series(() => 2),
      shortwave_radiation: series((h) => h * 10),
      direct_radiation: series((h) => h * 5),
      diffuse_radiation: series((h) => h * 2),
      direct_normal_irradiance: series((h) => h * 20),
      cloud_cover: series((h) => (h === 11 ? null : 50)),
      uv_index: series(() => 9),
      precipitation_probability: series((h) => [0, 10, 60, 60, 20][h % 5]),
      ...changes,
    },
  }
}

const forecast = parseForecast(response(), 0)
const at = (hour: number, minute = 0) => localDate(2026, 10, 6, hour, minute)

describe('Open-Meteo', () => {
  it('pide las variables del prompt, en hora de Bogotá y con viento en m/s', () => {
    const url = new URL(forecastUrl(10.477751, -73.244632))
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast')
    expect(url.searchParams.get('latitude')).toBe('10.4778')
    expect(url.searchParams.get('timezone')).toBe('America/Bogota')
    expect(url.searchParams.get('wind_speed_unit')).toBe('ms')
    expect(url.searchParams.get('hourly')?.split(',')).toEqual(
      expect.arrayContaining([
        'temperature_2m',
        'relative_humidity_2m',
        'wind_speed_10m',
        'shortwave_radiation',
        'direct_radiation',
        'diffuse_radiation',
        'direct_normal_irradiance',
        'cloud_cover',
        'uv_index',
        'precipitation_probability',
      ]),
    )
  })

  it('rechaza respuestas incompletas', () => {
    expect(() => parseForecast({ hourly: {} }, 0)).toThrow()
    expect(() => parseForecast(response({ uv_index: [1, 2] }), 0)).toThrow(/uv_index/)
  })

  it('interpola los valores instantáneos y toma la radiación de la hora en curso', () => {
    const w = weatherAt(forecast, at(10, 15))!
    expect(w.airTemp).toBeCloseTo(30.25) // entre las 10:00 (30) y las 11:00 (31)
    expect(w.directNormal).toBe(220) // registro de las 11:00: promedio de 10:00 a 11:00
    expect(w.rainProbability).toBe(10) // registro de las 11:00 (11 % 5 = 1)
    expect(weatherAt(forecast, at(11))!.directNormal).toBe(240)
  })

  it('no inventa datos faltantes ni fuera del pronóstico', () => {
    expect(weatherAt(forecast, at(10, 50))!.cloudCover).toBeNull() // la nubosidad de las 11:00 vino vacía
    expect(weatherAt(forecast, at(10, 10))!.cloudCover).toBe(50)
    expect(weatherAt(forecast, localDate(2026, 10, 5, 23))).toBeNull()
    expect(weatherAt(forecast, localDate(2026, 10, 8, 0))).toBeNull()
  })

  it('busca la hora con más probabilidad de lluvia en las próximas 3 horas', () => {
    // Desde las 15:20: horas 15, 16 y 17 → registros de las 16 (10 %), 17 (60 %) y 18 (60 %).
    expect(rainOutlook(forecast, at(15, 20))).toEqual({ probability: 60, time: at(16).getTime() })
  })
})

describe('caché del pronóstico', () => {
  function memoryStorage() {
    const data = new Map<string, string>()
    return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) }
  }
  const ok = () => Promise.resolve(new Response(JSON.stringify(response())))
  const offline = () => Promise.reject(new TypeError('Failed to fetch'))

  it('guarda el pronóstico y lo reutiliza durante una hora', async () => {
    const storage = memoryStorage()
    const fetchFn = vi.fn(ok)
    const first = await getForecast(10.4778, -73.2446, { fetchFn, storage, now: 1_000 })
    expect(first.stale).toBe(false)
    expect(first.forecast.fetchedAt).toBe(1_000)
    await getForecast(10.4778, -73.2446, { fetchFn, storage, now: 1_000 + REFRESH_MS - 1 })
    expect(fetchFn).toHaveBeenCalledTimes(1)
    await getForecast(10.4778, -73.2446, { fetchFn, storage, now: 1_000 + REFRESH_MS })
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('sin conexión usa el dato guardado y avisa que es viejo', async () => {
    const storage = memoryStorage()
    await getForecast(10.4778, -73.2446, { fetchFn: ok, storage, now: 1_000 })
    const result = await getForecast(10.4778, -73.2446, { fetchFn: offline, storage, now: 1_000 + 3 * REFRESH_MS })
    expect(result.stale).toBe(true)
    expect(result.forecast.fetchedAt).toBe(1_000)
  })

  it('sin conexión y sin dato guardado, falla', async () => {
    await expect(getForecast(10.4778, -73.2446, { fetchFn: offline, storage: memoryStorage() })).rejects.toThrow()
  })

  it('no reutiliza el pronóstico de otro lugar', async () => {
    const storage = memoryStorage()
    const fetchFn = vi.fn(ok)
    await getForecast(10.4778, -73.2446, { fetchFn, storage, now: 1_000 })
    await getForecast(4.711, -74.0721, { fetchFn, storage, now: 1_001 })
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })
})
