import type { ReactNode } from 'react'
import { createBrowserRouter } from 'react-router'
import { PantallaElNino } from './elnino/PantallaElNino'
import { ErrorPantalla } from './ErrorPantalla'
import { Guia } from './guia/Guia'
import { RutaMapa, RutaMapaNublado, TramoEnMapa } from './mapa/rutas'
import { Marco } from './Marco'
import { NoEncontrada } from './NoEncontrada'
import { PantallaPendiente } from './PantallaPendiente'
import { SinConexion } from './SinConexion'
import { Ajustes } from './ajustes/Ajustes'
import { PerfilCalor } from './ajustes/PerfilCalor'
import { FueraDelCentro } from './entrada/FueraDelCentro'
import { Idioma } from './entrada/Idioma'
import { Inicio } from './entrada/Inicio'
import { Ubicacion } from './entrada/Ubicacion'
import { PantallaAvisoCalor, PantallaProteccionSolar } from './recorrido/PantallasEjemplo'
import { RutaLlegada, RutaRecorrido, RutaRefugios } from './recorrido/rutas'
import { RutaBuscar, RutaComparacion, RutaCuandoSalir, RutaSinSombra } from './rutas/rutas'
import { SCREENS } from './pantallas'
import { Acerca, ComoLeer, ComoSeCalcula } from './perfil/PaginasInfo'
import { Album } from './perfil/colecciones/Album'
import { Pasaporte } from './perfil/colecciones/Pasaporte'
import { Logros } from './perfil/logros/Logros'
import { Premios } from './perfil/premios/Premios'
import { MisLugares } from './perfil/MisLugares'
import { Perfil } from './perfil/Perfil'
import { MisSalidas } from './perfil/salidas/MisSalidas'
import { PlanearSalida } from './perfil/salidas/PlanearSalida'
import { TuSalida } from './perfil/salidas/TuSalida'
import { ReferenciaSemaforo } from './semaforo/ReferenciaSemaforo'

// La app puede publicarse en una subcarpeta (GitHub Pages, Fase 10): se respeta la base de Vite.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

/** Pantallas ya construidas; el resto muestra PantallaPendiente. */
const BUILT: Record<string, ReactNode> = {
  '/': <Inicio />,
  '/idioma': <Idioma />,
  '/ubicacion': <Ubicacion />,
  '/fuera-del-centro': <FueraDelCentro />,
  '/ajustes': <Ajustes />,
  '/ajustes/perfil-calor': <PerfilCalor />,
  '/sin-conexion': <SinConexion />,
  '/mapa': <RutaMapa />,
  '/tramo/:id': <TramoEnMapa />,
  '/el-nino': <PantallaElNino />,
  '/semaforo': <ReferenciaSemaforo />,
  '/mapa/nublado': <RutaMapaNublado />,
  '/buscar': <RutaBuscar />,
  '/rutas': <RutaComparacion />,
  '/cuando-salir': <RutaCuandoSalir />,
  '/sin-ruta-con-sombra': <RutaSinSombra />,
  '/aviso-calor': <PantallaAvisoCalor />,
  '/proteccion-solar': <PantallaProteccionSolar />,
  '/recorrido': <RutaRecorrido />,
  '/llegada': <RutaLlegada />,
  '/refugios': <RutaRefugios />,
}

export const router = createBrowserRouter(
  [
    // La guía de componentes usa todo el ancho, como la página 03 de Figma.
    { path: '/guia', element: <Guia />, errorElement: <ErrorPantalla /> },
    {
      element: <Marco />,
      errorElement: <ErrorPantalla />,
      children: [
        ...SCREENS.map((screen) => ({
          path: screen.path,
          element: BUILT[screen.path] ?? <PantallaPendiente screen={screen} />,
        })),
        // Perfil (S0 y S1): no son pantallas numeradas de la especificación original.
        { path: '/perfil', element: <Perfil /> },
        { path: '/perfil/lugares', element: <MisLugares /> },
        { path: '/perfil/logros', element: <Logros /> },
        { path: '/perfil/pasaporte', element: <Pasaporte /> },
        { path: '/perfil/album', element: <Album /> },
        { path: '/perfil/premios', element: <Premios /> },
        { path: '/perfil/salidas', element: <MisSalidas /> },
        { path: '/perfil/salidas/nueva', element: <PlanearSalida /> },
        { path: '/perfil/salidas/tu-salida', element: <TuSalida /> },
        { path: '/perfil/como-leer', element: <ComoLeer /> },
        { path: '/perfil/como-se-calcula', element: <ComoSeCalcula /> },
        { path: '/perfil/acerca', element: <Acerca /> },
        { path: '*', element: <NoEncontrada /> },
      ],
    },
  ],
  { basename },
)
