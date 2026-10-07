import { beforeEach, describe, expect, it } from 'vitest'
import { readHeatProfile, readHeatProfileOption, writeHeatProfileOption } from '../../clima/configClima'
import { answersToCsv } from './csv'
import { applyDisplaySettings, readSettings, writeSetting } from './preferencias'

describe('ajustes (pantallas 11 y 23)', () => {
  beforeEach(() => localStorage.clear())

  it('lee los valores por defecto y guarda cada interruptor', () => {
    expect(readSettings()).toEqual({ largeText: false, highContrast: false, heatWarning: true, dataSaver: false })
    writeSetting('largeText', true)
    writeSetting('heatWarning', false)
    expect(readSettings()).toMatchObject({ largeText: true, heatWarning: false })
    // El aviso de calor usa la misma clave que la pantalla 19.
    expect(localStorage.getItem('umbral.avisoCalor')).toBe('no')
  })

  it('pasa texto grande y alto contraste a <html>', () => {
    const root = document.createElement('html')
    applyDisplaySettings({ largeText: true, highContrast: false }, root)
    expect(root.getAttribute('data-texto-grande')).toBe('true')
    expect(root.hasAttribute('data-alto-contraste')).toBe(false)
    applyDisplaySettings({ largeText: false, highContrast: true }, root)
    expect(root.hasAttribute('data-texto-grande')).toBe(false)
    expect(root.getAttribute('data-alto-contraste')).toBe('true')
  })

  it('el perfil General usa la regla estándar y los otros cuatro la vulnerable', () => {
    expect(readHeatProfileOption()).toBe('general')
    expect(readHeatProfile()).toBe('estandar')
    for (const option of ['adulto_mayor', 'ninos', 'embarazo', 'salud'] as const) {
      writeHeatProfileOption(option)
      expect(readHeatProfile()).toBe('vulnerable')
    }
    // Valores guardados antes de la Fase 9.
    localStorage.setItem('umbral.perfilCalor', 'vulnerable')
    expect(readHeatProfileOption()).toBe('salud')
    localStorage.setItem('umbral.perfilCalor', 'otra-cosa')
    expect(readHeatProfileOption()).toBe('general')
  })

  it('exporta las respuestas en CSV con comillas cuando hace falta', () => {
    const csv = answersToCsv([
      { fecha: '2026-10-06', hora: '12:30', destino: 'plaza-alfonso-lopez', nivel: 'precaucion', respuesta: 'si', simulado: true },
      { fecha: '2026-10-07', hora: '07:15', destino: 'a,"b"', nivel: null, respuesta: 'mas_o_menos', simulado: false },
    ])
    expect(csv).toBe(
      'fecha,hora,destino,nivel,respuesta,simulado\r\n' +
        '2026-10-06,12:30,plaza-alfonso-lopez,precaucion,si,si\r\n' +
        '2026-10-07,07:15,"a,""b""",,mas_o_menos,no\r\n',
    )
  })
})
