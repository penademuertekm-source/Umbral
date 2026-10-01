// Estilo propio del mapa: solo capas GeoJSON locales (CLAUDE.md: sin teselas externas).
import type { ExpressionSpecification, Map as MapLibreMap, StyleSpecification } from 'maplibre-gl'
import type { MapData } from './datos'
import type { MapColors } from './tokens'

/** Códigos de estado de cada tramo en `feature-state` (mismo orden que STATE_CODES del motor). */
export const STATE = { sombra: 0, parcial: 1, expuesto: 2, sin_sol: 3 } as const

/** Grosor de los tramos según el zoom (en px). */
const WIDTH: ExpressionSpecification = ['interpolate', ['exponential', 2], ['zoom'], 14, 1, 16, 2.5, 17, 4, 18, 7, 19, 11]
const MARK_WIDTH: ExpressionSpecification = ['interpolate', ['exponential', 2], ['zoom'], 14, 0.3, 16, 0.6, 17, 1, 18, 1.8, 19, 2.8]
const OUTLINE_GAP: ExpressionSpecification = ['interpolate', ['exponential', 2], ['zoom'], 14, 6, 16, 9, 17, 13, 18, 20, 19, 30]
/** Sin estado (todavía calculando) se dibuja como "sin sol": gris neutro. */
const STATE_OF_FEATURE: ExpressionSpecification = ['coalesce', ['feature-state', 'estado'], STATE.sin_sol]

function onlyState(code: number): ExpressionSpecification {
  return ['case', ['==', STATE_OF_FEATURE, code], 1, 0]
}

export function baseStyle(colors: MapColors): StyleSpecification {
  return {
    version: 8,
    sources: {},
    layers: [{ id: 'fondo', type: 'background', paint: { 'background-color': colors.fondo } }],
  }
}

export function addDataLayers(map: MapLibreMap, data: MapData, colors: MapColors): void {
  map.addSource('plazas', { type: 'geojson', data: data.plazas })
  map.addSource('manzanas', { type: 'geojson', data: data.manzanas })
  map.addSource('edificios', { type: 'geojson', data: data.edificios })
  map.addSource('calles', { type: 'geojson', data: data.red })
  map.addSource('aceras', { type: 'geojson', data: data.aceras, promoteId: 'id' })
  map.addSource('arboles', { type: 'geojson', data: data.arboles, cluster: true, clusterMaxZoom: 17, clusterRadius: 80 })

  map.addLayer({ id: 'plazas', type: 'fill', source: 'plazas', paint: { 'fill-color': colors.plaza } })
  map.addLayer({ id: 'manzanas', type: 'fill', source: 'manzanas', paint: { 'fill-color': colors.manzana } })
  map.addLayer({ id: 'edificios', type: 'fill', source: 'edificios', paint: { 'fill-color': colors.manzana } })
  map.addLayer({
    id: 'calles',
    type: 'line',
    source: 'calles',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': colors.via, 'line-width': ['interpolate', ['linear'], ['zoom'], 14, 0.5, 18, 2] },
  })

  // Tramos por lado de acera. Las capas no se recrean: al cambiar la hora solo cambia feature-state.
  const line = { type: 'line' as const, source: 'aceras', layout: { 'line-join': 'round' as const } }
  map.addLayer({
    ...line,
    id: 'tramos-sin-sol',
    paint: { 'line-color': colors.via, 'line-width': WIDTH, 'line-opacity': onlyState(STATE.sin_sol) },
  })
  map.addLayer({
    ...line,
    id: 'tramos-sombra',
    paint: { 'line-color': colors.sombra, 'line-width': WIDTH, 'line-opacity': onlyState(STATE.sombra) },
  })
  map.addLayer({
    ...line,
    id: 'tramos-parcial',
    // Discontinua 18/8 px a un grosor de 8 px; MapLibre mide los guiones en grosores de línea.
    paint: {
      'line-color': colors.parcial,
      'line-width': WIDTH,
      'line-dasharray': [2.25, 1],
      'line-opacity': onlyState(STATE.parcial),
    },
  })
  map.addLayer({
    ...line,
    id: 'tramos-expuesto',
    paint: { 'line-color': colors.exposicion, 'line-width': WIDTH, 'line-opacity': onlyState(STATE.expuesto) },
  })
  map.addLayer({
    ...line,
    id: 'tramos-expuesto-marca',
    // Marca central punteada 6/6 px sobre una línea de ~2 px.
    paint: {
      'line-color': colors.marcaExpuesto,
      'line-width': MARK_WIDTH,
      'line-dasharray': [3, 3],
      'line-opacity': onlyState(STATE.expuesto),
    },
  })
  map.addLayer({
    ...line,
    id: 'tramo-seleccionado',
    filter: ['==', ['get', 'arista'], -1],
    paint: { 'line-color': colors.texto, 'line-width': 2, 'line-gap-width': OUTLINE_GAP },
  })
  // Zona de toque invisible, más ancha que la línea (área táctil).
  map.addLayer({ ...line, id: 'tramos-toque', paint: { 'line-color': colors.texto, 'line-width': 28, 'line-opacity': 0 } })

  map.addLayer({
    id: 'arboles-grupo',
    type: 'symbol',
    source: 'arboles',
    filter: ['has', 'point_count'],
    layout: {
      'icon-image': ['concat', 'grupo-', ['to-string', ['get', 'point_count']]],
      'icon-size': ['interpolate', ['linear'], ['zoom'], 14, 0.55, 17, 0.75],
      'icon-allow-overlap': true,
    },
  })
  map.addLayer({
    id: 'arboles',
    type: 'symbol',
    source: 'arboles',
    filter: ['!', ['has', 'point_count']],
    layout: {
      'icon-image': ['match', ['get', 'especie'], 'canaguate', 'arbol-canaguate', 'arbol-mango'],
      'icon-size': ['interpolate', ['linear'], ['zoom'], 17, 0.55, 19, 0.9],
      'icon-allow-overlap': false,
      'icon-padding': 0,
    },
  })
}

export function selectEdge(map: MapLibreMap, edge: number | null): void {
  map.setFilter('tramo-seleccionado', ['==', ['get', 'arista'], edge ?? -1])
}
