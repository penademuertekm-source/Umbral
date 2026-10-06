// Parámetros de las rutas (Fase 6). Son PROVISIONALES y fáciles de editar.
import type { HeatProfile } from './reglas-semaforo'

export interface RouteProfile {
  /** Velocidad al caminar (m/s). */
  speed: number
  /** k en "tiempo × (1 + k × fracción al sol)": cuánto se castiga caminar al sol. */
  sunPenalty: number
}

/** Perfil General (estándar) y perfiles sensibles (vulnerable). */
export const ROUTE_PROFILES: Record<HeatProfile, RouteProfile> = {
  estandar: { speed: 1.2, sunPenalty: 2 },
  vulnerable: { speed: 1.0, sunPenalty: 3 },
}

/** Ancho de la calzada al cruzar, por tipo de vía (m): dos veces la distancia del eje a la acera (Fase 2). */
export const CROSSING_WIDTH_M: Record<string, number> = {
  primary: 12,
  secondary: 11,
  secondary_link: 11,
  tertiary: 9,
  residential: 8,
  unclassified: 8,
  living_street: 7,
  service: 6,
  pedestrian: 6,
  footway: 3,
  path: 3,
  steps: 3,
}
export const DEFAULT_CROSSING_WIDTH_M = 8

/** Segundos extra por cada cruce de calle (mirar y esperar). El cruce cuenta al sol. */
export const CROSSING_EXTRA_S = 5

/** Si la ruta con sombra no reduce al menos este tanto los minutos al sol frente a la corta, se muestra una sola ruta. */
export const SINGLE_ROUTE_MIN_IMPROVEMENT = 0.15

/** Bandas de las isócronas (minutos caminando con el costo de sombra). */
export const ISOCHRONE_BANDS_MIN = [5, 10, 15] as const

/** "¿Cuándo salir?": de 6:00 a 18:00, cada 15 min. */
export const DEPARTURES = { startHour: 6, endHour: 18, stepMin: 15 } as const

/** Una ventana recomendada admite hasta este tanto de minutos al sol por encima del mejor momento. */
export const WINDOW_TOLERANCE_MIN = 1

/** Distancia máxima de un refugio a la ruta para contarlo como punto de descanso (m). */
export const REST_POINT_DISTANCE_M = 60
