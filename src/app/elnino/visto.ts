import { isoLocalDate } from '../../sombra/tiempo'

// El aviso de El Niño (pantalla 09) se muestra una vez por día: se guarda la fecha en que se cerró.
const SEEN_KEY = 'umbral.elNinoVisto'

export function seenElNinoToday(now = new Date()): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === isoLocalDate(now)
  } catch {
    return false
  }
}

export function markElNinoSeen(now = new Date()): void {
  try {
    localStorage.setItem(SEEN_KEY, isoLocalDate(now))
  } catch {
    // Almacenamiento bloqueado: el aviso volverá a salir, que es lo más prudente.
  }
}
