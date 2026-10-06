// Parámetros del recorrido (Fase 7, pantallas 19, 18, 13 y 22). Son PROVISIONALES y fáciles de editar.

/** Pantalla 19: aviso antes de salir entre estas horas (hora de Valledupar, [desde, hasta)). */
export const HEAT_WARNING_HOURS = { from: 11, to: 15 } as const

/** Pantalla 18: protección solar si la ruta tiene al menos estos minutos al sol y el UV llega a este índice. */
export const SUN_PROTECTION = { minSunMinutes: 5, minUv: 8 } as const

/** Pantalla 13: error del GPS que se tolera al ubicar a la persona sobre la ruta (m). */
export const GPS_TOLERANCE_M = 20

/** Con una precisión peor que esta, el margen deja de crecer (m). */
export const GPS_MAX_TOLERANCE_M = 40

/** Pantalla 13: el aviso ámbar sale a esta distancia antes de un tramo expuesto (m). */
export const EXPOSED_WARNING_M = 150

/** Pantalla 22: se llega al estar a menos de esta distancia del destino (m). */
export const ARRIVAL_RADIUS_M = 25

/** Antes de avanzar, si la persona está más lejos que esto de la ruta, se le sugiere acercarse o simular (m). */
export const FAR_FROM_ROUTE_M = 60

/** Modo simulación: cuántas veces más rápido que caminando avanza (10 min de ruta ≈ 75 s). */
export const SIMULATION_SPEEDUP = 8

/** Modo simulación: cada cuánto se mueve el punto (ms). */
export const SIMULATION_TICK_MS = 250
