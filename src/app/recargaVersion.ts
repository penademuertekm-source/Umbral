// Después de publicar una versión nueva, una pantalla que siguió abierta con la versión anterior puede pedir
// un archivo de código que ya no existe ("Failed to fetch dynamically imported module"). Pasa sobre todo
// cuando el service worker se actualiza mientras la app está abierta. La salida es recargar: así se abre la
// versión nueva. Se recarga sola una vez; si vuelve a fallar enseguida, se muestra ErrorPantalla.

const KEY = 'umbral.recargaVersion'
/** Si ya se recargó hace menos de esto, no se vuelve a intentar sola (evita un ciclo). */
const MIN_INTERVAL_MS = 15_000

const CHUNK_ERROR = /dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS/i

/** ¿El error es de un archivo de código de otra versión que ya no está? */
export function isChunkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : ''
  return CHUNK_ERROR.test(message)
}

/** Recarga la página una vez. Devuelve false si ya se intentó hace poco. */
export function reloadOnce(now = Date.now()): boolean {
  let last = 0
  try {
    last = Number(sessionStorage.getItem(KEY)) || 0
    if (now - last < MIN_INTERVAL_MS) return false
    sessionStorage.setItem(KEY, String(now))
  } catch {
    // Sin almacenamiento no se puede evitar el ciclo: mejor no recargar sola.
    return false
  }
  window.location.reload()
  return true
}

/** Vite avisa con "vite:preloadError" cuando no puede cargar un archivo de código. */
export function installVersionReload(): void {
  window.addEventListener('vite:preloadError', (event) => {
    if (reloadOnce()) event.preventDefault()
  })
}
