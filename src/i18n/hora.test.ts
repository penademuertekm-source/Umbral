import { describe, expect, it } from 'vitest'
import { localDate } from '../sombra/tiempo'
import { translateIn } from './diccionarios'
import type { Language } from './idioma'
import { horaConDia, isTomorrow, laHoraConDia, marcaHora } from './hora'

const i18n = (language: Language) => ({ language, t: (key: string, vars?: Record<string, string | number>) => translateIn(language, key, vars) })
// Jueves 5 de noviembre de 2026, 10:00 p. m. en Valledupar (ya es 6 de noviembre en UTC).
const now = localDate(2026, 11, 5, 22, 0)

describe('"Mañana" en las pantallas (N3)', () => {
  it('reconoce el día siguiente en hora de Valledupar', () => {
    expect(isTomorrow(localDate(2026, 11, 6, 9, 30), now)).toBe(true)
    expect(isTomorrow(localDate(2026, 11, 5, 23, 0), now)).toBe(false)
    expect(isTomorrow(localDate(2026, 11, 7, 9, 0), now)).toBe(false)
  })

  it('lo dice en el chip y en las frases', () => {
    const manana = localDate(2026, 11, 6, 16, 0)
    expect(horaConDia(i18n('es'), manana, now)).toMatch(/^Mañana, 4:00/)
    expect(laHoraConDia(i18n('es'), manana, now)).toMatch(/^mañana a las 4:00/)
    expect(horaConDia(i18n('es'), localDate(2026, 11, 5, 16, 0), now)).toMatch(/^4:00/)
  })

  it('marcas cortas del deslizador: 6 a. m., 12 m., 6 p. m.', () => {
    expect([6, 12, 18].map((h) => marcaHora(i18n('es'), h * 60))).toEqual(['6 a. m.', '12 m.', '6 p. m.'])
    expect([6, 12, 18].map((h) => marcaHora(i18n('en'), h * 60))).toEqual(['6 AM', '12 PM', '6 PM'])
  })
})
