import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import indice from '../../../design/iconos/indice.json'
import { Icono } from './Icono'
import { ICON_NAMES } from './nombres'
import { ICON_SVGS } from './svgs'

describe('Icono', () => {
  it('la lista de nombres coincide con design/iconos/indice.json', () => {
    expect([...ICON_NAMES]).toEqual(Object.values(indice).flat())
    expect(ICON_NAMES).toHaveLength(42)
  })

  it('cada nombre tiene su SVG y usa currentColor (sin colores fijos)', () => {
    for (const name of ICON_NAMES) {
      const markup = ICON_SVGS[name]
      expect(markup, name).toBeTruthy()
      expect(markup, name).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    }
  })

  it('es decorativo sin etiqueta y accesible con etiqueta', () => {
    const { container, rerender } = render(<Icono name="mango" />)
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    expect(svg.innerHTML).toContain('circle')

    rerender(<Icono name="mango" label="Mango" />)
    expect(svg.getAttribute('role')).toBe('img')
    expect(svg.getAttribute('aria-label')).toBe('Mango')
  })
})
