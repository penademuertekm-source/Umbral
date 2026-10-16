import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addPlace,
  deleteMyData,
  emptyProfile,
  MAX_PLACES,
  parse,
  placeForDestination,
  readProfile,
  removePlace,
  renamePlace,
  restorePlace,
  setName,
  STORAGE_KEY,
  subscribe,
  VERSION,
  type ProfileStorage,
} from './almacen'

/** Almacenamiento en memoria para las pruebas. */
function memoryStorage(): ProfileStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  }
}

/** Un teléfono que no deja guardar (modo privado de algunos navegadores). */
const brokenStorage: ProfileStorage = {
  getItem: () => {
    throw new Error('bloqueado')
  },
  setItem: () => {
    throw new Error('bloqueado')
  },
  removeItem: () => {
    throw new Error('bloqueado')
  },
}

describe('perfil guardado en el teléfono', () => {
  let storage: ReturnType<typeof memoryStorage>
  beforeEach(() => {
    storage = memoryStorage()
  })

  it('sin datos, o con datos dañados o de otra versión, empieza vacío', () => {
    expect(parse(null)).toEqual(emptyProfile())
    expect(parse('{no es json')).toEqual(emptyProfile())
    expect(parse(JSON.stringify({ version: VERSION + 1, name: 'Ana' }))).toEqual(emptyProfile())
    expect(parse(JSON.stringify([1, 2]))).toEqual(emptyProfile())
  })

  it('descarta lugares mal formados y respeta el máximo', () => {
    const good = { id: 'a', name: 'Casa', destinationId: 'plaza', created: '2026-10-16T10:00:00.000Z' }
    const many = Array.from({ length: MAX_PLACES + 3 }, (_, i) => ({ ...good, id: `p${i}` }))
    const data = parse(JSON.stringify({ version: VERSION, name: 42, places: [good, { id: 'b' }, ...many] }))
    expect(data.name).toBe('')
    expect(data.places).toHaveLength(MAX_PLACES)
    expect(data.places[0]).toEqual(good)
  })

  it('guarda todo bajo una sola clave versionada', () => {
    addPlace('Trabajo', 'plaza-alfonso-lopez', new Date('2026-10-16T15:00:00Z'), storage)
    expect([...storage.data.keys()]).toEqual([STORAGE_KEY])
    const saved = JSON.parse(storage.data.get(STORAGE_KEY)!)
    expect(saved.version).toBe(VERSION)
    expect(saved.places[0]).toMatchObject({ name: 'Trabajo', destinationId: 'plaza-alfonso-lopez', created: '2026-10-16T15:00:00.000Z' })
  })

  it('agrega, cambia el nombre y borra lugares', () => {
    const added = addPlace('  Misa   del domingo ', 'iglesia', new Date(), storage)
    expect(added.ok).toBe(true)
    if (!added.ok) return
    expect(added.place.name).toBe('Misa del domingo')
    expect(placeForDestination(readProfile(storage), 'iglesia')?.id).toBe(added.place.id)

    expect(renamePlace(added.place.id, 'Iglesia', storage)).toBe(true)
    expect(renamePlace(added.place.id, '   ', storage)).toBe(false)
    expect(renamePlace('no-existe', 'X', storage)).toBe(false)
    expect(readProfile(storage).places[0].name).toBe('Iglesia')

    expect(removePlace(added.place.id, storage)?.index).toBe(0)
    expect(readProfile(storage).places).toEqual([])
    expect(removePlace(added.place.id, storage)).toBeNull()
  })

  it('no guarda un lugar sin nombre', () => {
    expect(addPlace('   ', 'plaza', new Date(), storage)).toEqual({ ok: false, reason: 'sin_nombre' })
  })

  it('el undécimo lugar pide borrar uno', () => {
    for (let i = 0; i < MAX_PLACES; i++) expect(addPlace(`Lugar ${i}`, `d${i}`, new Date(), storage).ok).toBe(true)
    expect(addPlace('Uno más', 'otro', new Date(), storage)).toEqual({ ok: false, reason: 'limite' })
  })

  it('"Deshacer" devuelve el lugar a su posición', () => {
    const ids = ['Casa', 'Trabajo', 'Estudio'].map((name, i) => {
      const r = addPlace(name, `d${i}`, new Date(), storage)
      return r.ok ? r.place.id : ''
    })
    const removed = removePlace(ids[1], storage)!
    expect(readProfile(storage).places.map((p) => p.name)).toEqual(['Casa', 'Estudio'])
    expect(restorePlace(removed, storage)).toBe(true)
    expect(readProfile(storage).places.map((p) => p.name)).toEqual(['Casa', 'Trabajo', 'Estudio'])
    // Deshacer dos veces no lo duplica.
    expect(restorePlace(removed, storage)).toBe(true)
    expect(readProfile(storage).places).toHaveLength(3)
  })

  it('"Borrar mis datos" borra el perfil pero no los ajustes ni las respuestas', () => {
    storage.data.set('umbral.idioma', 'en')
    storage.data.set('umbral.textoGrande', 'si')
    storage.data.set('umbral.respuestas', '[]')
    setName('Ana', storage)
    addPlace('Casa', 'plaza', new Date(), storage)
    const withEverything = { ...readProfile(storage), trips: [{}], arrivals: [{}], stamps: [{}], cards: [{}], achievements: [{}] }
    storage.data.set(STORAGE_KEY, JSON.stringify(withEverything))

    deleteMyData(storage)
    expect(readProfile(storage)).toEqual(emptyProfile())
    expect(storage.data.has(STORAGE_KEY)).toBe(false)
    expect(storage.data.get('umbral.idioma')).toBe('en')
    expect(storage.data.get('umbral.textoGrande')).toBe('si')
    expect(storage.data.get('umbral.respuestas')).toBe('[]')
  })

  it('si el teléfono no deja guardar, no falla y vale mientras la página esté abierta', () => {
    expect(() => readProfile(brokenStorage)).not.toThrow()
    expect(addPlace('Casa', 'plaza', new Date(), brokenStorage).ok).toBe(true)
    expect(readProfile(brokenStorage).places).toHaveLength(1)
    expect(() => deleteMyData(brokenStorage)).not.toThrow()
    expect(readProfile(brokenStorage).places).toEqual([])
  })

  it('avisa a las pantallas cuando cambia', () => {
    const listener = vi.fn()
    const unsubscribe = subscribe(listener)
    setName('Ana', storage)
    deleteMyData(storage)
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
    setName('Luis', storage)
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('devuelve el mismo objeto mientras no cambie lo guardado', () => {
    setName('Ana', storage)
    expect(readProfile(storage)).toBe(readProfile(storage))
  })
})
