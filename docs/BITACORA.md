# Bitácora · Umbral

Registro de lo hecho en cada fase, lo pendiente y las decisiones tomadas. La entrada más reciente va arriba.

---

## Fase 1 · Esqueleto y sistema visual en código (2026-10-01)

### Hecho

- **Proyecto**: Vite 8 + React 19 + TypeScript 6 con `strict` (en `tsconfig.app.json` y `tsconfig.node.json`).
  No se tocaron `design/`, `datos/`, `docs/` ni `CLAUDE.md`.
- **Fuentes locales**: `@fontsource/inter` (400, 500 y 600) y `@fontsource/archivo-black` (logotipo).
  No se usa Google Fonts en ejecución.
- **Tokens**: `design/tokens.css` se importa de forma global en `src/main.tsx`, antes de cualquier otro estilo.
  `src/estilos/global.css` define el fondo (`--um-base-fondo`), el foco visible, `.sr-only` y
  `prefers-reduced-motion`.
- **Componentes** en `src/componentes/` (CSS Modules, solo `var(--um-…)`; no hay colores hex en `src/`):
  - `Icono`: carga los 42 SVG de `design/iconos/` en el build (`import.meta.glob`, `?raw`) y usa `currentColor`.
    Los nombres están tipados (`IconName`).
  - `Boton`: primario, secundario y advertencia; 60 px de alto, radio 12.
  - `Semaforo` (chip) y `FormaSemaforo` (solo la forma): cómodo = círculo, precaución = triángulo,
    evitar = rombo, no recomendado = cuadrado, nublado = círculo gris.
  - `MuestraTramo`: sombra (continua), parcial (discontinua 18/8) y expuesto (ámbar con marca punteada 6/6).
  - `Marcador`: usuario, destino, refugio, agua, placa, arbol y grupo (40 px, elevación flotante).
  - `BarraSuperior`, `Encabezado`, `TarjetaOpcion`, `HojaInferior`, `Modal` y `Logotipo`.
- **i18n** en `src/i18n/`: `es.json`, `en.json`, `ProveedorIdioma` y el hook `useT()`.
  - Las claves están tipadas: una clave que no existe no compila.
  - Detecta el idioma con `navigator.languages`, permite cambiarlo y lo guarda en `localStorage` (`umbral.idioma`).
  - Actualiza `<html lang>`.
- **Enrutador** (react-router, `createBrowserRouter`): una ruta vacía por cada una de las 23 pantallas
  (`src/app/pantallas.ts`). Cada una muestra su número, su nodo de Figma y la fase en la que se construye.
  Hay una página 404 amable.
- **/guia**: página con todos los componentes y estados, en el mismo orden que la guía de estilo de Figma
  (nodo 44:41): principios, color (valores leídos en vivo de los tokens), tipografía, iconografía, semáforo
  (con la barra superior en cada estado, como la pantalla 17), mapa (tramos y marcadores), botones,
  componentes de pantalla (hoja inferior y modal funcionando), espaciado y elevación, íconos PWA y el índice
  de pantallas. Tiene un selector de idioma.
- **Pruebas** (vitest + jsdom + Testing Library): 16 pruebas en 3 archivos.
  - es/en tienen las mismas claves; la interpolación y la detección de idioma funcionan.
  - La lista de íconos coincide con `indice.json` y ningún SVG trae colores fijos.
  - Cada nivel del semáforo tiene su texto y su forma; los cuatro niveles de decisión no repiten forma.

### Rutas

| Pantalla | Ruta | Fase |
|---|---|---|
| 01 Splash | `/` | 8 |
| 02 Idioma | `/idioma` | 8 |
| 03 Permiso de ubicación | `/ubicacion` | 8 |
| 04 Mapa | `/mapa` | 4 |
| 05 Buscar destino | `/buscar` | 6 |
| 06 Comparación de rutas | `/rutas` | 6 |
| 07 Ficha de tramo | `/tramo/:id` | 4 |
| 08 Vista tras escanear el QR | `/qr/:id` (y `?placa=<id>` en la Fase 8) | 8 |
| 09 Alerta El Niño | `/el-nino` | 5 |
| 10 Puntos de permanencia | `/refugios` | 7 |
| 11 Ajustes | `/ajustes` | 9 |
| 12 Placa QR imprimible | `/placa/:id` | 8 |
| 13 Ruta en curso | `/recorrido` | 7 |
| 14 Sin conexión | `/sin-conexion` | 9 |
| 15 ¿Cuándo salir? | `/cuando-salir` | 6 |
| 16 Sin ruta con sombra | `/sin-ruta-con-sombra` | 6 |
| 17 Semáforo (referencia) | `/semaforo` | 5 |
| 18 Protección solar | `/proteccion-solar` | 7 |
| 19 Aviso antes de salir | `/aviso-calor` | 7 |
| 20 Mapa nublado | `/mapa/nublado` | 5 |
| 21 Fuera del Centro Histórico | `/fuera-del-centro` | 8 |
| 22 Llegada | `/llegada` | 7 |
| 23 Perfil de calor | `/ajustes/perfil-calor` | 9 |

### Decisiones

- **Enrutador con rutas reales (no hash)**. La Fase 10 ya prevé "un respaldo 404 para las rutas de la app"
  en GitHub Pages. El `basename` sale de `import.meta.env.BASE_URL`, así que publicar en `/umbral/` solo
  requiere ajustar `base` en `vite.config.ts`. El enlace `?placa=<id>` funciona igual con cualquier enrutador.
- **Nombres**: los componentes, carpetas y valores de dominio siguen la especificación (`Boton`, `Semaforo`,
  `comodo`, `no_recomendado`, `sombra`, `parcial`…). Las props, funciones y tipos van en inglés
  (`level`, `variant`, `ThermalLevel`, `SegmentState`), como pide la regla 7 de `CLAUDE.md`.
  Los vocabularios compartidos viven en `src/config/niveles.ts`.
- **Estilos de texto**: los componentes usan las clases `um-*` de `tokens.css` (`um-etiqueta`, `um-dato`…),
  así el modo "Texto grande" de la Fase 9 funciona sin tocar los componentes.
- **Archivo Black** se agregó con `@fontsource/archivo-black`. El prompt de la Fase 1 solo nombra Inter,
  pero `CLAUDE.md` exige Archivo Black en el logotipo y prohíbe Google Fonts en ejecución.
- **Idioma por defecto**: el primer idioma soportado de `navigator.languages`. Si el navegador pide otro
  idioma (francés, alemán…), se usa inglés, porque sirve más a los turistas extranjeros. Sin datos, español.
  Solo se guarda en `localStorage` cuando la persona elige; así la Fase 8 sabe si es el primer uso.
- **Modal** con `<dialog>` nativo (foco atrapado, Escape, devuelve el foco). El velo es el propio `<dialog>`
  y no `::backdrop`, porque en algunos navegadores `::backdrop` no hereda las variables CSS.
- **HojaInferior** no bloquea la pantalla (el mapa sigue visible detrás, como en la 07). Se cierra con
  Escape o con la ✕.
- **Figma**: se pidieron 5 capturas (`get_screenshot`) de los nodos 43:93 (botón), 43:42 (semáforo),
  43:55 (tramo), 43:86 (marcador) y 44:41 (guía de estilo). Con ellas se definió:
  - el botón de advertencia usa `--um-semaforo-evitar-fondo` y `--um-semaforo-evitar-texto`;
  - los textos de botones y chips van en semibold (600);
  - el marcador de árbol usa el fondo de "cómodo" con el ícono en verde.

### Pendiente o por revisar

- **Texto Micro de 13 px**: `tokens.css` (y la barra superior de Figma) usan 13 px, pero `CLAUDE.md` pide un
  texto mínimo de 15 px. Por ahora se respetan los tokens; revisarlo en la Fase 9 (accesibilidad).
  Propuesta: subir Micro a 15 px en Figma y en `tokens.css` a la vez.
- **Color del ícono en los marcadores blancos** (refugio, agua, placa): la captura no deja ver si es
  `--um-base-texto` o `--um-termico-sombra-plena`. Se usó `--um-base-texto`. Confirmarlo en Figma (nodo 43:86).
- **Íconos de la PWA**: `/guia` muestra el isotipo en negativo a cada tamaño; los archivos finales y la
  versión adaptable se generan en la Fase 9.
- **Versiones**: react-router 8 pide Node 22.22 o superior. Con Node LTS 24 no hay problema.
- `npm run datos` se agrega en la Fase 2.

---

## Fase 0 · Preparación (2026-10-01)

- Se descomprimió el kit (`CLAUDE.md`, `docs/`, `design/`, `datos/`) en la raíz del repositorio y se hizo
  el primer commit.
- El repositorio remoto ya existe en GitHub (`penademuertekm-source/Umbral`); el trabajo va en la rama
  `claude/inspiring-cannon-6rmgzq`.
