import { lazy, Suspense } from 'react'
import { Navigate, useParams } from 'react-router'

// MapLibre pesa: la pantalla del mapa se descarga aparte, solo cuando se abre.
const MapaPrincipal = lazy(() => import('./MapaPrincipal').then((m) => ({ default: m.MapaPrincipal })))

/** Pantalla 04. */
export function RutaMapa() {
  return (
    <Suspense>
      <MapaPrincipal />
    </Suspense>
  )
}

/** Pantalla 07: la ficha es una hoja sobre el mapa, así que /tramo/:id abre el mapa con ese tramo elegido. */
export function TramoEnMapa() {
  const { id = '' } = useParams()
  return <Navigate to={/^\d+$/.test(id) ? `/mapa?tramo=${id}` : '/mapa'} replace />
}
