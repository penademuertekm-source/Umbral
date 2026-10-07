import { useSyncExternalStore } from 'react'

// ¿Hay conexión? navigator.onLine y los eventos online/offline (pantalla 14). Solo dice si el teléfono
// cree tener red; si una petición falla igual, cada parte de la app usa lo que tiene guardado.

function subscribe(callback: () => void) {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

export function useConexion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  )
}
