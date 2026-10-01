import { createBrowserRouter } from 'react-router'
import { Guia } from './guia/Guia'
import { Marco } from './Marco'
import { NoEncontrada } from './NoEncontrada'
import { PantallaPendiente } from './PantallaPendiente'
import { SCREENS } from './pantallas'

// La app puede publicarse en una subcarpeta (GitHub Pages, Fase 10): se respeta la base de Vite.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

export const router = createBrowserRouter(
  [
    // La guía de componentes usa todo el ancho, como la página 03 de Figma.
    { path: '/guia', element: <Guia /> },
    {
      element: <Marco />,
      children: [
        ...SCREENS.map((screen) => ({ path: screen.path, element: <PantallaPendiente screen={screen} /> })),
        { path: '*', element: <NoEncontrada /> },
      ],
    },
  ],
  { basename },
)
