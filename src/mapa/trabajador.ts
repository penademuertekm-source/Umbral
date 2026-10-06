import { setWorkerUrl } from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

// MapLibre 6 busca su worker junto a su propio archivo; con Vite hay que empaquetarlo y darle la URL.
// Todo mapa de la app importa este módulo antes de crear su instancia.
setWorkerUrl(maplibreWorkerUrl)
