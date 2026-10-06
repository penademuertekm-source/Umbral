// Estado térmico para una hora: clima de Open-Meteo + posición del sol + UTCI + reglas del semáforo.
// Código puro: lo usan el mapa (pantalla 04) y el simulador de /guia.
import { generalLevel, type HeatProfile, type ThermalDecision } from '../config/reglas-semaforo'
import { sunPosition } from '../sombra/modelo'
import { weatherAt, type Forecast, type Weather } from './openMeteo'
import { estimateUtci, type UtciEstimate } from './utci'

export interface ThermalContext {
  /** Centro del área [lon, lat]. */
  center: [number, number]
  elNino: boolean
  profile: HeatProfile
}

export interface ThermalState {
  weather: Weather | null
  sunElevation: number
  utci: UtciEstimate | null
  decision: ThermalDecision | null
}

/** Simulación de la pantalla 20: cielo cubierto al 90 % y sin sol directo. */
export function simulateOvercast(weather: Weather): Weather {
  return { ...weather, cloudCover: 90, directNormal: 0, direct: 0 }
}

export function thermalStateAt(
  forecast: Forecast | null,
  date: Date,
  context: ThermalContext,
  transform: (weather: Weather) => Weather = (weather) => weather,
): ThermalState {
  const [lon, lat] = context.center
  const sunElevation = sunPosition({ lat, lon }, date).elevation
  const found = forecast ? weatherAt(forecast, date) : null
  const weather = found ? transform(found) : null
  if (!weather || weather.airTemp === null || weather.humidity === null || weather.windSpeed === null) {
    return { weather, sunElevation, utci: null, decision: null }
  }
  const utci = estimateUtci({
    airTemp: weather.airTemp,
    humidity: weather.humidity,
    windSpeed: weather.windSpeed,
    directNormal: weather.directNormal ?? 0,
    sunElevation,
  })
  const decision = utci
    ? generalLevel({
        utciSun: utci.sun,
        utciShade: utci.shade,
        cloudCover: weather.cloudCover,
        elNino: context.elNino,
        profile: context.profile,
      })
    : null
  return { weather, sunElevation, utci, decision }
}
