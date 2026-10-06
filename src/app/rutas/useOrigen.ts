import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { insideArea, type Meta } from '../../mapa/datos'
import { useUbicacion } from '../../mapa/useUbicacion'
import type { LonLat } from '../../rutas/geometria'

// Punto de partida de las rutas: el que se eligió en el mapa (?desde=lat,lon) o, si no hay, la ubicación
// del teléfono cuando está dentro del área de estudio. La ubicación no se guarda ni se envía.

export function parseDesde(value: string | null): LonLat | null {
  const match = value ? /^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(value) : null
  return match ? [Number(match[2]), Number(match[1])] : null
}

export function formatDesde([lon, lat]: LonLat): string {
  return `${lat.toFixed(5)},${lon.toFixed(5)}`
}

export interface Origen {
  point: LonLat
  kind: 'gps' | 'punto'
}

export function useOrigen(meta: Meta | null) {
  const [params] = useSearchParams()
  const ubicacion = useUbicacion()
  const desde = parseDesde(params.get('desde'))
  const gps = ubicacion.position
  const gpsInside = !!gps && !!meta && insideArea(meta, gps)
  // Objeto estable mientras no cambie el punto, para no recalcular rutas en cada render.
  const key = desde ? `punto:${desde.join(',')}` : gps && gpsInside ? `gps:${gps.join(',')}` : ''
  const origen = useMemo((): Origen | null => {
    const [kind, coords] = key.split(':')
    if (!coords) return null
    const [lon, lat] = coords.split(',').map(Number)
    return { point: [lon, lat], kind: kind === 'gps' ? 'gps' : 'punto' }
  }, [key])
  return { origen, ubicacion, gpsOutside: !!gps && !!meta && !gpsInside }
}
