// Reglas del semáforo térmico (CLAUDE.md, "Semáforo térmico").
// Son PROVISIONALES: se calibran con las mediciones de campo. Todo lo ajustable está en las constantes.
// Los ejemplos de la pantalla 17 de Figma (nodo 32:154) son los casos de prueba de reglas-semaforo.test.ts.

import type { ThermalLevel } from './niveles'

/** Categorías de estrés por calor del UTCI. */
export type UtciCategory = 'sin_estres' | 'moderado' | 'fuerte' | 'muy_fuerte' | 'extremo'

/** Límites del UTCI (°C): sin estrés < 26 · moderado 26–32 · fuerte 32–38 · muy fuerte 38–46 · extremo > 46. */
export const UTCI_LIMITS = { moderado: 26, fuerte: 32, muy_fuerte: 38, extremo: 46 } as const

export function utciCategory(utci: number): UtciCategory {
  if (utci > UTCI_LIMITS.extremo) return 'extremo'
  if (utci >= UTCI_LIMITS.muy_fuerte) return 'muy_fuerte'
  if (utci >= UTCI_LIMITS.fuerte) return 'fuerte'
  if (utci >= UTCI_LIMITS.moderado) return 'moderado'
  return 'sin_estres'
}

/** Niveles de calor de menor a mayor. "nublado" no está: es un estado aparte. */
export const HEAT_LEVELS = ['comodo', 'precaucion', 'evitar', 'no_recomendado'] as const
export type HeatLevel = (typeof HEAT_LEVELS)[number]

/** Nivel de la interfaz para cada categoría del UTCI (pantalla 17: 29° cómodo, 35° precaución, 41° evitar, 47° no recomendado). */
export const LEVEL_BY_CATEGORY: Record<UtciCategory, HeatLevel> = {
  sin_estres: 'comodo',
  moderado: 'comodo',
  fuerte: 'precaucion',
  muy_fuerte: 'evitar',
  extremo: 'no_recomendado',
}

/** El Niño activo endurece un nivel cuando ya hay estrés fuerte o más (nivel base desde "precaución"). */
export const EL_NINO_FROM_LEVEL: HeatLevel = 'precaucion'

/** Nubosidad (%) desde la que el mapa pasa al estado "nublado" (pantalla 20). */
export const CLOUDY_MIN_COVER = 80

/** El chip "Nublado · riesgo bajo" solo se usa si, con todo y nubes, el nivel no pasa de este. */
export const CLOUDY_MAX_LEVEL: HeatLevel = 'precaucion'

/** Minutos al sol desde los que una ruta se evalúa con el UTCI al sol pleno. */
export const FULL_SUN_MINUTES = 10

/** Perfil de calor del usuario (pantalla 23, Fase 9). El vulnerable endurece un nivel. */
export const HEAT_PROFILES = ['estandar', 'vulnerable'] as const
export type HeatProfile = (typeof HEAT_PROFILES)[number]

export interface ThermalInputs {
  /** UTCI estimado al sol y a la sombra (°C). */
  utciSun: number
  utciShade: number
  /** Nubosidad total (%), o null si no se sabe. */
  cloudCover: number | null
  elNino: boolean
  profile: HeatProfile
}

export type Hardening = 'el_nino' | 'perfil'

export interface ThermalDecision {
  /** Lo que muestra el semáforo, incluido "nublado". */
  level: ThermalLevel
  /** Nivel de calor después de endurecer y antes de aplicar "nublado". */
  heatLevel: HeatLevel
  /** Categoría del UTCI que decidió el nivel. */
  category: UtciCategory
  /** Por qué se endureció (en orden), para explicarlo en el simulador. */
  hardenedBy: Hardening[]
  cloudy: boolean
}

const rank = (level: HeatLevel) => HEAT_LEVELS.indexOf(level)

function decide(utci: number, input: ThermalInputs, allowCloudy: boolean): ThermalDecision {
  const category = utciCategory(utci)
  const base = LEVEL_BY_CATEGORY[category]
  const hardenedBy: Hardening[] = []
  if (input.elNino && rank(base) >= rank(EL_NINO_FROM_LEVEL)) hardenedBy.push('el_nino')
  if (input.profile === 'vulnerable') hardenedBy.push('perfil')
  const heatLevel = HEAT_LEVELS[Math.min(HEAT_LEVELS.length - 1, rank(base) + hardenedBy.length)]
  const cloudy =
    allowCloudy && (input.cloudCover ?? 0) >= CLOUDY_MIN_COVER && rank(heatLevel) <= rank(CLOUDY_MAX_LEVEL)
  return { level: cloudy ? 'nublado' : heatLevel, heatLevel, category, hardenedBy, cloudy }
}

/** Nivel general (barra superior del mapa): el de una persona que camina al sol a esa hora. */
export function generalLevel(input: ThermalInputs): ThermalDecision {
  return decide(input.utciSun, input, true)
}

/** UTCI de una ruta: va de la sombra al sol según los minutos al sol (pleno desde FULL_SUN_MINUTES). */
export function routeUtci(utciShade: number, utciSun: number, minutesInSun: number): number {
  const share = Math.min(1, Math.max(0, minutesInSun) / FULL_SUN_MINUTES)
  return utciShade + (utciSun - utciShade) * share
}

/** Nivel de una ruta (Fase 6). No usa "nublado": decide si la ruta conviene. */
export function routeLevel(input: ThermalInputs & { minutesInSun: number }): ThermalDecision {
  return decide(routeUtci(input.utciShade, input.utciSun, input.minutesInSun), input, false)
}
