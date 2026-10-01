import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { THERMAL_LEVELS } from '../../config/niveles'
import { ProveedorIdioma } from '../../i18n/ProveedorIdioma'
import { Semaforo } from './Semaforo'

const EXPECTED = {
  comodo: ['Cómodo', 'circulo'],
  precaucion: ['Precaución', 'triangulo'],
  evitar: ['Evitar a pie', 'rombo'],
  no_recomendado: ['No recomendado', 'cuadrado'],
  nublado: ['Nublado', 'circulo'],
} as const

describe('Semaforo', () => {
  beforeEach(() => localStorage.setItem('umbral.idioma', 'es'))

  it.each(THERMAL_LEVELS)('el nivel %s tiene texto y forma propios', (level) => {
    const { container } = render(
      <ProveedorIdioma>
        <Semaforo level={level} />
      </ProveedorIdioma>,
    )
    const [text, shape] = EXPECTED[level]
    expect(screen.getByText(text)).toBeTruthy()
    expect(container.querySelector('[data-forma]')?.getAttribute('data-forma')).toBe(shape)
  })

  it('los cuatro niveles de decisión no repiten forma', () => {
    const shapes = THERMAL_LEVELS.filter((level) => level !== 'nublado').map((level) => EXPECTED[level][1])
    expect(new Set(shapes).size).toBe(4)
  })

  it('cambia de idioma', () => {
    localStorage.setItem('umbral.idioma', 'en')
    render(
      <ProveedorIdioma>
        <Semaforo level="evitar" />
      </ProveedorIdioma>,
    )
    expect(screen.getByText('Avoid walking')).toBeTruthy()
    expect(document.documentElement.lang).toBe('en')
  })
})
