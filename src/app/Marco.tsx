import { Outlet } from 'react-router'
import s from './Marco.module.css'

/** Contenedor de las pantallas: ancho de celular, centrado en escritorio (máximo 430 px). */
export function Marco() {
  return (
    <div className={s.marco}>
      <Outlet />
    </div>
  )
}
