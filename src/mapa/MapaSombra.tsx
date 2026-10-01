import { Map as MapLibreMap, Marker, setWorkerUrl, type MapMouseEvent } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Marcador } from '../componentes'
import { motorSombra, type ResultadoSombra } from '../sombra/cliente'
import type { Side, SideLetter } from '../sombra/modelo'
import { useT } from '../i18n/useT'
import { addDataLayers, baseStyle, selectEdge } from './capas'
import type { MapData } from './datos'
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
}

// MapLibre 6 busca su worker junto a su propio archivo; con Vite hay que empaquetarlo y darle la URL.
setWorkerUrl(maplibreWorkerUrl)

const INITIAL_ZOOM = 16.5
/** Con la ficha abierta solo se ve la parte de arriba del mapa: el tramo elegido debe quedar ahí. */
const VISIBLE_SHARE = 0.4

/** Mapa de sombra (pantalla 04): estilo propio, tramos por lado de acera y árboles. */
export function MapaSombra({ data, resultado, selectedEdge, onSelect, user, focusUser }: MapaSombraProps) {
  const { t } = useT()
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [ready, setReady] = useState(false)
  const [sides, setSides] = useState<Side[] | null>(null)
  const [userElement] = useState(() => document.createElement('div'))
  const userMarker = useRef<Marker | null>(null)
  const onSelectRef = useRef(onSelect)
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
    </>
  )
}
