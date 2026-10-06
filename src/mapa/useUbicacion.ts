import { useCallback, useEffect, useRef, useState } from 'react'

// Ubicación del usuario (CLAUDE.md, "Privacidad"): se usa solo en el dispositivo, no se guarda ni
// se envía. El GPS no distingue la acera, así que solo sirve para dibujar el marcador.

/** `insegura`: la página no es HTTPS (p. ej. `npm run dev -- --host` en el celular) y el navegador no da el GPS. */
export type EstadoUbicacion = 'inactiva' | 'buscando' | 'activa' | 'denegada' | 'no_disponible' | 'insegura'

export interface Ubicacion {
  /** [lon, lat] o null si no hay posición. */
  position: [number, number] | null
  /** Radio de error de la última posición (m). */
  accuracy: number | null
  status: EstadoUbicacion
  /** Pide el permiso (si hace falta) y empieza a seguir la posición. */
  start: () => void
}

export function useUbicacion(): Ubicacion {
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [status, setStatus] = useState<EstadoUbicacion>('inactiva')
  const watchId = useRef<number | null>(null)

  const start = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('no_disponible')
      return
    }
    if (!window.isSecureContext) {
      setStatus('insegura')
      return
    }
    if (watchId.current !== null) return
    setStatus('buscando')
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        setPosition([p.coords.longitude, p.coords.latitude])
        setAccuracy(p.coords.accuracy)
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

  return { position, accuracy, status, start }
}
