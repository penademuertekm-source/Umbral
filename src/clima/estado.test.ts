import { describe, expect, it } from 'vitest'
import { localDate } from '../sombra/tiempo'
import { simulateOvercast, thermalStateAt, type ThermalContext } from './estado'
import { parseForecast } from './openMeteo'

// Un día despejado y caluroso en Valledupar: 34 °C y 850 W/m² de radiación directa de 10 a 15 h.
const START = localDate(2026, 10, 6, 0).getTime() / 1000
const series = (f: (h: number) => number) => Array.from({ length: 48 }, (_, i) => f(i % 24))
const forecast = parseForecast(
  {
    latitude: 10.48,
    longitude: -73.24,
    hourly: {
      time: Array.from({ length: 48 }, (_, i) => START + i * 3600),
      temperature_2m: series((h) => (h >= 10 && h <= 15 ? 34 : 27)),
      relative_humidity_2m: series(() => 50),
      wind_speed_10m: series(() => 2.5),
      shortwave_radiation: series(() => 0),
      direct_radiation: series(() => 0),
      diffuse_radiation: series(() => 0),
      direct_normal_irradiance: series((h) => (h >= 10 && h <= 16 ? 850 : 0)),
      cloud_cover: series(() => 10),
      uv_index: series(() => 11),
      precipitation_probability: series(() => 5),
    },
  },
  0,
)
const context: ThermalContext = { center: [-73.244632, 10.477751], elNino: false, profile: 'estandar' }

describe('estado térmico de una hora', () => {
  it('al mediodía despejado el semáforo dice "Evitar a pie"', () => {
    const state = thermalStateAt(forecast, localDate(2026, 10, 6, 12), context)
    expect(state.sunElevation).toBeGreaterThan(70)
    expect(state.utci!.sun).toBeGreaterThan(state.utci!.shade)
    expect(state.decision!.level).toBe('evitar')
  })

  it('con El Niño activo, el mismo mediodía pasa a "No recomendado"', () => {
    const state = thermalStateAt(forecast, localDate(2026, 10, 6, 12), { ...context, elNino: true })
    expect(state.decision!.level).toBe('no_recomendado')
  })

  it('la simulación de cielo cubierto quita el sol directo', () => {
    const state = thermalStateAt(forecast, localDate(2026, 10, 6, 12), context, simulateOvercast)
    expect(state.weather!.cloudCover).toBe(90)
    expect(state.utci!.deltaMrt).toBe(0)
    expect(state.utci!.sun).toBe(state.utci!.shade)
  })

  it('sin pronóstico para esa hora no hay nivel', () => {
    expect(thermalStateAt(forecast, localDate(2026, 10, 9, 12), context).decision).toBeNull()
    expect(thermalStateAt(null, localDate(2026, 10, 6, 12), context).decision).toBeNull()
  })
})
