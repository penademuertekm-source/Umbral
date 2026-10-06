import { useEffect, useState } from 'react'
import { DEPARTURES } from '../../config/rutas'
import type { LonLat } from '../../rutas/geometria'
import { findRoute } from '../../rutas/rutas'
import { snap } from '../../rutas/grafo'
import { bestWindows, suggestedWindow, type Departure } from '../../rutas/salidas'
import { motorSombra } from '../../sombra/cliente'
import { costModel, levelOfRoute, type useContextoRutas } from './useContextoRutas'

// Rutas con sombra para cada hora de salida de 6:00 a 18:00 (cada 15 min): pantallas 15 y 16.

type Contexto = ReturnType<typeof useContextoRutas>

export function useSalidas(ctx: Contexto, destination: LonLat | null) {
  const { graph, origen, profile, context, hora } = ctx
  const [result, setResult] = useState<{ key: string; departures: Departure[] } | null>(null)
  const key =
    graph && origen && destination && context
      ? `${origen.point.join(',')}|${destination.join(',')}|${profile}|${context.elNino}|${ctx.forecast?.fetchedAt ?? 0}|${hora.at(0).getTime()}`
      : ''
  const thermalAt = ctx.thermalAt

  useEffect(() => {
    if (!key || !graph || !origen || !destination || !context) return
    let vigente = true
    const from = snap(graph, origen.point)
    const to = snap(graph, destination)
    if (!from || !to) return
    ;(async () => {
      const departures: Departure[] = []
      for (let m = DEPARTURES.startHour * 60; m <= DEPARTURES.endHour * 60; m += DEPARTURES.stepMin) {
        const time = hora.at(m)
        const shade = await motorSombra.calcular(time)
        if (!vigente) return
        const route = findRoute(graph, from, to, costModel(graph, shade.fraction, 'sombra', profile))
        if (route) departures.push({ minute: m, route, level: levelOfRoute(route, thermalAt(time), context) })
      }
      if (vigente) setResult({ key, departures })
    })()
    return () => {
      vigente = false
    }
    // `key` resume todas las entradas; las funciones y objetos cambian de identidad en cada render.
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  const departures = result?.key === key ? result.departures : null
  const windows = departures ? bestWindows(departures) : null
  const nowMinute = Math.floor((hora.now.getTime() - hora.at(0).getTime()) / 60_000)
  return {
    departures,
    windows,
    suggested: windows ? suggestedWindow(windows, nowMinute) : undefined,
    nowMinute,
  }
}
