import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProveedorIdioma } from '../../i18n/ProveedorIdioma'
import { Aviso, type NoticeItem } from './Aviso'

const NOTICES: NoticeItem[] = [
  { id: 'calor', level: 'alerta', title: 'Calor extremo', detail: 'Mejor sal más tarde' },
  { id: 'tramo', level: 'aviso', title: 'Tramo al sol' },
  { id: 'nube', level: 'nublado', title: 'Está nublado' },
]

function renderAviso(notices = NOTICES) {
  return render(
    <ProveedorIdioma>
      <Aviso notices={notices} />
    </ProveedorIdioma>,
  )
}

describe('Aviso', () => {
  beforeEach(() => localStorage.setItem('umbral.idioma', 'es'))

  it('muestra un aviso a la vez, con el contador de los demás', () => {
    renderAviso()
    expect(screen.getByText('Calor extremo')).toBeTruthy()
    expect(screen.queryByText('Tramo al sol')).toBeNull()
    expect(screen.getByRole('button', { name: 'Ver 2 avisos más' }).textContent).toBe('+2')
  })

  it('el contador abre todos los avisos', () => {
    renderAviso()
    fireEvent.click(screen.getByRole('button', { name: 'Ver 2 avisos más' }))
    for (const notice of NOTICES) expect(screen.getByText(notice.title)).toBeTruthy()
  })

  it('al recogerlo pasa al siguiente y, leídos todos, queda un chip que lo vuelve a abrir', () => {
    renderAviso(NOTICES.slice(0, 2))
    fireEvent.click(screen.getByRole('button', { name: 'Recoger aviso' }))
    expect(screen.getByText('Tramo al sol')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Recoger aviso' }))
    // Recogido: el primero sigue a la vista en su chip, sin el detalle.
    const chip = screen.getByRole('button', { name: 'Calor extremo' })
    expect(screen.queryByText('Mejor sal más tarde')).toBeNull()
    fireEvent.click(chip)
    expect(screen.getByText('Mejor sal más tarde')).toBeTruthy()
  })

  it('sin avisos no dibuja nada', () => {
    const { container } = renderAviso([])
    expect(container.textContent).toBe('')
  })

  it('muestra la acción del aviso y la ejecuta', () => {
    const onClick = vi.fn()
    renderAviso([{ id: 'salida', level: 'aviso', title: 'Es hora de salir', action: { label: 'Ver la ruta', onClick } }])
    fireEvent.click(screen.getByRole('button', { name: 'Ver la ruta' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
