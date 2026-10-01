import { useCallback, useEffect, useRef, useState } from 'react'

// Ubicación del usuario (CLAUDE.md, "Privacidad"): se usa solo en el dispositivo, no se guarda ni
// se envía. El GPS no distingue la acera, así que solo sirve para dibujar el marcador.

export type EstadoUbicacion = 'inactiva' | 'buscando' | 'activa' | 'denegada' | 'no_disponible'

export interface Ubicacion {
  /** [lon, lat] o null si no hay posición. */
  position: [number, number] | null
  status: EstadoUbicacion
  /** Pide el permiso (si hace falta) y empieza a seguir la posición. */
  start: () => void
}

export function useUbicacion(): Ubicacion {
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [status, setStatus] = useState<EstadoUbicacion>('inactiva')
  const watchId = useRef<number | null>(null)

  const start = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('no_disponible')
      return
    }
    if (watchId.current !== null) return
    setStatus('buscando')
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        setPosition([p.coords.longitude, p.coords.latitude])
        setStatus('activa')
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
          watchId.current = null
          setPosition(null)
          setStatus('denegada')
        } else {
          // Sin señal o tiempo agotado: se sigue intentando, pero se avisa.
          setStatus((previous) => (previous === 'activa' ? previous : 'no_disponible'))
        }
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
    )
  }, [])

  useEffect(() => {
    // Si el permiso ya estaba concedido (pantalla 03 o una visita anterior), arranca sin preguntar.
    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((permission) => {
        if (permission.state === 'granted') start()
      })
      .catch(() => undefined)
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
  }, [start])

  return { position, status, start }
}
