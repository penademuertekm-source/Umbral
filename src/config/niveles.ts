// Vocabulario compartido de estados. Los valores coinciden con CLAUDE.md y la especificación.

/** Niveles del semáforo térmico, más el estado neutro "nublado". */
export const THERMAL_LEVELS = ['comodo', 'precaucion', 'evitar', 'no_recomendado', 'nublado'] as const
export type ThermalLevel = (typeof THERMAL_LEVELS)[number]

/** Estado de sombra de un tramo de acera. */
export const SEGMENT_STATES = ['sombra', 'parcial', 'expuesto'] as const
export type SegmentState = (typeof SEGMENT_STATES)[number]
