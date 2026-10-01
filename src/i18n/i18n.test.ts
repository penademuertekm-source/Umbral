import { describe, expect, it } from 'vitest'
import en from './en.json'
import es from './es.json'
import { detectLanguage } from './idioma'
import { flattenKeys, interpolate, lookup, type TranslationKey } from './traducir'

describe('textos de la interfaz', () => {
  it('es.json y en.json tienen exactamente las mismas claves', () => {
    expect(flattenKeys(en).sort()).toEqual(flattenKeys(es).sort())
  })

  it('ningún texto está vacío', () => {
    for (const dict of [es, en]) {
      for (const key of flattenKeys(dict)) expect(lookup(dict, key), key).not.toBe('')
    }
  })

  it('reemplaza los marcadores {nombre}', () => {
    expect(interpolate('al sol {sol} · a la sombra {sombra}', { sol: '41°', sombra: '35°' })).toBe(
      'al sol 41° · a la sombra 35°',
    )
    expect(interpolate('Hola {nadie}', {})).toBe('Hola {nadie}')
  })

  it('las claves están tipadas', () => {
    const ok: TranslationKey = 'semaforo.comodo'
    // @ts-expect-error: una clave que no existe no compila
    const bad: TranslationKey = 'semaforo.inexistente'
    expect(lookup(es, ok)).toBe('Cómodo')
    expect(lookup(es, bad)).toBeUndefined()
  })
})

describe('detección del idioma', () => {
  it('usa el primer idioma soportado del navegador', () => {
    expect(detectLanguage(['es-CO', 'en-US'])).toBe('es')
    expect(detectLanguage(['fr-FR', 'en-GB', 'es'])).toBe('en')
  })

  it('con un idioma no soportado usa inglés; sin datos, español', () => {
    expect(detectLanguage(['de-DE'])).toBe('en')
    expect(detectLanguage([])).toBe('es')
  })
})
