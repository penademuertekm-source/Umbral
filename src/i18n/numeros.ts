/** "650 m" o "1,6 km" (en inglés, "1.6 km"). Las distancias cortas se redondean a la decena. */
export function formatDistance(meters: number, language: string): string {
  if (meters < 950) return `${Math.max(10, Math.round(meters / 10) * 10)} m`
  const km = new Intl.NumberFormat(language === 'es' ? 'es-CO' : 'en-US', { maximumFractionDigits: 1 }).format(meters / 1000)
  return `${km} km`
}

/** Minutos enteros para mostrar (nunca 0 si hay algo de camino). */
export function roundMinutes(minutes: number): number {
  return minutes <= 0 ? 0 : Math.max(1, Math.round(minutes))
}
