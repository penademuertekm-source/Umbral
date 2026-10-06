import { lazy, Suspense } from 'react'

// El recorrido, la llegada y los refugios cargan el grafo, el motor de sombra y MapLibre: se descargan aparte.
const RutaEnCurso = lazy(() => import('./RutaEnCurso').then((m) => ({ default: m.RutaEnCurso })))
const Llegada = lazy(() => import('./Llegada').then((m) => ({ default: m.Llegada })))
const Refugios = lazy(() => import('./Refugios').then((m) => ({ default: m.Refugios })))

/** Pantalla 13. */
export function RutaRecorrido() {
  return (
    <Suspense>
      <RutaEnCurso />
    </Suspense>
  )
}

/** Pantalla 22. */
export function RutaLlegada() {
  return (
    <Suspense>
      <Llegada />
    </Suspense>
  )
}

/** Pantalla 10. */
export function RutaRefugios() {
  return (
    <Suspense>
      <Refugios />
    </Suspense>
  )
}
