// UTCI estimado a la sombra y al sol (CLAUDE.md, "Semáforo térmico"). Método, supuestos y
// simplificaciones en docs/metodo-utci.md. Todo resultado se muestra rotulado como "estimado".
//
// Usa jsthermalcomfort (MIT, Center for the Built Environment): `utci` es la aproximación polinómica
// de Bröde et al. (2012) y `solar_gain` es SolarCal (ASHRAE 55, apéndice C).
import { solar_gain } from 'jsthermalcomfort/lib/esm/models/solar_gain.js'
import { utci } from 'jsthermalcomfort/lib/esm/models/utci.js'

export interface SunExposure {
  posture: 'standing' | 'sitting'
  /** Ángulo horizontal del sol respecto al frente de la persona (0 = de frente, 180 = de espalda). */
  sharpDeg: number
  /** Fracción de la bóveda celeste que ve el cuerpo (1 = cielo abierto). */
  skyViewFraction: number
  /** Fracción del cuerpo expuesta al sol directo. */
  bodyExposedFraction: number
  /** Transmitancia solar (1 = sin vidrio ni toldo de por medio). */
  transmittance: number
  /** Absortividad de onda corta de la piel y la ropa. */
  absorptivity: number
  /** Reflectancia del suelo (albedo). */
  groundAlbedo: number
}

/** Persona que camina al sol por la calle (supuestos provisionales de docs/metodo-utci.md). */
export const SUN_EXPOSURE: SunExposure = {
  posture: 'standing',
  sharpDeg: 90, // sol de costado: la dirección de la marcha cambia en cada calle
  skyViewFraction: 1,
  bodyExposedFraction: 1,
  transmittance: 1,
  absorptivity: 0.7, // valor de ASHRAE 55 cuando no hay más datos
  groundAlbedo: 0.2, // asfalto y concreto envejecido (ASHRAE usa 0,6, pensado para interiores)
}

/** Viento válido para la aproximación del UTCI (m/s a 10 m). Con menos viento se usa el mínimo. */
export const UTCI_WIND_RANGE = [0.5, 17] as const
/** Máximo de Trm − Ta que acepta la aproximación del UTCI (°C). */
export const UTCI_MAX_DELTA_MRT = 70

/** UTCI (°C, a 0,1) para una temperatura radiante media dada; NaN fuera del rango válido. */
export function utciValue(airTemp: number, meanRadiantTemp: number, windSpeed: number, humidity: number): number {
  const wind = Math.min(UTCI_WIND_RANGE[1], Math.max(UTCI_WIND_RANGE[0], windSpeed))
  return utci(airTemp, meanRadiantTemp, wind, humidity).utci
}

/** Aumento de la temperatura radiante media por el sol (°C), con SolarCal. 0 si el sol está bajo el horizonte. */
export function solarDeltaMrt(sunElevation: number, directNormal: number, exposure: SunExposure = SUN_EXPOSURE): number {
  if (!(sunElevation > 0) || !(directNormal > 0)) return 0
  const { delta_mrt: delta } = solar_gain(
    Math.min(sunElevation, 90),
    exposure.sharpDeg,
    directNormal,
    exposure.transmittance,
    exposure.skyViewFraction,
    exposure.bodyExposedFraction,
    exposure.absorptivity,
    exposure.posture,
    exposure.groundAlbedo,
  )
  return Math.min(delta, UTCI_MAX_DELTA_MRT)
}

export interface UtciInputs {
  /** Temperatura del aire (°C). */
  airTemp: number
  /** Humedad relativa (%). */
  humidity: number
  /** Viento a 10 m (m/s). */
  windSpeed: number
  /** Radiación directa normal (W/m²). */
  directNormal: number
  /** Elevación del sol (°). */
  sunElevation: number
}

export interface UtciEstimate {
  /** UTCI estimado a la sombra: temperatura radiante media = temperatura del aire. */
  shade: number
  /** UTCI estimado al sol: se suma la ganancia solar a la temperatura radiante media. */
  sun: number
  /** Aumento de la temperatura radiante media al sol (°C). */
  deltaMrt: number
}

/** UTCI estimado a la sombra y al sol, o null si las condiciones salen del rango del modelo. */
export function estimateUtci(input: UtciInputs): UtciEstimate | null {
  const deltaMrt = solarDeltaMrt(input.sunElevation, input.directNormal)
  const shade = utciValue(input.airTemp, input.airTemp, input.windSpeed, input.humidity)
  const sun = utciValue(input.airTemp, input.airTemp + deltaMrt, input.windSpeed, input.humidity)
  if (!Number.isFinite(shade) || !Number.isFinite(sun)) return null
  return { shade, sun, deltaMrt }
}
