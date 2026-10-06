import { describe, expect, it } from 'vitest'
import { estimateUtci, solarDeltaMrt, SUN_EXPOSURE, utciValue, type SunExposure } from './utci'

// Valores de referencia: tablas de validación de pythermalcomfort y jsthermalcomfort
// (github.com/FedericoTartarini/validation-data-comfort-models, licencia MIT):
// ts_utci.json (aproximación de Bröde et al., 2012) y ts_solar_gain.json (ejemplos de ASHRAE 55-2017).

describe('UTCI', () => {
  it('coincide con la tabla de referencia (tolerancia 0,1 °C)', () => {
    const cases: [tdb: number, tr: number, rh: number, v: number, expected: number][] = [
      [25, 27, 50, 1, 25.2],
      [19, 24, 50, 1, 20.0],
      [19, 14, 50, 1, 16.8],
      [27, 22, 50, 1, 25.5],
      [27, 22, 50, 10, 20.0],
      [27, 22, 50, 16, 15.8],
      [30, 27, 50, 1, 29.6],
      [9, 9, 50, 1, 8.7],
      [25, 25, 50, 1, 24.6],
    ]
    for (const [tdb, tr, rh, v, expected] of cases) {
      expect(utciValue(tdb, tr, v, rh), `${tdb} °C, Trm ${tr} °C, ${v} m/s`).toBeCloseTo(expected, 1)
    }
  })

  it('fuera del rango del modelo no inventa un valor', () => {
    expect(utciValue(51, 22, 16, 50)).toBeNaN()
    expect(estimateUtci({ airTemp: 51, humidity: 50, windSpeed: 2, directNormal: 800, sunElevation: 60 })).toBeNull()
  })

  it('con viento por debajo de 0,5 m/s usa el mínimo del modelo', () => {
    expect(utciValue(27, 22, 0, 50)).toBe(utciValue(27, 22, 0.5, 50))
  })
})

describe('ganancia solar (SolarCal)', () => {
  // La tabla de ASHRAE usa reflectancia del suelo 0,6 (valor por defecto de la librería).
  const ashrae = (changes: Partial<SunExposure>): SunExposure => ({
    ...SUN_EXPOSURE,
    groundAlbedo: 0.6,
    transmittance: 0.5,
    skyViewFraction: 0.5,
    bodyExposedFraction: 0.5,
    absorptivity: 0.7,
    ...changes,
  })

  it('coincide con los ejemplos de ASHRAE 55 (tolerancia 0,1 °C)', () => {
    expect(solarDeltaMrt(30, 800, ashrae({ posture: 'standing', sharpDeg: 120 }))).toBeCloseTo(13.6, 1)
    expect(solarDeltaMrt(90, 800, ashrae({ posture: 'sitting', sharpDeg: 120 }))).toBeCloseTo(15.6, 1)
    expect(
      solarDeltaMrt(45, 700, ashrae({ posture: 'sitting', sharpDeg: 0, transmittance: 0.8, skyViewFraction: 0.2 })),
    ).toBeCloseTo(15.5, 1)
  })

  it('no suma nada con el sol bajo el horizonte o sin radiación directa', () => {
    expect(solarDeltaMrt(0, 800)).toBe(0)
    expect(solarDeltaMrt(-5, 800)).toBe(0)
    expect(solarDeltaMrt(60, 0)).toBe(0)
  })
})

describe('UTCI estimado a la sombra y al sol', () => {
  it('a la sombra usa la temperatura del aire como temperatura radiante', () => {
    const estimate = estimateUtci({ airTemp: 34, humidity: 50, windSpeed: 2.5, directNormal: 850, sunElevation: 75 })
    expect(estimate?.shade).toBe(utciValue(34, 34, 2.5, 50))
  })

  it('un mediodía típico de Valledupar da "muy fuerte" al sol y "fuerte" a la sombra', () => {
    const estimate = estimateUtci({ airTemp: 34, humidity: 50, windSpeed: 2.5, directNormal: 850, sunElevation: 75 })
    expect(estimate).not.toBeNull()
    expect(estimate!.shade).toBeGreaterThanOrEqual(32)
    expect(estimate!.shade).toBeLessThan(38)
    expect(estimate!.sun).toBeGreaterThanOrEqual(38)
    expect(estimate!.sun).toBeLessThanOrEqual(46)
    expect(estimate!.deltaMrt).toBeGreaterThan(25)
    expect(estimate!.deltaMrt).toBeLessThan(45)
  })

  it('con nubes (poca radiación directa) el sol y la sombra casi se igualan', () => {
    const estimate = estimateUtci({ airTemp: 31, humidity: 70, windSpeed: 2, directNormal: 60, sunElevation: 50 })
    expect(estimate!.sun - estimate!.shade).toBeLessThan(1.5)
  })
})
