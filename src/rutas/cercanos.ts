// Puntos cerca de una ruta (refugios, árboles). Código puro.
import { project, type LonLat, type Projection } from './geometria'
import type { Route } from './rutas'

/** Distancia (m) de un punto a la ruta. */
export function distanceToRoute(route: Route, point: LonLat, proj: Projection): number {
  const xy = proj.toXY(point)
  let best = Infinity
  for (const piece of route.pieces) {
    if (piece.coords.length < 2) continue
    const line = piece.coords.map((c) => proj.toXY(c))
    const cum = [0]
    for (let i = 1; i < line.length; i++) cum.push(cum[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]))
    best = Math.min(best, project(xy, line, cum).distance)
  }
  return best
}

/** Los elementos cuyo punto queda a menos de `maxMeters` de la ruta. */
export function nearRoute<T>(route: Route, items: T[], pointOf: (item: T) => LonLat | null, maxMeters: number, proj: Projection): T[] {
  return items.filter((item) => {
    const point = pointOf(item)
    return point !== null && distanceToRoute(route, point, proj) <= maxMeters
  })
}
