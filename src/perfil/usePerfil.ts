import { useSyncExternalStore } from 'react'
import { readProfile, subscribe, type ProfileData } from './almacen'

/** El perfil guardado en el teléfono; la pantalla se vuelve a dibujar cuando cambia. */
export function usePerfil(): ProfileData {
  return useSyncExternalStore(subscribe, () => readProfile())
}
