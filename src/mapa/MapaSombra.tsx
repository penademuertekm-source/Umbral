import type { FeatureCollection, LineString } from 'geojson'
import { LngLatBounds, Map as MapLibreMap, Marker, type GeoJSONSource, type MapMouseEvent } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import './trabajador'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icono, Marcador } from '../componentes'
import type { IsochroneProps } from '../rutas/isocronas'
import { motorSombra, type ResultadoSombra } from '../sombra/cliente'
import type { Side, SideLetter } from '../sombra/modelo'
import { useT } from '../i18n/useT'
import { addDataLayers, baseStyle, selectEdge, setMapMode } from './capas'
import type { MapData, Refuge } from './datos'
import { addMapImages } from './imagenes'
import s from './MapaSombra.module.css'
import { mapColors } from './tokens'

interface MapaSombraProps {
  data: MapData
  resultado?: ResultadoSombra
  selectedEdge: number | null
  onSelect: (edge: number, side: SideLetter) => void
  /** Posición del usuario [lon, lat], si dio permiso. */
  user: [number, number] | null
  /** Cambia cada vez que se pide centrar el mapa en el usuario. */
  focusUser: number
  /** Estado nublado (pantalla 20): tramos en gris y etiquetas de los lugares cubiertos. */
  cloudy?: boolean
  /** Lugares cubiertos con coordenadas (se muestran solo con el cielo nublado). Debe ser estable (useMemo). */
  coveredPlaces?: Refuge[]
  /** Capa de isócronas (Fase 6). Mientras haya una, se ocultan los tramos de sombra y los árboles. */
  isochrones?: FeatureCollection<LineString, IsochroneProps> | null
  /** Si se da, tocar el mapa entrega el punto [lon, lat] en lugar de abrir la ficha del tramo. */
  onMapClick?: (point: [number, number]) => void
  /** Punto de partida elegido en el mapa [lon, lat]. */
  pin?: [number, number] | null
}

const NO_PLACES: Refuge[] = []

const INITIAL_ZOOM = 16.5
/** Con la ficha abierta solo se ve la parte de arriba del mapa: el tramo elegido debe quedar ahí. */
const VISIBLE_SHARE = 0.4
/** Parte del mapa, desde arriba, que no tapa la leyenda de las isócronas. */
const ISOCHRONE_VISIBLE_SHARE = 0.62

/** Mapa de sombra (pantalla 04): estilo propio, tramos por lado de acera y árboles. */
export function MapaSombra({
  data,
  resultado,
  selectedEdge,
  onSelect,
  user,
  focusUser,
  cloudy = false,
  coveredPlaces = NO_PLACES,
  isochrones = null,
  onMapClick,
  pin = null,
}: MapaSombraProps) {
  const { t } = useT()
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [ready, setReady] = useState(false)
  const [sides, setSides] = useState<Side[] | null>(null)
  const [userElement] = useState(() => document.createElement('div'))
  const userMarker = useRef<Marker | null>(null)
  const [pinElement] = useState(() => document.createElement('div'))
  const pinMarker = useRef<Marker | null>(null)
  const onSelectRef = useRef(onSelect)
  const onMapClickRef = useRef(onMapClick)
  const userRef = useRef(user)
  /** Estado ya pintado de cada lado, para tocar solo los que cambian al mover el deslizador. */
  const painted = useRef<Uint8Array | null>(null)
  const edgeMidpoints = useMemo(
    () =>
      new Map(
        data.red.features.map((f) => {
          const coords = f.geometry.coordinates
          return [f.properties.id, coords[Math.floor(coords.length / 2)] as [number, number]]
        }),
      ),
    [data],
  )

  useEffect(() => {
    onSelectRef.current = onSelect
    onMapClickRef.current = onMapClick
    userRef.current = user
  })

  // Crear el mapa una sola vez.
  useEffect(() => {
    if (!container.current) return
    const colors = mapColors()
    const [west, south, east, north] = data.meta.area.bbox
    const margin = 0.004
    const map = new MapLibreMap({
      container: container.current,
      style: baseStyle(colors),
      center: data.meta.area.centro,
      zoom: INITIAL_ZOOM,
      minZoom: 14,
      maxZoom: 19.5,
      maxBounds: [
        [west - margin, south - margin],
        [east + margin, north + margin],
      ],
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    })
    map.touchZoomRotate.disableRotation()
    map.keyboard.disableRotation()
    mapRef.current = map
    painted.current = null

    let alive = true
    map.on('load', async () => {
      await addMapImages(map, colors)
      if (!alive) return
      addDataLayers(map, data, colors)
      setReady(true)
    })

    const pick = (event: MapMouseEvent) => {
      if (onMapClickRef.current) {
        onMapClickRef.current([event.lngLat.lng, event.lngLat.lat])
        return
      }
      const { x, y } = event.point
      const features = map.queryRenderedFeatures(
        [
          [x - 12, y - 12],
          [x + 12, y + 12],
        ],
        { layers: ['tramos-toque'] },
      )
      const hit = features[0]?.properties as { arista?: number; lado?: SideLetter } | undefined
      if (hit?.arista !== undefined && hit.lado) onSelectRef.current(hit.arista, hit.lado)
    }
    map.on('click', pick)
    const pointer = (cursor: string) => () => (map.getCanvas().style.cursor = cursor)
    map.on('mouseenter', 'tramos-toque', pointer('pointer'))
    map.on('mouseleave', 'tramos-toque', pointer(''))

    return () => {
      alive = false
      map.remove()
      mapRef.current = null
    }
  }, [data])

  // MapLibre pone role="region" en el lienzo con la etiqueta "Map": se traduce.
  useEffect(() => {
    mapRef.current?.getCanvas().setAttribute('aria-label', t('mapa.etiqueta'))
  }, [t, ready])

  // Lados de acera en el orden de los resultados del motor.
  useEffect(() => {
    let alive = true
    motorSombra.lados().then((list) => alive && setSides(list))
    return () => {
      alive = false
    }
  }, [])

  // Pintar la sombra: solo cambia el estado de cada tramo (las capas no se recrean).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !sides || !resultado) return
    const previous = painted.current
    for (let i = 0; i < sides.length; i++) {
      if (previous && previous[i] === resultado.state[i]) continue
      map.setFeatureState({ source: 'aceras', id: `${sides[i].edge}${sides[i].side}` }, { estado: resultado.state[i] })
    }
    painted.current = resultado.state.slice()
  }, [ready, sides, resultado])

  // Resaltar el tramo elegido y, si la ficha lo tapa, moverlo a la parte visible.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    selectEdge(map, selectedEdge)
    const midpoint = selectedEdge === null ? undefined : edgeMidpoints.get(selectedEdge)
    if (!midpoint) return
    const { x, y } = map.project(midpoint)
    const { clientWidth: width, clientHeight: height } = map.getContainer()
    if (y < 24 || y > height * VISIBLE_SHARE || x < 24 || x > width - 24) {
      map.easeTo({ center: midpoint, offset: [0, -height * (0.5 - VISIBLE_SHARE / 2)] })
    }
  }, [ready, selectedEdge, edgeMidpoints])

  // Qué se ve sobre las calles: sombra, nublado (pantalla 20) o isócronas (Fase 6).
  const mode = isochrones ? 'isocronas' : cloudy ? 'nublado' : 'sombra'
  useEffect(() => {
    const map = mapRef.current
    if (map && ready) setMapMode(map, mode)
  }, [ready, mode])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !isochrones) return
    ;(map.getSource('isocronas') as GeoJSONSource | undefined)?.setData(isochrones)
  }, [ready, isochrones])

  // Al activar las isócronas o cambiar el punto de partida, las bandas se encuadran en la parte del mapa que
  // deja libre la leyenda. Al cambiar la hora no se mueve el mapa. Con GPS no se reencuadra a cada posición.
  const framed = useRef<string | null>(null)
  const frameKey = isochrones ? (pin ? pin.join(',') : 'gps') : null
  useEffect(() => {
    const map = mapRef.current
    if (!frameKey) framed.current = null
    if (!map || !ready || !isochrones || !frameKey || framed.current === frameKey) return
    const coords = isochrones.features.flatMap((f) => f.geometry.coordinates as [number, number][])
    if (coords.length === 0) return
    framed.current = frameKey
    const bounds = coords.reduce((b, c) => b.extend(c), new LngLatBounds(coords[0], coords[0]))
    const { clientHeight: height } = map.getContainer()
    map.fitBounds(bounds, {
      padding: { top: 72, right: 72, bottom: height * (1 - ISOCHRONE_VISIBLE_SHARE), left: 24 },
      maxZoom: 17.5,
    })
  }, [ready, isochrones, frameKey])

  const placeElements = useMemo(
    () => coveredPlaces.map((place) => ({ place, element: document.createElement('div') })),
    [coveredPlaces],
  )
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || mode !== 'nublado') return
    const located = placeElements.filter(({ place }) => place.lon !== null && place.lat !== null)
    const markers = located.map(({ place, element }) =>
      new Marker({ element, anchor: 'center' }).setLngLat([place.lon!, place.lat!]).addTo(map),
    )
    // La tarjeta de nublado tapa la parte de arriba del mapa: los lugares se llevan a la parte de abajo.
    if (located.length > 0) {
      const lon = located.reduce((sum, { place }) => sum + place.lon!, 0) / located.length
      const lat = located.reduce((sum, { place }) => sum + place.lat!, 0) / located.length
      const { x, y } = map.project([lon, lat])
      const { clientWidth: width, clientHeight: height } = map.getContainer()
      if (y < height * 0.55 || y > height - 80 || x < 120 || x > width - 120) {
        map.easeTo({ center: [lon, lat], offset: [0, height * 0.2] })
      }
    }
    return () => markers.forEach((marker) => marker.remove())
  }, [ready, mode, placeElements])

  // Marcador del usuario.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!user) {
      userMarker.current?.remove()
      userMarker.current = null
      return
    }
    userMarker.current ??= new Marker({ element: userElement }).setLngLat(user).addTo(map)
    userMarker.current.setLngLat(user)
  }, [user, userElement])

  // Punto de partida elegido en el mapa.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    if (!pin) {
      pinMarker.current?.remove()
      pinMarker.current = null
      return
    }
    pinMarker.current ??= new Marker({ element: pinElement }).setLngLat(pin).addTo(map)
    pinMarker.current.setLngLat(pin)
  }, [ready, pin, pinElement])

  // Centrar en el usuario solo cuando se pide (focusUser cambia), o cuando llega la primera posición
  // después de pedirla.
  const hasUser = user !== null
  useEffect(() => {
    const map = mapRef.current
    const position = userRef.current
    if (map && position && focusUser > 0) map.easeTo({ center: position, zoom: Math.max(map.getZoom(), 17) })
  }, [focusUser, hasUser])

  return (
    <>
      <div ref={container} className={s.mapa} />
      {createPortal(<Marcador kind="usuario" />, userElement)}
      {createPortal(<Marcador kind="usuario" label={t('origen.punto')} />, pinElement)}
      {placeElements.map(({ place, element }) =>
        createPortal(
          <span className={`${s.lugar} um-etiqueta`}>
            <span className={s.lugarIcono} aria-hidden="true">
              <Icono name="sombrilla" size={20} />
            </span>
            <span className="sr-only">{t('nublado.lugar', { nombre: place.nombre })}</span>
            <span aria-hidden="true">{place.nombre}</span>
          </span>,
          element,
          place.id,
        ),
      )}
    </>
  )
}
