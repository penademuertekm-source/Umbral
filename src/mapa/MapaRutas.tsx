import type { Feature, FeatureCollection, MultiLineString, Point } from 'geojson'
import { LngLatBounds, Map as MapLibreMap, Marker, type GeoJSONSource } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './trabajador'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Marcador, type MarkerKind } from '../componentes'
import { useT } from '../i18n/useT'
import type { LonLat } from '../rutas/geometria'
import type { Route } from '../rutas/rutas'
import { addBaseLayers, baseStyle } from './capas'
import type { MapData, TreeProps } from './datos'
import { addMapImages } from './imagenes'
import s from './MapaSombra.module.css'
import { mapColors } from './tokens'

// Mapa de las pantallas de rutas (06, 13 y 10): las rutas con los estilos de MuestraTramo (con sombra: verde
// continua; corta: ámbar con marca punteada), los árboles de la ruta con sombra, los puntos de partida y
// destino, la persona en movimiento (13) y lugares sueltos como los refugios (10).

export interface MapPlace {
  id: string
  point: LonLat
  kind: MarkerKind
  label: string
}

interface MapaRutasProps {
  data: MapData
  shaded?: Route | null
  shortest?: Route | null
  /** Ruta resaltada (se dibuja encima). */
  selected?: 'sombra' | 'corta'
  /** Punto de partida (marcador "Punto de partida"). */
  origin?: LonLat | null
  destination?: LonLat | null
  /** Árboles a lo largo de la ruta con sombra. */
  trees?: FeatureCollection<Point, TreeProps>
  /** Posición de la persona durante el recorrido (13): punto azul. */
  user?: LonLat | null
  /** Si es true, el mapa sigue a `user`. */
  follow?: boolean
  places?: readonly MapPlace[]
  label: string
}

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] }
const NO_TREES = EMPTY as FeatureCollection<Point, TreeProps>
const NO_PLACES: readonly MapPlace[] = []
/** Al seguir a la persona: zoom mínimo y franja del borde (fracción de la vista) que obliga a recentrar. */
const FOLLOW_ZOOM = 17.5
const FOLLOW_MARGIN = 0.25
const ROUTE_WIDTH = ['interpolate', ['exponential', 2], ['zoom'], 14, 3, 16, 5, 18, 10] as const

function asLines(route: Route | null | undefined): FeatureCollection<MultiLineString> {
  if (!route) return EMPTY as FeatureCollection<MultiLineString>
  const feature: Feature<MultiLineString> = {
    type: 'Feature',
    properties: {},
    geometry: { type: 'MultiLineString', coordinates: route.pieces.map((p) => p.coords) },
  }
  return { type: 'FeatureCollection', features: [feature] }
}

export function MapaRutas({
  data,
  shaded = null,
  shortest = null,
  selected = 'sombra',
  origin = null,
  destination = null,
  trees = NO_TREES,
  user = null,
  follow = false,
  places = NO_PLACES,
  label,
}: MapaRutasProps) {
  const { t } = useT()
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [ready, setReady] = useState(false)
  const [originElement] = useState(() => document.createElement('div'))
  const [destinationElement] = useState(() => document.createElement('div'))
  const [userElement] = useState(() => document.createElement('div'))
  // Centro inicial: el mapa se crea una vez por juego de datos y luego se encuadra con las rutas.
  const initialCenter = useRef<LonLat>(origin ?? destination ?? data.meta.area.centro)

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
    const bounds = new LngLatBounds()
    for (const point of [origin, destination]) if (point) bounds.extend(point)
    for (const route of [shaded, shortest]) route?.pieces.forEach((p) => p.coords.forEach((c) => bounds.extend(c)))
    for (const place of places) bounds.extend(place.point)
    if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 48, maxZoom: 18, duration: 0 })
  }, [ready, shaded, shortest, selected, trees, origin, destination, places])

  // Marcadores de partida y destino.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const markers = [
      origin && new Marker({ element: originElement }).setLngLat(origin).addTo(map),
      destination && new Marker({ element: destinationElement }).setLngLat(destination).addTo(map),
    ]
    return () => markers.forEach((m) => m?.remove())
  }, [ready, origin, destination, originElement, destinationElement])

  // Lugares sueltos (refugios).
  const placeElements = useMemo(() => places.map((place) => ({ place, element: document.createElement('div') })), [places])
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const markers = placeElements.map(({ place, element }) => new Marker({ element }).setLngLat(place.point).addTo(map))
    return () => markers.forEach((m) => m.remove())
  }, [ready, placeElements])

  // La persona durante el recorrido; con `follow`, el mapa la sigue.
  const userMarker = useRef<Marker | null>(null)
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    if (!user) {
      userMarker.current?.remove()
      userMarker.current = null
      return
    }
    userMarker.current ??= new Marker({ element: userElement }).setLngLat(user).addTo(map)
    userMarker.current.setLngLat(user)
    if (!follow) return
    // Recentrar solo si el punto se acerca al borde: mover la cámara en cada paso cuesta batería.
    const { x, y } = map.project(user)
    const { clientWidth: width, clientHeight: height } = map.getContainer()
    const inside = x > width * FOLLOW_MARGIN && x < width * (1 - FOLLOW_MARGIN) && y > height * FOLLOW_MARGIN && y < height * (1 - FOLLOW_MARGIN)
    if (!inside || map.getZoom() < FOLLOW_ZOOM) map.easeTo({ center: user, zoom: Math.max(map.getZoom(), FOLLOW_ZOOM), duration: 400 })
  }, [ready, user, follow, userElement])

  return (
    <>
      <div ref={container} className={s.mapa} />
      {createPortal(<Marcador kind="usuario" label={t('origen.punto')} />, originElement)}
      {createPortal(<Marcador kind="destino" />, destinationElement)}
      {createPortal(<Marcador kind="usuario" />, userElement)}
      {placeElements.map(({ place, element }) => createPortal(<Marcador kind={place.kind} label={place.label} />, element, place.id))}
    </>
  )
}
