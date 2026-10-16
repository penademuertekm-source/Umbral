import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ProveedorIdioma } from '../../i18n/ProveedorIdioma'
import { HojaInferior, type SheetHeight } from './HojaInferior'

function HojaConAltura({ initial }: { initial: SheetHeight }) {
  const [height, setHeight] = useState(initial)
  return (
    <HojaInferior open onClose={() => undefined} title="Calle 16" height={height} onHeightChange={setHeight}>
      <p>Contenido</p>
    </HojaInferior>
  )
}

function renderHoja(initial: SheetHeight = 'asomada') {
  render(
    <ProveedorIdioma>
      <HojaConAltura initial={initial} />
    </ProveedorIdioma>,
  )
  return () => screen.getByRole('dialog').getAttribute('data-altura')
}

describe('HojaInferior', () => {
  beforeEach(() => localStorage.setItem('umbral.idioma', 'es'))

  it('sin control de altura abre en media y el asa es decorativa', () => {
    render(
      <ProveedorIdioma>
        <HojaInferior open onClose={() => undefined} title="Calle 16">
          <p>Contenido</p>
        </HojaInferior>
      </ProveedorIdioma>,
    )
    expect(screen.getByRole('dialog').getAttribute('data-altura')).toBe('media')
    expect(screen.queryByRole('button', { name: 'Agrandar la hoja' })).toBeNull()
  })

  it('tocar el asa la agranda y desde completa vuelve a asomada', () => {
    const height = renderHoja()
    const tap = (name: string) => {
      const handle = screen.getByRole('button', { name })
      fireEvent.pointerDown(handle, { clientY: 100 })
      fireEvent.pointerUp(handle, { clientY: 102 })
    }
    tap('Agrandar la hoja')
    expect(height()).toBe('media')
    tap('Agrandar la hoja')
    expect(height()).toBe('completa')
    tap('Achicar la hoja')
    expect(height()).toBe('asomada')
  })

  it('deslizar el asa sube o baja un paso', () => {
    const height = renderHoja('media')
    const handle = screen.getByRole('button', { name: 'Agrandar la hoja' })
    fireEvent.pointerDown(handle, { clientY: 300 })
    fireEvent.pointerUp(handle, { clientY: 200 })
    expect(height()).toBe('completa')
    fireEvent.pointerDown(handle, { clientY: 200 })
    fireEvent.pointerUp(handle, { clientY: 300 })
    expect(height()).toBe('media')
  })

  it('con el teclado: flechas arriba y abajo', () => {
    const height = renderHoja()
    const handle = screen.getByRole('button', { name: 'Agrandar la hoja' })
    fireEvent.keyDown(handle, { key: 'ArrowUp' })
    expect(height()).toBe('media')
    fireEvent.keyDown(handle, { key: 'ArrowDown' })
    expect(height()).toBe('asomada')
  })
})
