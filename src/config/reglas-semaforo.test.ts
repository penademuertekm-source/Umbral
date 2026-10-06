import { describe, expect, it } from 'vitest'
import { generalLevel, routeLevel, routeUtci, utciCategory, type ThermalInputs } from './reglas-semaforo'

const base: ThermalInputs = { utciSun: 29, utciShade: 26, cloudCover: 10, elNino: false, profile: 'estandar' }
const level = (changes: Partial<ThermalInputs>) => generalLevel({ ...base, ...changes }).level

describe('semáforo térmico', () => {
  it('clasifica el UTCI con los límites de CLAUDE.md', () => {
    expect(utciCategory(25.9)).toBe('sin_estres')
    expect(utciCategory(26)).toBe('moderado')
    expect(utciCategory(31.9)).toBe('moderado')
    expect(utciCategory(32)).toBe('fuerte')
    expect(utciCategory(38)).toBe('muy_fuerte')
    expect(utciCategory(46)).toBe('muy_fuerte')
    expect(utciCategory(46.1)).toBe('extremo')
  })

  it('reproduce los cuatro ejemplos de la pantalla 17', () => {
    expect(level({ utciSun: 29, utciShade: 26 })).toBe('comodo')
    expect(level({ utciSun: 35, utciShade: 31 })).toBe('precaucion')
    expect(level({ utciSun: 41, utciShade: 35 })).toBe('evitar')
    expect(level({ utciSun: 47, utciShade: 38 })).toBe('no_recomendado')
  })

  it('El Niño endurece un nivel solo si ya hay estrés fuerte', () => {
    expect(level({ utciSun: 29, elNino: true })).toBe('comodo')
    expect(level({ utciSun: 35, elNino: true })).toBe('evitar')
    expect(level({ utciSun: 41, elNino: true })).toBe('no_recomendado')
    expect(generalLevel({ ...base, utciSun: 41, elNino: true }).hardenedBy).toEqual(['el_nino'])
  })

  it('el perfil vulnerable endurece un nivel, sin pasar de "no recomendado"', () => {
    expect(level({ utciSun: 29, profile: 'vulnerable' })).toBe('precaucion')
    expect(level({ utciSun: 41, profile: 'vulnerable', elNino: true })).toBe('no_recomendado')
    expect(level({ utciSun: 47, profile: 'vulnerable' })).toBe('no_recomendado')
  })

  it('con nubosidad alta dice "nublado" solo si el riesgo es bajo', () => {
    expect(level({ utciSun: 33.6, cloudCover: 90 })).toBe('nublado')
    expect(level({ utciSun: 33.6, cloudCover: 79 })).toBe('precaucion')
    expect(level({ utciSun: 40, cloudCover: 95 })).toBe('evitar')
    // Con perfil vulnerable el nivel sube a "evitar": ya no es riesgo bajo.
    expect(level({ utciSun: 33.6, cloudCover: 90, profile: 'vulnerable' })).toBe('evitar')
    expect(level({ utciSun: 33.6, cloudCover: null })).toBe('precaucion')
  })

  it('el nivel de ruta pasa de la sombra al sol según los minutos al sol', () => {
    expect(routeUtci(31, 41, 0)).toBe(31)
    expect(routeUtci(31, 41, 5)).toBe(36)
    expect(routeUtci(31, 41, 25)).toBe(41)
    const ruta = (minutesInSun: number) => routeLevel({ ...base, utciShade: 31, utciSun: 41, minutesInSun }).level
    expect(ruta(0)).toBe('comodo')
    expect(ruta(5)).toBe('precaucion')
    expect(ruta(12)).toBe('evitar')
    // Las rutas no usan "nublado".
    expect(routeLevel({ ...base, utciShade: 30, utciSun: 33, cloudCover: 95, minutesInSun: 10 }).level).toBe('precaucion')
  })
})
