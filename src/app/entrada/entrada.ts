// Lógica de la entrada (Fase 8, pantallas 01, 02, 03 y 21). Código puro salvo el acceso a localStorage.
import type { LonLat } from '../../rutas/geometria'

const DONE_KEY = 'umbral.bienvenida'

/** ¿Ya pasó por la pantalla 03 alguna vez? */
export function onboardingDone(): boolean {
  try {
    return localStorage.getItem(DONE_KEY) === 'hecha'
  } catch {
    return false
  }
}

export function markOnboardingDone(): void {
  try {
    localStorage.setItem(DONE_KEY, 'hecha')
  } catch {
    // Sin almacenamiento: la bienvenida volverá a salir, que no hace daño.
  }
}

/** Después del inicio (01): primer uso → idioma (02) → ubicación (03); usos siguientes → mapa (04). */
export function nextAfterSplash(languageChosen: boolean, done: boolean): '/idioma' | '/ubicacion' | '/mapa' {
  if (!languageChosen) return '/idioma'
  return done ? '/mapa' : '/ubicacion'
}

/** Enlace universal de Google Maps con destino (sin API ni clave). El origen lo pone el teléfono. */
export function googleMapsDirections([lon, lat]: LonLat): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat.toFixed(6)}%2C${lon.toFixed(6)}`
}

export interface SchemeLayout {
  /** Centro y radio del círculo del Centro Histórico, y la persona (en % del ancho y del alto). */
  center: { x: number; y: number }
  user: { x: number; y: number } | null
}

/**
 * Esquema de la pantalla 21 (no está a escala): el centro y la persona en la dirección real, separados una
 * distancia fija para que ambos quepan. Sin posición, el centro queda en el medio.
 */
export function schemeLayout(center: LonLat, user: LonLat | null): SchemeLayout {
  if (!user) return { center: { x: 50, y: 50 }, user: null }
  const east = (user[0] - center[0]) * Math.cos((center[1] * Math.PI) / 180)
  const north = user[1] - center[1]
  const length = Math.hypot(east, north)
  if (length === 0) return { center: { x: 50, y: 50 }, user: null }
  // Media separación en % del ancho (x) y del alto (y): el lienzo es más ancho que alto.
  const dx = (east / length) * 26
  const dy = (-north / length) * 26
  return {
    center: { x: 50 - dx, y: 50 - dy * 1.25 },
    user: { x: 50 + dx, y: 50 + dy * 1.25 },
  }
}
