import type { ReactNode } from 'react'
import { createBrowserRouter } from 'react-router'
import { Guia } from './guia/Guia'
import { RutaMapa, TramoEnMapa } from './mapa/rutas'
import { Marco } from './Marco'
import { NoEncontrada } from './NoEncontrada'
import { PantallaPendiente } from './PantallaPendiente'
import { SCREENS } from './pantallas'

// La app puede publicarse en una subcarpeta (GitHub Pages, Fase 10): se respeta la base de Vite.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

/** Pantallas ya construidas; el resto muestra PantallaPendiente. */
const BUILT: Record<string, ReactNode> = {
  '/mapa': <RutaMapa />,
  '/tramo/:id': <TramoEnMapa />,
}

export const router = createBrowserRouter(
  [
    // La guía de componentes usa todo el ancho, como la página 03 de Figma.
    { path: '/guia', element: <Guia /> },
    {
      element: <Marco />,
      children: [
        ...SCREENS.map((screen) => ({
          path: screen.path,
          element: BUILT[screen.path] ?? <PantallaPendiente screen={screen} />,
        })),
        { path: '*', element: <NoEncontrada /> },
      ],
    },
  ],
  { basename },
)
