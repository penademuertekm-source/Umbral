import type { CardId } from '../../config/logros'
import type { TreeCounts } from '../../mapa/tramos'
import { cardsFromRoute } from '../../perfil/colecciones'
import type { Graph } from '../../rutas/grafo'
import type { Route } from '../../rutas/rutas'
import { motorSombra } from '../../sombra/cliente'
import { CHANNEL_CODES } from '../../sombra/modelo'

/**
 * Cuadras con un alero registrado. Los aleros (datos/provisional/aleros.csv) solo los usa hoy el pipeline
 * de Python y la lista está vacía; cuando se publiquen por cuadra en public/datos, se leen aquí.
 */
const EAVES_EDGES: ReadonlySet<number> = new Set()

/** Láminas del Álbum que gana una ruta con la sombra de su hora de salida (S3, regla aproximada). */
export async function routeCards(
  route: Route,
  departure: Date,
  graph: Graph | null,
  trees: Map<number, TreeCounts> | null,
): Promise<CardId[]> {
  if (!graph || !trees) return []
  try {
    const shade = await motorSombra.calcular(departure)
    const pieces = route.pieces
      .filter((piece) => piece.kind === 'acera' && piece.segment >= 0)
      .map((piece) => {
        const index = graph.segments[piece.segment]?.shadeIndex ?? -1
        return {
          edge: piece.edge,
          fraction: piece.shade,
          channel: index >= 0 ? CHANNEL_CODES[shade.channel[index]] : ('ninguno' as const),
        }
      })
    return cardsFromRoute(pieces, trees, EAVES_EDGES, shade.deciduousActive)
  } catch {
    // Si el motor falla, la llegada se registra igual, sin láminas.
    return []
  }
}
