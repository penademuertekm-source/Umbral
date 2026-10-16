import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProveedorIdioma } from '../../i18n/ProveedorIdioma'
import { addPlace, deleteMyData, MAX_PLACES, readProfile } from '../../perfil/almacen'
import { HojaEditarLugar, HojaGuardarLugar } from './HojasLugar'

function renderIn(node: React.ReactNode) {
  return render(
    <ProveedorIdioma>
      <MemoryRouter>{node}</MemoryRouter>
    </ProveedorIdioma>,
  )
}

describe('hojas de Mis lugares', () => {
  beforeEach(() => {
    localStorage.setItem('umbral.idioma', 'es')
    deleteMyData()
  })

  it('"Guardar este lugar" trae el nombre real y los chips lo cambian', () => {
    const onSaved = vi.fn()
    renderIn(<HojaGuardarLugar destinationId="plaza" realName="Plaza Alfonso López" onClose={() => {}} onSaved={onSaved} />)
    const field = screen.getByRole('textbox', { name: 'Nombre' }) as HTMLInputElement
    expect(field.value).toBe('Plaza Alfonso López')
    fireEvent.click(screen.getByRole('button', { name: 'Trabajo' }))
    expect(field.value).toBe('Trabajo')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(onSaved).toHaveBeenCalledOnce()
    expect(readProfile().places.map((p) => [p.name, p.destinationId])).toEqual([['Trabajo', 'plaza']])
  })

  it('no guarda un nombre vacío y lo dice', () => {
    renderIn(<HojaGuardarLugar destinationId="plaza" realName="Plaza" onClose={() => {}} onSaved={() => {}} />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), { target: { value: '  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByText('Escribe un nombre para el lugar.')).toBeTruthy()
    expect(readProfile().places).toEqual([])
  })

  it('con la lista llena pide borrar uno', () => {
    for (let i = 0; i < MAX_PLACES; i++) addPlace(`Lugar ${i}`, `d${i}`)
    renderIn(<HojaGuardarLugar destinationId="plaza" realName="Plaza" onClose={() => {}} onSaved={() => {}} />)
    expect(screen.getByText(/Borra uno en Mis lugares/)).toBeTruthy()
    expect(screen.queryByRole('textbox')).toBeNull()
  })

  it('"Editar lugar" cambia el nombre y borra sin preguntar', () => {
    const added = addPlace('Casa', 'plaza')
    if (!added.ok) throw new Error('no se guardó')
    const onRemoved = vi.fn()
    const { unmount } = renderIn(
      <HojaEditarLugar place={added.place} detail="Plaza · 190 m" onClose={() => {}} onRemoved={onRemoved} />,
    )
    fireEvent.change(screen.getByRole('textbox', { name: 'Nombre' }), { target: { value: 'Mi casa' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(readProfile().places[0].name).toBe('Mi casa')
    unmount()

    renderIn(<HojaEditarLugar place={readProfile().places[0]} detail="" onClose={() => {}} onRemoved={onRemoved} />)
    fireEvent.click(screen.getByRole('button', { name: 'Borrar este lugar' }))
    expect(onRemoved).toHaveBeenCalledWith({ place: expect.objectContaining({ name: 'Mi casa' }), index: 0 })
    expect(readProfile().places).toEqual([])
  })
})
