import type { TranslationKey } from '../i18n/traducir'

export interface ScreenDef {
  /** Número de la pantalla en docs/especificacion-pantallas.md. */
  number: string
  nameKey: TranslationKey
  /** Ruta de la app (patrón de react-router). */
  path: string
  /** Ruta de ejemplo para enlazar desde /guia cuando la ruta lleva parámetros. */
  examplePath?: string
  figmaNode: string
  /** Fase de docs/PROMPTS.md en la que se construye. */
  phase: number
}

/** Última fase terminada (docs/PROMPTS.md): las pantallas de esta fase o anteriores ya están construidas. */
export const CURRENT_PHASE = 7

// Las 23 pantallas de la especificación. Las que aún no se construyen usan PantallaPendiente.
// La 08 se abrirá también con ?placa=<id> (Fase 8); la 17 es solo una referencia del semáforo.
export const SCREENS: readonly ScreenDef[] = [
  { number: '01', nameKey: 'pantallas.p01', path: '/', figmaNode: '2:2', phase: 8 },
  { number: '02', nameKey: 'pantallas.p02', path: '/idioma', figmaNode: '2:9', phase: 8 },
  { number: '03', nameKey: 'pantallas.p03', path: '/ubicacion', figmaNode: '2:19', phase: 8 },
  { number: '04', nameKey: 'pantallas.p04', path: '/mapa', figmaNode: '3:2', phase: 4 },
  { number: '05', nameKey: 'pantallas.p05', path: '/buscar', figmaNode: '4:2', phase: 6 },
  { number: '06', nameKey: 'pantallas.p06', path: '/rutas', figmaNode: '4:42', phase: 6 },
  { number: '07', nameKey: 'pantallas.p07', path: '/tramo/:id', examplePath: '/tramo/89', figmaNode: '5:2', phase: 4 },
  { number: '08', nameKey: 'pantallas.p08', path: '/qr/:id', examplePath: '/qr/calle-grande-cra7', figmaNode: '5:46', phase: 8 },
  { number: '09', nameKey: 'pantallas.p09', path: '/el-nino', figmaNode: '6:2', phase: 5 },
  { number: '10', nameKey: 'pantallas.p10', path: '/refugios', figmaNode: '6:21', phase: 7 },
  { number: '11', nameKey: 'pantallas.p11', path: '/ajustes', figmaNode: '7:2', phase: 9 },
  { number: '12', nameKey: 'pantallas.p12', path: '/placa/:id', examplePath: '/placa/calle-grande-cra7', figmaNode: '7:40', phase: 8 },
  { number: '13', nameKey: 'pantallas.p13', path: '/recorrido', figmaNode: '13:35', phase: 7 },
  { number: '14', nameKey: 'pantallas.p14', path: '/sin-conexion', figmaNode: '13:77', phase: 9 },
  { number: '15', nameKey: 'pantallas.p15', path: '/cuando-salir', figmaNode: '32:35', phase: 6 },
  { number: '16', nameKey: 'pantallas.p16', path: '/sin-ruta-con-sombra', figmaNode: '32:105', phase: 6 },
  { number: '17', nameKey: 'pantallas.p17', path: '/semaforo', figmaNode: '32:154', phase: 5 },
  { number: '18', nameKey: 'pantallas.p18', path: '/proteccion-solar', figmaNode: '34:35', phase: 7 },
  { number: '19', nameKey: 'pantallas.p19', path: '/aviso-calor', figmaNode: '34:111', phase: 7 },
  { number: '20', nameKey: 'pantallas.p20', path: '/mapa/nublado', figmaNode: '34:167', phase: 5 },
  { number: '21', nameKey: 'pantallas.p21', path: '/fuera-del-centro', figmaNode: '35:35', phase: 8 },
  { number: '22', nameKey: 'pantallas.p22', path: '/llegada', figmaNode: '35:84', phase: 7 },
  { number: '23', nameKey: 'pantallas.p23', path: '/ajustes/perfil-calor', figmaNode: '35:121', phase: 9 },
]
