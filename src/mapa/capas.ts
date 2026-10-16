// Estilo propio del mapa: solo capas GeoJSON locales (CLAUDE.md: sin teselas externas).
import type { ExpressionSpecification, Map as MapLibreMap, StyleSpecification } from 'maplibre-gl'
import type { MapData } from './datos'
import type { MapColors } from './tokens'

/** Códigos de estado de cada tramo en `feature-state` (mismo orden que STATE_CODES del motor). */
export const STATE = { sombra: 0, parcial: 1, expuesto: 2, sin_sol: 3 } as const

/**
 * Grosor de los andenes (componente Tramo, nodo 43:55; 04-1): 4 px en el zoom con que abre el mapa, unos 2 px
 * al alejar y unos 6 px al acercar. Los guiones se miden en grosores de línea, así que escalan con él.
 */
const SIDEWALK_WIDTH: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], 14, 2, 16.5, 4, 19, 6]
/**
 * Separación extra entre los dos andenes de una calle al alejar (px hacia afuera de cada lado). En los datos,
 * el lado "a" queda siempre a la izquierda del sentido de su línea y el "b" a la derecha (a unos 8 m), y
 * MapLibre desplaza a la derecha con valores positivos. Desde el zoom 18 ya no hace falta.
 */
const sideOffset = (px: number): ExpressionSpecification => ['match', ['get', 'lado'], 'a', -px, px]
const SIDE_OFFSET: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['zoom'],
  14,
  sideOffset(1.5),
  16,
  sideOffset(1),
  17,
  sideOffset(0.5),
  18,
  0,
]
/** Grosor de las isócronas según el zoom (en px). */
const WIDTH: ExpressionSpecification = ['interpolate', ['exponential', 2], ['zoom'], 14, 1, 16, 2.5, 17, 4, 18, 7, 19, 11]
// La banda de 5 min de las isócronas va más gruesa: MapLibre exige que el zoom quede en la interpolación de
// primer nivel, así que se escalan las paradas en vez de multiplicar la expresión.
const WIDE_WIDTH: ExpressionSpecification = ['interpolate', ['exponential', 2], ['zoom'], 14, 1.6, 16, 4, 17, 6.4, 18, 11.2, 19, 17.6]
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

/** Fondo de la ciudad: plazas, manzanas, edificios y ejes de calle (lo comparten el mapa de sombra y el de rutas). */
export function addBaseLayers(map: MapLibreMap, data: MapData, colors: MapColors): void {
  map.addSource('plazas', { type: 'geojson', data: data.plazas })
  map.addSource('manzanas', { type: 'geojson', data: data.manzanas })
  map.addSource('edificios', { type: 'geojson', data: data.edificios })
  map.addSource('calles', { type: 'geojson', data: data.red })
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
}

export function addDataLayers(map: MapLibreMap, data: MapData, colors: MapColors): void {
  addBaseLayers(map, data, colors)
  map.addSource('aceras', { type: 'geojson', data: data.aceras, promoteId: 'id' })
  map.addSource('arboles', { type: 'geojson', data: data.arboles, cluster: true, clusterMaxZoom: 17, clusterRadius: 80 })
  map.addSource('isocronas', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })

  // Tramos por lado de acera. Las capas no se recrean: al cambiar la hora solo cambia feature-state.
  // Cada estado tiene su trazo (04-1), para que se distingan sin color: sombra continua, parcial a rayas y al
  // sol a puntos. Las medidas en px son las del grosor de 4 px.
  const line = { type: 'line' as const, source: 'aceras', layout: { 'line-join': 'round' as const } }
  const sidewalk = { 'line-width': SIDEWALK_WIDTH, 'line-offset': SIDE_OFFSET }
  map.addLayer({
    ...line,
    id: 'tramos-sin-sol',
    paint: { ...sidewalk, 'line-color': colors.via, 'line-opacity': onlyState(STATE.sin_sol) },
  })
  map.addLayer({
    ...line,
    id: 'tramos-sombra',
    layout: { ...line.layout, 'line-cap': 'round' },
    paint: { ...sidewalk, 'line-color': colors.sombra, 'line-opacity': onlyState(STATE.sombra) },
  })
  map.addLayer({
    ...line,
    id: 'tramos-parcial',
    // Rayas de 10 px con huecos de 5 px y punta recta.
    layout: { ...line.layout, 'line-cap': 'butt' },
    paint: {
      ...sidewalk,
      'line-color': colors.parcial,
      'line-dasharray': [2.5, 1.25],
      'line-opacity': onlyState(STATE.parcial),
    },
  })
  map.addLayer({
    ...line,
    id: 'tramos-expuesto',
    // Puntos redondos cada 7 px: raya de 0,1 px con punta redonda (el punto mide lo que el grosor).
    layout: { ...line.layout, 'line-cap': 'round' },
    paint: {
      ...sidewalk,
      'line-color': colors.exposicion,
      'line-dasharray': [0.025, 1.725],
      'line-opacity': onlyState(STATE.expuesto),
    },
  })
  // Isócronas (Fase 6): bandas de 5, 10 y 15 min en un solo color; se distinguen también por grosor y trazo.
  const band = (n: number): ExpressionSpecification => ['==', ['get', 'band'], n]
  map.addLayer({
    id: 'isocronas-3',
    type: 'line',
    source: 'isocronas',
    filter: band(3),
    layout: { 'line-join': 'round', visibility: 'none' },
    paint: { 'line-color': colors.usuario, 'line-width': WIDTH, 'line-opacity': 0.45, 'line-dasharray': [1.5, 1] },
  })
  map.addLayer({
    id: 'isocronas-2',
    type: 'line',
    source: 'isocronas',
    filter: band(2),
    layout: { 'line-join': 'round', 'line-cap': 'round', visibility: 'none' },
    paint: { 'line-color': colors.usuario, 'line-width': WIDTH, 'line-opacity': 0.7 },
  })
  map.addLayer({
    id: 'isocronas-1',
    type: 'line',
    source: 'isocronas',
    filter: band(1),
    layout: { 'line-join': 'round', 'line-cap': 'round', visibility: 'none' },
    paint: { 'line-color': colors.usuario, 'line-width': WIDE_WIDTH, 'line-opacity': 1 },
  })

  // Pantalla 20: con el cielo cubierto los tramos van en gris (se muestra en lugar de las capas de estado).
  map.addLayer({
    ...line,
    id: 'tramos-nublado',
    layout: { ...line.layout, visibility: 'none' },
    paint: { ...sidewalk, 'line-color': colors.nublado },
  })
  map.addLayer({
    ...line,
    id: 'tramo-seleccionado',
    filter: ['==', ['get', 'arista'], -1],
    paint: { 'line-color': colors.texto, 'line-width': 2, 'line-gap-width': OUTLINE_GAP, 'line-offset': SIDE_OFFSET },
  })
  // Zona de toque invisible, más ancha que la línea (área táctil).
  map.addLayer({
    ...line,
    id: 'tramos-toque',
    paint: { 'line-color': colors.texto, 'line-width': 28, 'line-offset': SIDE_OFFSET, 'line-opacity': 0 },
  })

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

/** Capas que solo tienen sentido con sol: el estado de cada tramo y los árboles. */
const SUNNY_LAYERS = [
  'tramos-sin-sol',
  'tramos-sombra',
  'tramos-parcial',
  'tramos-expuesto',
  'arboles-grupo',
  'arboles',
]

export type MapMode = 'sombra' | 'nublado' | 'isocronas'

const ISOCHRONE_LAYERS = ['isocronas-1', 'isocronas-2', 'isocronas-3']

/**
 * Qué se ve sobre las calles: la sombra de cada tramo, el estado nublado (pantalla 20: tramos en gris y
 * sin árboles) o las isócronas (sin tramos ni árboles, para que las bandas se lean claras).
 */
export function setMapMode(map: MapLibreMap, mode: MapMode): void {
  const show = (ids: string[], visible: boolean) =>
    ids.forEach((id) => map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none'))
  show(SUNNY_LAYERS, mode === 'sombra')
  show(['tramos-nublado'], mode === 'nublado')
  show(ISOCHRONE_LAYERS, mode === 'isocronas')
}

export function selectEdge(map: MapLibreMap, edge: number | null): void {
  map.setFilter('tramo-seleccionado', ['==', ['get', 'arista'], edge ?? -1])
}
