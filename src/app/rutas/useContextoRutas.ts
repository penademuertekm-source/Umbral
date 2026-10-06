import { useEffect, useMemo, useState } from 'react'
import { readHeatProfile } from '../../clima/configClima'
import { thermalStateAt, type ThermalContext, type ThermalState } from '../../clima/estado'
import type { Forecast } from '../../clima/openMeteo'
import { useClima, useClimaConfig } from '../../clima/useClima'
import { routeLevel, type HeatLevel, type HeatProfile } from '../../config/reglas-semaforo'
import { ROUTE_PROFILES } from '../../config/rutas'
import { loadMapData, type MapData } from '../../mapa/datos'
import { treesByEdge, type TreeCounts } from '../../mapa/tramos'
import type { LonLat } from '../../rutas/geometria'
import { buildGraph, snap, type Graph } from '../../rutas/grafo'
import { findRoute, type CostModel, type Route, type RouteMode } from '../../rutas/rutas'
import { motorSombra } from '../../sombra/cliente'
import { useSombra } from '../../sombra/useSombra'
import { useHoraElegida } from '../useHoraElegida'
import { useOrigen } from './useOrigen'

// Todo lo que necesitan las pantallas de rutas (05, 06, 15 y 16): datos, grafo, sombra y clima de la
// hora elegida, perfil de calor y punto de partida.

let graphCache: { data: MapData; graph: Promise<Graph> } | null = null

/** El grafo se arma una sola vez por juego de datos (≈ 20 ms con el centro completo). */
export function loadGraph(data: MapData): Promise<Graph> {
  if (graphCache?.data !== data) {
    graphCache = { data, graph: motorSombra.lados().then((sides) => buildGraph(data.red, data.aceras, sides)) }
  }
  return graphCache.graph
}

export function useMapData() {
  const [data, setData] = useState<MapData | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let vigente = true
    loadMapData()
      .then((loaded) => vigente && setData(loaded))
      .catch((e: unknown) => vigente && setError(e instanceof Error ? e.message : String(e)))
    return () => {
      vigente = false
    }
  }, [])
  return { data, error }
}

export function useGraph(data: MapData | null): Graph | null {
  const [graph, setGraph] = useState<{ data: MapData; graph: Graph } | null>(null)
  useEffect(() => {
    if (!data) return
    let vigente = true
    loadGraph(data).then((g) => vigente && setGraph({ data, graph: g }))
    return () => {
      vigente = false
    }
  }, [data])
  return graph && graph.data === data ? graph.graph : null
}

/** Costo de una ruta con la sombra de un cálculo del motor (fracción por lado de acera). */
export function costModel(graph: Graph, fraction: Float32Array, mode: RouteMode, profile: HeatProfile): CostModel {
  return {
    mode,
    profile: ROUTE_PROFILES[profile],
    shade: (s) => {
      const i = graph.segments[s].shadeIndex
      return i < 0 ? 0 : fraction[i]
    },
  }
}

export function routeBetween(
  graph: Graph,
  from: LonLat,
  to: LonLat,
  fraction: Float32Array,
  mode: RouteMode,
  profile: HeatProfile,
): Route | null {
  const a = snap(graph, from)
  const b = snap(graph, to)
  return a && b ? findRoute(graph, a, b, costModel(graph, fraction, mode, profile)) : null
}

/** Nivel del semáforo para una ruta a una hora (null si no hay clima). */
export function levelOfRoute(route: Route, thermal: ThermalState | null, context: ThermalContext): HeatLevel | null {
  if (!thermal?.utci) return null
  return routeLevel({
    utciSun: thermal.utci.sun,
    utciShade: thermal.utci.shade,
    cloudCover: thermal.weather?.cloudCover ?? null,
    elNino: context.elNino,
    profile: context.profile,
    minutesInSun: route.sunMinutes,
  }).heatLevel
}

/** Suma los árboles de las calles que recorre la ruta. */
export function treesOnRoute(route: Route, trees: Map<number, TreeCounts>): TreeCounts {
  const total: TreeCounts = { mango: 0, canaguate: 0, otro: 0 }
  for (const edge of route.edges) {
    const counts = trees.get(edge)
    if (!counts) continue
    total.mango += counts.mango
    total.canaguate += counts.canaguate
    total.otro += counts.otro
  }
  return total
}

export function useContextoRutas() {
  const hora = useHoraElegida()
  const { data, error } = useMapData()
  const graph = useGraph(data)
  const sombra = useSombra(hora.time)
  const clima = useClima(data?.meta.area.centro ?? null)
  const climaConfig = useClimaConfig()
  const [profile] = useState(readHeatProfile)
  const origen = useOrigen(data?.meta ?? null)
  const trees = useMemo(() => (data ? treesByEdge(data.red, data.arboles) : null), [data])
  const forecast: Forecast | null = clima.status === 'listo' ? clima.forecast : null
  const context: ThermalContext | null = data
    ? { center: data.meta.area.centro, elNino: climaConfig?.elNino ?? false, profile }
    : null
  const thermalAt = (date: Date) => (context ? thermalStateAt(forecast, date, context) : null)
  return {
    hora,
    data,
    error,
    graph,
    sombra,
    resultado: sombra.resultado,
    clima,
    forecast,
    climaConfig,
    profile,
    context,
    thermalAt,
    trees,
    ...origen,
  }
}
