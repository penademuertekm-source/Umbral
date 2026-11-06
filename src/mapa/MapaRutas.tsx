import type { Feature, FeatureCollection, MultiLineString, Point } from 'geojson'
import { LngLatBounds, Map as MapLibreMap, Marker, type GeoJSONSource } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './trabajador'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icono, Marcador, type IconName, type MarkerKind } from '../componentes'
import { useT } from '../i18n/useT'
import type { LonLat } from '../rutas/geometria'
import type { Route } from '../rutas/rutas'
import { addBaseLayers, baseStyle } from './capas'
import type { MapData, TreeProps } from './datos'
import { addMapImages } from './imagenes'
import s from './MapaSombra.module.css'
import { mapColors } from './tokens'

// Mapa de las pantallas de rutas (06, 13 y 10): las rutas (Figma 117:613: con más sombra, verde continua de
// 7 px con borde blanco; más corta, gris a rayas de 4 px), los puntos de partida y destino con el nombre del
// lugar, la persona en movimiento (13) y lugares sueltos como los refugios (10).

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
  /** Nombre e ícono del destino, en una pastilla junto a la bandera (06: el único lugar de referencia). */
  destinationName?: string
  destinationIcon?: IconName
  /** Alto (px) de lo que tapa el mapa desde abajo, como una hoja: el encuadre deja libre esa franja. */
  bottomInset?: number
}

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] }
const NO_TREES = EMPTY as FeatureCollection<Point, TreeProps>
const NO_PLACES: readonly MapPlace[] = []
/** Al seguir a la persona: zoom mínimo y franja del borde (fracción de la vista) que obliga a recentrar. */
const FOLLOW_ZOOM = 17.5
const FOLLOW_MARGIN = 0.25
/** Ruta con más sombra: 7 px a zoom 16, con un borde blanco de 2 px a cada lado. */
const SHADED_WIDTH = ['interpolate', ['exponential', 2], ['zoom'], 14, 4, 16, 7, 18, 12] as const
const SHADED_CASING = ['interpolate', ['exponential', 2], ['zoom'], 14, 8, 16, 11, 18, 16] as const
/** Ruta más corta: 4 px a zoom 16, a rayas de 8 px con huecos de 7 (en unidades del grosor). */
const SHORTEST_WIDTH = ['interpolate', ['exponential', 2], ['zoom'], 14, 2.5, 16, 4, 18, 7] as const
const SHORTEST_DASH = [2, 1.75]
/** Margen del encuadre (px). */
const FRAME_PADDING = 48
/** Margen a los lados con la pastilla del destino (px): la mitad de una pastilla larga. */
const NAME_SIDE_PADDING = 110

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
  destinationName,
  destinationIcon,
  bottomInset = 0,
}: MapaRutasProps) {
  const { t } = useT()
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [ready, setReady] = useState(false)
  const [originElement] = useState(() => document.createElement('div'))
  const [destinationElement] = useState(() => document.createElement('div'))
  const [userElement] = useState(() => document.createElement('div'))
  const [nameElement] = useState(() => {
    const element = document.createElement('div')
    element.style.pointerEvents = 'none'
    return element
  })
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
      minZoom: 13,
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
        layout: { 'line-join': 'round', 'line-cap': 'butt' },
        paint: { 'line-color': colors.textoSecundario, 'line-width': SHORTEST_WIDTH as never, 'line-dasharray': SHORTEST_DASH },
      })
      map.addLayer({
        id: 'ruta-sombra-borde',
        type: 'line',
        source: 'ruta-sombra',
        layout: round,
        paint: { 'line-color': colors.superficie, 'line-width': SHADED_CASING as never },
      })
      map.addLayer({
        id: 'ruta-sombra',
        type: 'line',
        source: 'ruta-sombra',
        layout: round,
        paint: { 'line-color': colors.sombra, 'line-width': SHADED_WIDTH as never },
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
    // La ruta elegida va encima (debajo de los árboles).
    const order = selected === 'corta' ? ['ruta-sombra-borde', 'ruta-sombra', 'ruta-corta'] : ['ruta-corta', 'ruta-sombra-borde', 'ruta-sombra']
    order.forEach((id) => map.moveLayer(id, 'ruta-arboles'))
    const bounds = new LngLatBounds()
    for (const point of [origin, destination]) if (point) bounds.extend(point)
    for (const route of [shaded, shortest]) route?.pieces.forEach((p) => p.coords.forEach((c) => bounds.extend(c)))
    for (const place of places) bounds.extend(place.point)
    if (bounds.isEmpty()) return
    // Con la pastilla del destino hace falta más margen abajo y a los lados (media pastilla).
    const side = destinationName ? NAME_SIDE_PADDING : FRAME_PADDING
    const bottom = (destinationName ? FRAME_PADDING + 40 : FRAME_PADDING) + bottomInset
    const { clientHeight: height } = map.getContainer()
    // En un celular pequeño la franja libre es baja: los márgenes se achican para que el encuadre quepa.
    const free = height - bottom - FRAME_PADDING - 24
    const scale = free < 120 ? Math.max(0.3, free / 120) : 1
    map.fitBounds(bounds, {
      padding: { top: (FRAME_PADDING + 24) * scale, bottom: bottomInset + (bottom - bottomInset) * scale, left: side * scale, right: side * scale },
      maxZoom: 18,
      duration: 0,
    })
  }, [ready, shaded, shortest, selected, trees, origin, destination, places, bottomInset, destinationName])

  // Marcadores de partida y destino.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const markers = [
      origin && new Marker({ element: originElement }).setLngLat(origin).addTo(map),
      destination && new Marker({ element: destinationElement }).setLngLat(destination).addTo(map),
      // La pastilla con el nombre del destino, debajo de la bandera.
      destination && destinationName ? new Marker({ element: nameElement, anchor: 'top', offset: [0, 26] }).setLngLat(destination).addTo(map) : null,
    ]
    return () => markers.forEach((m) => m?.remove())
  }, [ready, origin, destination, originElement, destinationElement, nameElement, destinationName])

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
      {destinationName &&
        createPortal(
          <span className={`${s.lugar} ${s.referencia} um-etiqueta`}>
            {destinationIcon && (
              <span className={s.referenciaIcono} aria-hidden="true">
                <Icono name={destinationIcon} size={20} />
              </span>
            )}
            {destinationName}
          </span>,
          nameElement,
        )}
      {createPortal(<Marcador kind="usuario" />, userElement)}
      {placeElements.map(({ place, element }) => createPortal(<Marcador kind={place.kind} label={place.label} />, element, place.id))}
    </>
  )
}
