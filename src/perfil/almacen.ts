// Datos personales guardados en el teléfono (S1 a S3, docs/especificacion-pantallas.md, "Sugerencias del
// docente"). Todo vive en localStorage bajo una sola clave versionada; nunca se guarda el camino hecho con
// el GPS (CLAUDE.md, regla 2). Los ajustes (idioma, letra, avisos…) tienen sus propias claves y "Borrar mis
// datos" no los toca.

/** Clave única de localStorage. Si cambia la forma de los datos, sube VERSION y migra en `parse`. */
export const STORAGE_KEY = 'umbral.perfil'
export const VERSION = 1

/** Máximo sugerido de lugares (especificación S1): el undécimo pide borrar uno. */
export const MAX_PLACES = 10
/** Máximo de salidas planeadas a la vez. */
export const MAX_TRIPS = 20
/** Una salida sigue guardada hasta estos minutos después de su hora (es el tiempo del aviso "Es hora de salir"). */
export const TRIP_GRACE_MIN = 10
/** Largo máximo del nombre de la persona y del nombre de un lugar. */
export const MAX_NAME_LENGTH = 40

/** Un lugar guardado: el nombre que puso la persona y uno de los destinos de la pantalla 05. */
export interface SavedPlace {
  id: string
  name: string
  destinationId: string
  /** Fecha y hora en que se guardó (ISO 8601). */
  created: string
}

/** Una salida planeada (S2). Se guarda el punto de partida, no el camino (decisión de la autora, P2). */
export interface PlannedTrip {
  id: string
  destinationId: string
  /** Lugar guardado desde el que se eligió el destino, si fue uno (para mostrar su nombre). */
  placeId?: string
  /** Punto de partida al planear, [lon, lat]. */
  origin: [number, number]
  /** Hora a la que la persona quiere llegar (ISO 8601). */
  arrival: string
  /** Hora de salida calculada (ISO 8601). */
  departure: string
  /** Se descargó el evento para el calendario del teléfono. */
  inCalendar: boolean
}

export interface ProfileData {
  version: typeof VERSION
  /** Nombre opcional, solo para el saludo de Perfil. Vacío si no lo puso. */
  name: string
  places: SavedPlace[]
  // Espacio reservado para los pasos P2 y P3 (docs/prompts-sugerencias.md). Cada paso define su forma.
  /** Salidas planeadas (S2), de la más próxima a la más lejana. */
  trips: PlannedTrip[]
  /** Llegadas con su sol evitado (S3). */
  arrivals: unknown[]
  /** Sellos del Pasaporte del centro (S3). */
  stamps: unknown[]
  /** Láminas del Álbum de la sombra (S3). */
  cards: unknown[]
  /** Logros conseguidos (S3). */
  achievements: unknown[]
}

export function emptyProfile(): ProfileData {
  return { version: VERSION, name: '', places: [], trips: [], arrivals: [], stamps: [], cards: [], achievements: [] }
}

/** Lo mínimo de Storage que se usa (las pruebas pasan uno propio). */
export type ProfileStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function defaultStorage(): ProfileStorage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

function isPlace(value: unknown): value is SavedPlace {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.destinationId === 'string' &&
    typeof value.created === 'string'
  )
}

const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

const isIsoDate = (value: unknown) => typeof value === 'string' && !Number.isNaN(Date.parse(value))

function isTrip(value: unknown): value is PlannedTrip {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.destinationId === 'string' &&
    (value.placeId === undefined || typeof value.placeId === 'string') &&
    Array.isArray(value.origin) &&
    value.origin.length === 2 &&
    value.origin.every((n) => typeof n === 'number' && Number.isFinite(n)) &&
    isIsoDate(value.arrival) &&
    isIsoDate(value.departure) &&
    typeof value.inCalendar === 'boolean'
  )
}

/** Lee el texto guardado. Si falta, está dañado o es de otra versión, devuelve un perfil vacío. */
export function parse(raw: string | null): ProfileData {
  if (!raw) return emptyProfile()
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return emptyProfile()
  }
  if (!isRecord(value) || value.version !== VERSION) return emptyProfile()
  return {
    version: VERSION,
    name: typeof value.name === 'string' ? value.name.slice(0, MAX_NAME_LENGTH) : '',
    places: list(value.places).filter(isPlace).slice(0, MAX_PLACES),
    trips: list(value.trips).filter(isTrip).slice(0, MAX_TRIPS),
    arrivals: list(value.arrivals),
    stamps: list(value.stamps),
    cards: list(value.cards),
    achievements: list(value.achievements),
  }
}

// --- Lectura y escritura con aviso a quien escucha (useSyncExternalStore) ---

let cache: { raw: string | null; data: ProfileData } | null = null
const listeners = new Set<() => void>()

function readRaw(storage: ProfileStorage | null): string | null {
  try {
    return storage?.getItem(STORAGE_KEY) ?? null
  } catch {
    return null
  }
}

/**
 * El perfil guardado. Devuelve el mismo objeto mientras no cambie el texto guardado, para que React no
 * vuelva a dibujar sin motivo.
 */
export function readProfile(storage: ProfileStorage | null = defaultStorage()): ProfileData {
  const raw = readRaw(storage)
  if (cache && cache.raw === raw) return cache.data
  // Sin almacenamiento, el perfil vive solo en memoria mientras la página esté abierta.
  if (raw === null && cache && !storage) return cache.data
  cache = { raw, data: parse(raw) }
  return cache.data
}

/** Guarda el perfil. Si el teléfono no deja guardar, el cambio vale solo mientras la página esté abierta. */
export function writeProfile(data: ProfileData, storage: ProfileStorage | null = defaultStorage()): void {
  const raw = JSON.stringify(data)
  try {
    storage?.setItem(STORAGE_KEY, raw)
    cache = { raw: storage ? raw : null, data }
  } catch {
    cache = { raw: readRaw(storage), data }
  }
  notify()
}

function notify(): void {
  for (const listener of listeners) listener()
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  // Otra pestaña con la app abierta cambió los datos.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

// --- Operaciones ---

const cleanName = (name: string) => name.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH)

function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function setName(name: string, storage = defaultStorage()): void {
  writeProfile({ ...readProfile(storage), name: cleanName(name) }, storage)
}

export type AddPlaceResult = { ok: true; place: SavedPlace } | { ok: false; reason: 'limite' | 'sin_nombre' }

/** Guarda un lugar. No pasa del máximo sugerido: el undécimo pide borrar uno. */
export function addPlace(name: string, destinationId: string, now = new Date(), storage = defaultStorage()): AddPlaceResult {
  const profile = readProfile(storage)
  const clean = cleanName(name)
  if (!clean) return { ok: false, reason: 'sin_nombre' }
  if (profile.places.length >= MAX_PLACES) return { ok: false, reason: 'limite' }
  const place: SavedPlace = { id: newId(), name: clean, destinationId, created: now.toISOString() }
  writeProfile({ ...profile, places: [...profile.places, place] }, storage)
  return { ok: true, place }
}

/** Cambia el nombre de un lugar. Un nombre vacío no se acepta (devuelve false). */
export function renamePlace(id: string, name: string, storage = defaultStorage()): boolean {
  const profile = readProfile(storage)
  const clean = cleanName(name)
  if (!clean || !profile.places.some((p) => p.id === id)) return false
  writeProfile({ ...profile, places: profile.places.map((p) => (p.id === id ? { ...p, name: clean } : p)) }, storage)
  return true
}

/** Lo necesario para deshacer un borrado: el lugar y la posición que tenía. */
export interface RemovedPlace {
  place: SavedPlace
  index: number
}

export function removePlace(id: string, storage = defaultStorage()): RemovedPlace | null {
  const profile = readProfile(storage)
  const index = profile.places.findIndex((p) => p.id === id)
  if (index < 0) return null
  writeProfile({ ...profile, places: profile.places.filter((p) => p.id !== id) }, storage)
  return { place: profile.places[index], index }
}

/** "Deshacer": vuelve a poner el lugar en su posición (si no se llenó la lista mientras tanto). */
export function restorePlace(removed: RemovedPlace, storage = defaultStorage()): boolean {
  const profile = readProfile(storage)
  if (profile.places.some((p) => p.id === removed.place.id)) return true
  if (profile.places.length >= MAX_PLACES) return false
  const places = [...profile.places]
  places.splice(Math.min(removed.index, places.length), 0, removed.place)
  writeProfile({ ...profile, places }, storage)
  return true
}

/** El lugar guardado para un destino, si existe (para "Guardar" / "Guardado" en la 06). */
export function placeForDestination(profile: ProfileData, destinationId: string): SavedPlace | undefined {
  return profile.places.find((p) => p.destinationId === destinationId)
}

/**
 * "Borrar mis datos": lugares, salidas, llegadas, sellos, láminas, logros y nombre. No toca los ajustes
 * (idioma, letra, avisos, perfil de calor) ni las respuestas de "¿Te sirvió esta ruta?", que se exportan
 * desde Ajustes para la investigación.
 */
export function deleteMyData(storage = defaultStorage()): void {
  try {
    storage?.removeItem(STORAGE_KEY)
    cache = { raw: null, data: emptyProfile() }
    notify()
  } catch {
    // Si no deja borrar la clave, se sobrescribe con un perfil vacío.
    writeProfile(emptyProfile(), storage)
  }
}

// --- Salidas planeadas (S2) ---

const byDeparture = (a: PlannedTrip, b: PlannedTrip) => Date.parse(a.departure) - Date.parse(b.departure)

export type AddTripResult = { ok: true; trip: PlannedTrip } | { ok: false; reason: 'limite' }

/** Guarda una salida (o reemplaza la que tenga el mismo id, al editarla). */
export function saveTrip(trip: Omit<PlannedTrip, 'id'> & { id?: string }, storage = defaultStorage()): AddTripResult {
  const profile = readProfile(storage)
  const others = profile.trips.filter((t) => t.id !== trip.id)
  if (others.length >= MAX_TRIPS) return { ok: false, reason: 'limite' }
  const saved: PlannedTrip = { ...trip, id: trip.id ?? newId() }
  writeProfile({ ...profile, trips: [...others, saved].sort(byDeparture) }, storage)
  return { ok: true, trip: saved }
}

export function markTripInCalendar(id: string, storage = defaultStorage()): void {
  const profile = readProfile(storage)
  if (!profile.trips.some((t) => t.id === id)) return
  writeProfile({ ...profile, trips: profile.trips.map((t) => (t.id === id ? { ...t, inCalendar: true } : t)) }, storage)
}

export function removeTrip(id: string, storage = defaultStorage()): void {
  const profile = readProfile(storage)
  if (!profile.trips.some((t) => t.id === id)) return
  writeProfile({ ...profile, trips: profile.trips.filter((t) => t.id !== id) }, storage)
}

/** Borra las salidas pasadas (más de TRIP_GRACE_MIN minutos después de su hora). Se llama al abrir la app. */
export function prunePastTrips(now = new Date(), storage = defaultStorage()): number {
  const profile = readProfile(storage)
  const limit = now.getTime() - TRIP_GRACE_MIN * 60_000
  const kept = profile.trips.filter((t) => Date.parse(t.departure) >= limit)
  const removed = profile.trips.length - kept.length
  if (removed > 0) writeProfile({ ...profile, trips: kept }, storage)
  return removed
}

/** La salida cuya hora está cerca de `now` (de 15 min antes a 10 después): aviso "Es hora de salir". */
export function tripDueNow(profile: ProfileData, now = new Date(), beforeMin = 15): PlannedTrip | undefined {
  const t = now.getTime()
  return profile.trips.find((trip) => {
    const departure = Date.parse(trip.departure)
    return t >= departure - beforeMin * 60_000 && t <= departure + TRIP_GRACE_MIN * 60_000
  })
}
