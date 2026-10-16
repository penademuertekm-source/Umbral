import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isChunkError, reloadOnce } from './recargaVersion'

describe('versión vieja de la app', () => {
  const reload = vi.fn()
  beforeEach(() => {
    sessionStorage.clear()
    reload.mockClear()
    vi.stubGlobal('location', { ...window.location, reload })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('reconoce los errores de archivos de código que ya no están', () => {
    expect(
      isChunkError(new TypeError('Failed to fetch dynamically imported module: https://x/prueba/assets/BuscarDestino-C_C_aj2M.js')),
    ).toBe(true)
    expect(isChunkError(new TypeError('Importing a module script failed.'))).toBe(true)
    expect(isChunkError(new TypeError('error loading dynamically imported module'))).toBe(true)
    expect(isChunkError(new Error('otra cosa'))).toBe(false)
    expect(isChunkError(null)).toBe(false)
  })

  it('recarga una sola vez seguida', () => {
    expect(reloadOnce(1_000_000)).toBe(true)
    expect(reloadOnce(1_005_000)).toBe(false)
    expect(reload).toHaveBeenCalledTimes(1)
    expect(reloadOnce(1_100_000)).toBe(true)
    expect(reload).toHaveBeenCalledTimes(2)
  })
})
