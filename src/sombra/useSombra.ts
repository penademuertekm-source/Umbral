import { useEffect, useState } from 'react'
import { motorSombra, type ResultadoSombra } from './cliente'
import type { Season } from './modelo'
import { floorToQuarter } from './tiempo'

export type EstadoSombra =
  | { status: 'cargando'; resultado?: ResultadoSombra }
  | { status: 'listo'; resultado: ResultadoSombra }
  | { status: 'error'; error: string; resultado?: ResultadoSombra }

/**
 * Sombra de todo el centro a la hora dada (redondeada al cuarto de hora).
 * Mientras calcula una hora nueva, conserva el resultado anterior para que la pantalla no parpadee.
 */
export function useSombra(fechaHora: Date, temporada: Season = 'automatica'): EstadoSombra {
  const quarter = floorToQuarter(fechaHora).getTime()
  const [estado, setEstado] = useState<EstadoSombra>({ status: 'cargando' })

  useEffect(() => {
    let vigente = true
    motorSombra
      .calcular(new Date(quarter), { season: temporada })
      .then((resultado) => {
        if (vigente) setEstado({ status: 'listo', resultado })
      })
      .catch((error: unknown) => {
        if (vigente) {
          setEstado((anterior) => ({
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
            resultado: anterior.resultado,
          }))
        }
      })
    return () => {
      vigente = false
    }
  }, [quarter, temporada])

  return estado
}
