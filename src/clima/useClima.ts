import { useEffect, useState } from 'react'
import { loadClimaConfig, type ClimaConfig } from './configClima'
import { getForecast, type Forecast } from './openMeteo'

export type EstadoClima =
  | { status: 'cargando' }
  | { status: 'listo'; forecast: Forecast; stale: boolean }
  | { status: 'error'; error: string }

/** Cada cuánto se revisa si toca renovar el pronóstico (getForecast decide si descarga). */
const CHECK_MS = 10 * 60 * 1000

/** Pronóstico de Open-Meteo para el centro [lon, lat]; se renueva cada hora y al recuperar la conexión. */
export function useClima(center: [number, number] | null): EstadoClima {
  const [estado, setEstado] = useState<EstadoClima>({ status: 'cargando' })
  const [tick, setTick] = useState(0)
  const lon = center?.[0]
  const lat = center?.[1]

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), CHECK_MS)
    const online = () => setTick((n) => n + 1)
    window.addEventListener('online', online)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('online', online)
    }
  }, [])

  useEffect(() => {
    if (lat === undefined || lon === undefined) return
    let vigente = true
    getForecast(lat, lon)
      .then(({ forecast, stale }) => {
        if (vigente) setEstado({ status: 'listo', forecast, stale })
      })
      .catch((error: unknown) => {
        // Si ya había un pronóstico en pantalla, se conserva.
        if (vigente) {
          setEstado((anterior) =>
            anterior.status === 'listo'
              ? { ...anterior, stale: true }
              : { status: 'error', error: error instanceof Error ? error.message : String(error) },
          )
        }
      })
    return () => {
      vigente = false
    }
  }, [lat, lon, tick])

  return estado
}

/** clima_config.json (El Niño). null mientras carga. */
export function useClimaConfig(): ClimaConfig | null {
  const [config, setConfig] = useState<ClimaConfig | null>(null)
  useEffect(() => {
    let vigente = true
    loadClimaConfig().then((loaded) => vigente && setConfig(loaded))
    return () => {
      vigente = false
    }
  }, [])
  return config
}
