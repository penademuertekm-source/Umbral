import { describe, expect, it } from 'vitest'
import { googleMapsDirections, nextAfterSplash, schemeLayout } from './entrada'

describe('entrada (pantallas 01, 02, 03 y 21)', () => {
  it('primer uso: idioma y ubicación; después, directo al mapa', () => {
    expect(nextAfterSplash(false, false)).toBe('/idioma')
    expect(nextAfterSplash(true, false)).toBe('/ubicacion')
    expect(nextAfterSplash(true, true)).toBe('/mapa')
    // Si alguien borró el idioma pero ya había entrado, se le vuelve a preguntar solo el idioma.
    expect(nextAfterSplash(false, true)).toBe('/idioma')
  })

  it('arma el enlace universal de Google Maps hacia la plaza, sin clave', () => {
    expect(googleMapsDirections([-73.244632, 10.477751])).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=10.477751%2C-73.244632',
    )
  })

  it('pone a la persona en la dirección real respecto del centro', () => {
    const plaza: [number, number] = [-73.2446, 10.4778]
    // Al suroccidente: la persona abajo a la izquierda y el centro arriba a la derecha (como en Figma).
    const sw = schemeLayout(plaza, [-73.26, 10.46])
    expect(sw.user!.x).toBeLessThan(50)
    expect(sw.user!.y).toBeGreaterThan(50)
    expect(sw.center.x).toBeGreaterThan(50)
    expect(sw.center.y).toBeLessThan(50)
    // Al norte: arriba, en la misma vertical.
    const n = schemeLayout(plaza, [-73.2446, 10.5])
    expect(n.user!.x).toBeCloseTo(50, 6)
    expect(n.user!.y).toBeLessThan(n.center.y)
    expect(schemeLayout(plaza, null).user).toBeNull()
  })
})
