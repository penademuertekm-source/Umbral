import { lazy, Suspense } from 'react'

// Las pantallas de rutas cargan el grafo, el motor de sombra y (la 06) MapLibre: se descargan aparte.
const BuscarDestino = lazy(() => import('./BuscarDestino').then((m) => ({ default: m.BuscarDestino })))
const ComparacionRutas = lazy(() => import('./ComparacionRutas').then((m) => ({ default: m.ComparacionRutas })))
const CuandoSalir = lazy(() => import('./CuandoSalir').then((m) => ({ default: m.CuandoSalir })))
const SinRutaConSombra = lazy(() => import('./SinRutaConSombra').then((m) => ({ default: m.SinRutaConSombra })))

/** Pantalla 05. */
export function RutaBuscar() {
  return (
    <Suspense>
      <BuscarDestino />
    </Suspense>
  )
}

/** Pantalla 06. */
export function RutaComparacion() {
  return (
    <Suspense>
      <ComparacionRutas />
    </Suspense>
  )
}

/** Pantalla 15. */
export function RutaCuandoSalir() {
  return (
    <Suspense>
      <CuandoSalir />
    </Suspense>
  )
}

/** Pantalla 16. */
export function RutaSinSombra() {
  return (
    <Suspense>
      <SinRutaConSombra />
    </Suspense>
  )
}
