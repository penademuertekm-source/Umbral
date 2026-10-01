import { useCallback } from 'react'
import { useNavigate } from 'react-router'

/**
 * "‹ Volver": regresa a la pantalla anterior. Si se entró directo a esta pantalla
 * (enlace, QR, recarga), no hay historial dentro de la app y se va al mapa.
 */
export function useVolver(fallback = '/mapa'): () => void {
  const navigate = useNavigate()
  return useCallback(() => {
    const index = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (index > 0) navigate(-1)
    else navigate(fallback, { replace: true })
  }, [navigate, fallback])
}
