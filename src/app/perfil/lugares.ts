import type { IconName } from '../../componentes'
import type { Destination } from '../../mapa/datos'

/** Ícono de un destino según su tipo (destinos.csv), como en Figma 143:2425; si no hay uno propio, el pin. */
export function destinationIcon(destino: Destination | undefined): IconName {
  switch (destino?.tipo) {
    case 'plaza':
      return 'plaza'
    case 'iglesia':
      return 'iglesia'
    case 'mercado':
      return 'mercado'
    default:
      return 'lugar'
  }
}
