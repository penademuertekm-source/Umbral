import type { Feature, FeatureCollection, MultiLineString, Point } from 'geojson'
import { LngLatBounds, Map as MapLibreMap, Marker, type GeoJSONSource } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './trabajador'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Marcador } from '../componentes'
import { useT } from '../i18n/useT'
import type { LonLat } from '../rutas/geometria'
import type { Route } from '../rutas/rutas'
import { addBaseLayers, baseStyle } from './capas'
import type { MapData, TreeProps } from './datos'
import { addMapImages } from './imagenes'
import s from './MapaSombra.module.css'
import { mapColors } from './tokens'

// Mapa de la pantalla 06: las dos rutas con los estilos de MuestraTramo (con sombra: verde continua; corta:
// ámbar con marca punteada), los árboles a lo largo de la ruta con sombra y los puntos de partida y destino.

interface MapaRutasProps {
  data: MapData
  shaded: Route | null
  shortest: Route | null
  /** Ruta resaltada (se dibuja encima). */
  selected: 'sombra' | 'corta'
  origin: LonLat
  destination: LonLat
  /** Árboles a lo largo de la ruta con sombra. */
  trees: FeatureCollection<Point, TreeProps>
  label: string
}

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] }
const ROUTE_WIDTH = ['interpolate', ['exponential', 2], ['zoom'], 14, 3, 16, 5, 18, 10] as const

function asLines(route: Route | null): FeatureCollection<MultiLineString> {
  if (!route) return EMPTY as FeatureCollection<MultiLineString>
  const feature: Feature<MultiLineString> = {
    type: 'Feature',
    properties: {},
    geometry: { type: 'MultiLineString', coordinates: route.pieces.map((p) => p.coords) },
  }
  return { type: 'FeatureCollection', features: [feature] }
}

export function MapaRutas({ data, shaded, shortest, selected, origin, destination, trees, label }: MapaRutasProps) {
  const { t } = useT()
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [ready, setReady] = useState(false)
  const [originElement] = useState(() => document.createElement('div'))
  const [destinationElement] = useState(() => document.createElement('div'))
  // Centro inicial: el mapa se crea una vez por juego de datos y luego se encuadra con las rutas.
  const initialCenter = useRef(origin)

  useEffect(() => {
    if (!container.current) return
    const colors = mapColors()
    const map = new MapLibreMap({
      container: container.current,
      style: baseStyle(colors),
      center: initialCenter.current,
      zoom: 16.5,
      minZoom: 14,
      maxZoom: 19.5,
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    })
    map.touchZoomRotate.disableRotation()
    map.keyboard.disableRotation()
    mapRef.current = map
    let alive = true
    map.on('load', async () => {
      await addMapImages(map, colors)
      if (!alive) return
      addBaseLayers(map, data, colors)
      map.addSource('ruta-corta', { type: 'geojson', data: EMPTY })
      map.addSource('ruta-sombra', { type: 'geojson', data: EMPTY })
      map.addSource('ruta-arboles', { type: 'geojson', data: EMPTY })
      const round = { 'line-join': 'round', 'line-cap': 'round' } as const
      map.addLayer({
        id: 'ruta-corta',
        type: 'line',
        source: 'ruta-corta',
        layout: round,
        paint: { 'line-color': colors.exposicion, 'line-width': ROUTE_WIDTH as never },
      })
      map.addLayer({
        id: 'ruta-corta-marca',
        type: 'line',
        source: 'ruta-corta',
        paint: {
          'line-color': colors.marcaExpuesto,
          'line-width': ['interpolate', ['exponential', 2], ['zoom'], 14, 0.6, 16, 1, 18, 2],
          'line-dasharray': [3, 3],
        },
      })
      map.addLayer({
        id: 'ruta-sombra',
        type: 'line',
        source: 'ruta-sombra',
        layout: round,
        paint: { 'line-color': colors.sombra, 'line-width': ROUTE_WIDTH as never },
      })
      map.addLayer({
        id: 'ruta-arboles',
        type: 'symbol',
        source: 'ruta-arboles',
        layout: {
          'icon-image': ['match', ['get', 'especie'], 'canaguate', 'arbol-canaguate', 'arbol-mango'],
          'icon-size': ['interpolate', ['linear'], ['zoom'], 15, 0.45, 18, 0.8],
          'icon-allow-overlap': false,
        },
      })
      setReady(true)
    })
    return () => {
      alive = false
      map.remove()
      mapRef.current = null
    }
  }, [data])

  useEffect(() => {
    mapRef.current?.getCanvas().setAttribute('aria-label', label)
  }, [label, ready])

  // Rutas, árboles y encuadre.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    ;(map.getSource('ruta-corta') as GeoJSONSource).setData(asLines(shortest))
    ;(map.getSource('ruta-sombra') as GeoJSONSource).setData(asLines(shaded))
    ;(map.getSource('ruta-arboles') as GeoJSONSource).setData(trees)
    // La ruta elegida va encima.
    if (selected === 'corta') {
      map.moveLayer('ruta-sombra', 'ruta-corta')
    } else {
      map.moveLayer('ruta-corta', 'ruta-sombra')
      map.moveLayer('ruta-corta-marca', 'ruta-sombra')
    }
    const bounds = new LngLatBounds(origin, origin)
    bounds.extend(destination)
    for (const route of [shaded, shortest]) route?.pieces.forEach((p) => p.coords.forEach((c) => bounds.extend(c)))
    map.fitBounds(bounds, { padding: 48, maxZoom: 18, duration: 0 })
  }, [ready, shaded, shortest, selected, trees, origin, destination])

  // Marcadores de partida y destino.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const markers = [
      new Marker({ element: originElement }).setLngLat(origin).addTo(map),
      new Marker({ element: destinationElement }).setLngLat(destination).addTo(map),
    ]
    return () => markers.forEach((m) => m.remove())
  }, [ready, origin, destination, originElement, destinationElement])

  return (
    <>
      <div ref={container} className={s.mapa} />
      {createPortal(<Marcador kind="usuario" label={t('origen.punto')} />, originElement)}
      {createPortal(<Marcador kind="destino" />, destinationElement)}
    </>
  )
}
