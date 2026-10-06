// Configuración del clima (public/datos/clima_config.json, copiada de datos/provisional/ al correr dev o build).
// El indicador de El Niño se actualiza a mano según los boletines del IDEAM.
import { HEAT_PROFILES, type HeatProfile } from '../config/reglas-semaforo'
import { dataBaseUrl } from '../sombra/cargar'

export interface ClimaConfig {
  elNino: boolean
  /** De dónde sale el indicador (p. ej. "Boletín IDEAM…"). */
  source: string
  /** Fecha de la última actualización (AAAA-MM-DD). */
  updated: string
}

const FALLBACK: ClimaConfig = { elNino: false, source: '', updated: '' }
let cache: Promise<ClimaConfig> | null = null

/** Si el archivo no carga, se asume El Niño inactivo (no se inventa una alerta). */
export function loadClimaConfig(fetchFn: typeof fetch = fetch): Promise<ClimaConfig> {
  cache ??= fetchFn(`${dataBaseUrl()}clima_config.json`)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((json: { el_nino_activo?: unknown; fuente_el_nino?: unknown; fecha_actualizacion?: unknown }) => ({
      elNino: json.el_nino_activo === true,
      source: typeof json.fuente_el_nino === 'string' ? json.fuente_el_nino : '',
      updated: typeof json.fecha_actualizacion === 'string' ? json.fecha_actualizacion : '',
    }))
    .catch(() => {
      cache = null
      return FALLBACK
    })
  return cache
}

const PROFILE_KEY = 'umbral.perfilCalor'

/** Perfil de calor guardado en el dispositivo (lo elige la pantalla 23, Fase 9). Por defecto, estándar. */
export function readHeatProfile(): HeatProfile {
  try {
    const value = localStorage.getItem(PROFILE_KEY)
    return (HEAT_PROFILES as readonly string[]).includes(value ?? '') ? (value as HeatProfile) : 'estandar'
  } catch {
    return 'estandar'
  }
}
