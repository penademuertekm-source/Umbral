import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/archivo-black/400.css'
import '../design/tokens.css'
import './estilos/global.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router/dom'
import { router } from './app/enrutador'
import { ProveedorIdioma } from './i18n/ProveedorIdioma'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProveedorIdioma>
      <RouterProvider router={router} />
    </ProveedorIdioma>
  </StrictMode>,
)
