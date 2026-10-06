import { useEffect, useState } from 'react'
import type { Refuge } from '../../mapa/datos'
import type { LonLat } from '../../rutas/geometria'
import { snap, type Graph } from '../../rutas/grafo'
import { motorSombra, type ResultadoSombra } from '../../sombra/cliente'

// "Sombra hasta las 2:40 p. m." de un lugar (pantallas 10 y 22). Se estima con la acera más cercana al
// lugar, que es lo que modela el motor de sombra; un lugar cubierto tiene sombra todo el día.

export type SombraLugar =
  | { kind: 'cubierto' }
  | { kind: 'hasta'; until: Date; sunset: boolean }
  | { kind: 'parcial' | 'expuesto' | 'sin_sol' }

export function refugePoint(refuge: Refuge): LonLat | null {
  return refuge.lat !== null && refuge.lon !== null ? [refuge.lon, refuge.lat] : null
}

/** Sombra de cada refugio a la hora del cálculo. null mientras se calcula. */
export function useSombraLugares(
  refugios: readonly Refuge[],
  graph: Graph | null,
  resultado: ResultadoSombra | undefined,
): Map<string, SombraLugar> | null {
  const [state, setState] = useState<{ key: string; map: Map<string, SombraLugar> } | null>(null)
  const key = graph && resultado ? `${resultado.time}|${refugios.map((r) => r.id).join(',')}` : ''

  useEffect(() => {
    if (!key || !graph || !resultado) return
    let vigente = true
    const time = new Date(resultado.time)
    Promise.all(
      refugios.map(async (refuge): Promise<[string, SombraLugar] | null> => {
        if (refuge.cubierto === 'si') return [refuge.id, { kind: 'cubierto' }]
        const point = refugePoint(refuge)
        const hit = point ? snap(graph, point) : null
        if (!hit) return null
        const segment = graph.segments[hit.segment]
        const shade = resultado.lado(segment.edge, segment.side)
        if (!shade) return null
        if (shade.state !== 'sombra') return [refuge.id, { kind: shade.state }]
        const until = await motorSombra.sombraHasta(segment.edge, segment.side, time)
        return [refuge.id, until ? { kind: 'hasta', until: new Date(until.until), sunset: until.untilSunset } : { kind: 'parcial' }]
      }),
    ).then((entries) => {
      if (vigente) setState({ key, map: new Map(entries.filter((e): e is [string, SombraLugar] => e !== null)) })
    })
    return () => {
      vigente = false
    }
    // `key` resume el cálculo de sombra y la lista de refugios.
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  return state?.key === key ? state.map : null
}
