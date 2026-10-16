import { clampToQuarter, formatHora } from '../../useHoraElegida'
import { formatDesde } from '../../rutas/useOrigen'
import type { LonLat } from '../../../rutas/geometria'
import { minutesOfDay } from '../../../sombra/tiempo'

/**
 * Enlace a la ruta (06) de una salida: destino, punto de partida y la hora de salida redondeada al cuarto de
 * hora (la 06 trabaja por cuartos de hora, hoy, de 6 a. m. a 6 p. m.). Con `absolute`, la dirección completa
 * de la app publicada (para el calendario).
 */
export function routeLink(destinationId: string, departure: Date, origin: LonLat, absolute: boolean): string {
  const query = new URLSearchParams({
    destino: destinationId,
    hora: formatHora(clampToQuarter(minutesOfDay(departure))),
    desde: formatDesde(origin),
  })
  const path = `rutas?${query.toString()}`
  if (!absolute) return `/${path}`
  const base = import.meta.env.VITE_URL_PUBLICA ?? `${window.location.origin}${import.meta.env.BASE_URL}`
  return `${base.endsWith('/') ? base : `${base}/`}${path}`
}
