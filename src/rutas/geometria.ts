// Geometría plana a escala de barrio (proyección equirectangular local). Código puro.

export type LonLat = [number, number]
export type XY = [number, number]

export interface Projection {
  toXY(point: LonLat): XY
  toLonLat(point: XY): LonLat
}

export function projection(lat0: number, lon0: number): Projection {
  const mx = 111_320 * Math.cos((lat0 * Math.PI) / 180)
  const my = 110_574
  return {
    toXY: ([lon, lat]) => [(lon - lon0) * mx, (lat - lat0) * my],
    toLonLat: ([x, y]) => [lon0 + x / mx, lat0 + y / my],
  }
}

export function distance(a: XY, b: XY): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

/** Distancia acumulada desde el inicio de una polilínea. */
export function cumulative(xy: XY[]): number[] {
  const cum = [0]
  for (let i = 1; i < xy.length; i++) cum.push(cum[i - 1] + distance(xy[i - 1], xy[i]))
  return cum
}

function lerp(a: XY, b: XY, t: number): XY {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
}

/** Punto a `along` metros del inicio. */
export function pointAlong(xy: XY[], cum: number[], along: number): XY {
  const total = cum[cum.length - 1]
  const d = Math.max(0, Math.min(total, along))
  let i = 1
  while (i < cum.length - 1 && cum[i] < d) i++
  const span = cum[i] - cum[i - 1]
  return lerp(xy[i - 1], xy[i], span === 0 ? 0 : (d - cum[i - 1]) / span)
}

/** Tramo de polilínea entre `from` y `to` metros (si from > to, va en sentido contrario). */
export function slice(xy: XY[], cum: number[], from: number, to: number): XY[] {
  const forward = from <= to
  const a = Math.min(from, to)
  const b = Math.max(from, to)
  const out: XY[] = [pointAlong(xy, cum, a)]
  for (let i = 0; i < xy.length; i++) if (cum[i] > a && cum[i] < b) out.push(xy[i])
  out.push(pointAlong(xy, cum, b))
  return forward ? out : out.reverse()
}

/** Proyección de un punto sobre una polilínea: distancia desde el inicio y distancia al punto. */
export function project(point: XY, xy: XY[], cum: number[]): { along: number; distance: number } {
  let best = { along: 0, distance: Infinity }
  for (let i = 1; i < xy.length; i++) {
    const [ax, ay] = xy[i - 1]
    const [bx, by] = xy[i]
    const dx = bx - ax
    const dy = by - ay
    const len2 = dx * dx + dy * dy
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((point[0] - ax) * dx + (point[1] - ay) * dy) / len2))
    const d = Math.hypot(point[0] - (ax + t * dx), point[1] - (ay + t * dy))
    if (d < best.distance) best = { along: cum[i - 1] + t * (cum[i] - cum[i - 1]), distance: d }
  }
  return best
}
