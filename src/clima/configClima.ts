// Configuración del clima (public/datos/clima_config.json, copiada de datos/provisional/ al correr dev o build).
// El indicador de El Niño se actualiza a mano según los boletines del IDEAM.
import { HEAT_PROFILE_OPTIONS, PROFILE_OF_OPTION, type HeatProfile, type HeatProfileOption } from '../config/reglas-semaforo'
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

/** Valores de antes de la Fase 9 (solo había dos perfiles). */
const LEGACY: Record<string, HeatProfileOption> = { estandar: 'general', vulnerable: 'salud' }

/** Opción de la pantalla 23 guardada en el dispositivo. Por defecto, General. */
export function readHeatProfileOption(): HeatProfileOption {
  try {
    const value = localStorage.getItem(PROFILE_KEY) ?? ''
    if ((HEAT_PROFILE_OPTIONS as readonly string[]).includes(value)) return value as HeatProfileOption
    return LEGACY[value] ?? 'general'
  } catch {
    return 'general'
  }
}

export function writeHeatProfileOption(option: HeatProfileOption): void {
  try {
    localStorage.setItem(PROFILE_KEY, option)
  } catch {
    // Sin almacenamiento: el perfil vale solo mientras la página esté abierta.
  }
}

/** Regla del perfil guardado (estándar o vulnerable), para el semáforo y el costo de las rutas. */
export function readHeatProfile(): HeatProfile {
  return PROFILE_OF_OPTION[readHeatProfileOption()]
}
