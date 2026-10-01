# Bitácora · Umbral

Registro de lo hecho en cada fase, lo pendiente y las decisiones tomadas. La entrada más reciente va arriba.

---

## Fase 2 · Datos y modelo de sombra en Python (en curso, 2026-10-01)

Plan aprobado por la autora el 2026-10-01. **Falta correr el pipeline con OpenStreetMap real**: la red
de este entorno bloquea `nominatim.openstreetmap.org` y `overpass-api.de` (y `api.open-meteo.com`, que se
usará en la Fase 5). La autora los está habilitando en la configuración del entorno.

### Hecho

- `scripts/requirements.txt` (osmnx, geopandas, shapely, pyproj, pandas, numpy, scipy, pvlib, requests)
  y entorno virtual en `scripts/.venv` (ignorado por git, igual que `scripts/.cache/`).
- Comandos (funcionan en Windows, macOS y Linux gracias a `scripts/datos.mjs`):
  - `npm run datos:preparar`: crea `scripts/.venv` e instala las dependencias;
  - `npm run datos`: ejecuta `scripts/construir_datos.py` y regenera `public/datos/`;
  - `npm run datos -- --solo-validacion-sol`: solo la validación del sol (sin internet);
  - `npm run test:datos`: 12 pruebas del pipeline (unittest).
- Módulos en `scripts/umbral_datos/`:
  - `area.py`: geocodifica la Plaza Alfonso López, toma 700 m y guarda `area_estudio.geojson`; si el
    archivo ya existe, no vuelve a geocodificar.
  - `descarga_osm.py`: calles sin autopistas, edificios, árboles y plazas. Los obstáculos se descargan con
    60 m de margen para que las aceras del borde reciban la sombra de lo que está justo afuera.
  - `edificios.py`: altura desde `edificios_pisos.csv` → `height` de OSM → `building:levels` × 3,5 m →
    3,5 m provisional. Cada edificio guarda su `origen_altura`. Aleros desde `aleros.csv`.
  - `arboles.py`: `arboles.csv` → OSM → provisionales con semilla fija (60 % mango, 25 % cañaguate,
    15 % otro; 40 % de los lados de acera, cada 12–25 m; rejilla de 10 m en plazas). Escribe el resultado
    en `arboles.csv` para revisarlo a mano.
  - `aceras.py`: dos aceras por arista, desplazadas según el tipo de vía, con orientación cardinal
    (norte/sur/oriental/occidental). Muestras cada 5 m; si una cae dentro de un edificio, se acerca al eje.
  - `horizonte.py`: perfil de 72 sectores, 60 m, 3 canales, Uint8 en pasos de 0,5°, y SVF.
  - `lugares.py`: destinos y refugios geocodificados (el resultado se guarda en su CSV); si no aparecen,
    quedan vacíos y se reportan. Las placas no se geocodifican.
  - `exportar.py`, `reporte.py` y `validacion_sol.py`.
- **Validación del sol** (`docs/validacion-sol.md`): SunCalc frente al SPA del NREL, día 15 de cada mes,
  de 6:00 a 18:00. Separación angular máxima de **0,075°**.
- Prueba de punta a punta con una cuadrícula sintética: genera los 13 archivos de `public/datos/` sin red.

### Decisiones

- **SunCalc 2.x cambió su formato**: `getPosition` da el azimut en **grados desde el norte** (sentido
  horario) y la elevación **aparente** (con refracción), también en grados. Antes eran radianes con el
  azimut desde el sur. El worker de la Fase 3 debe usar este formato.
- **Perfil de horizonte por rayos**: 144 rayos (cada 2,5°) contra los segmentos de fachada (cortados a 5 m)
  y las copas; cada sector toma el máximo de sus rayos y de los vértices de edificio que caen en él.
- **Modelo de copas**: se guarda solo el borde superior (como pide CLAUDE.md). Un punto bajo una copa o un
  alero queda con 90° en ese canal: siempre en sombra de ese objeto.
- **Archivos extra** en `public/datos/`: `aceras.geojson` (una línea por lado de acera, para dibujar los
  tramos en la Fase 4), `plazas.geojson` (mapa base) y `clima_config.json` (copia para la Fase 5).
- **Formato de `muestras.bin`**: `n × 3 × 72` bytes en orden muestra → canal → sector. `muestras.json`
  guarda los parámetros y, por columnas, `lon`, `lat`, `arista`, `lado` y `svf`.
- **Texto Micro**: sube a 15/20 px (decisión de la autora).

### Pendiente

- Correr `npm run datos` con OSM real, revisar `docs/reporte-datos.md` (meta: `muestras.bin` < 2 MB) y
  hacer el commit "Fase 2".
- Si `muestras.bin` pasa de 2 MB: guardar los canales de árboles solo para los puntos que los tienen.
- Actualizar en Figma el estilo "Micro / 13 Medium" a 15/20 px.

---

## Fase 1 · Revisión contra Figma (2026-10-01)

Se corroboró la página 03 de Figma (nodo 42:26) con `get_variable_defs` (44:41), `get_design_context`
(43:42, 43:55, 43:86, 43:93, 44:225, 45:54 y 45:225), `get_metadata` (42:26) y una captura (42:31).

- **Tokens**: los 32 colores, las 3 elevaciones y los 8 estilos de texto coinciden con `design/tokens.css`.
- **Botón y chip del semáforo**: coinciden (60 px, radio 12, Semi Bold 17/25; chip 40 px, padding 10/14).
- **Corregido**:
  - `MuestraTramo`: caja de 56 × 12 px con barra de 8 px. Parcial = tres guiones de 14 px separados 6 px;
    expuesto = cuatro marcas de 6 × 2 px. (El patrón 18/8 de la especificación queda para las líneas del
    mapa, Fase 4.)
  - `FormaSemaforo`: formas de 12 px exactas (triángulo regular inscrito, cuadrado con radio 1).
  - `Marcador`: borde de 1 px `--um-base-borde` en refugio, agua, placa y árbol; borde blanco de 3 px en
    destino y grupo. El ícono de los marcadores blancos queda en `base/texto`, el color por defecto de los
    íconos según Figma.
  - Display y Dato llevan un espaciado de letras de -1,5 % en Figma (Dato: -0,42 px). `tokens.css` no lo
    trae; se agregó en `src/estilos/global.css` para no editar `design/`.
  - `/guia`: mismos nombres de muestra que Figma (cómodo/fondo, vía-neutra…), hex en mayúsculas,
    catálogo "Componentes · Íconos" con celdas de 108 × 84 y nombres legibles (nuevas claves `iconos.*`),
    panel de tintes del nodo 45:54 y los íconos PWA con fondo verde, radio del 22 %, isotipo al 56 % y
    zona segura del 80 %.
- **Sin resolver**: el marcador de usuario en Figma es una imagen (punto azul con halo); se mantiene la
  versión en CSS con `--um-mapa-usuario`.

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

- ~~Texto Micro de 13 px~~: decidido con la autora el 2026-10-01. Micro sube a 15/20 px en `tokens.css`;
  falta actualizar el estilo "Micro / 13 Medium" en Figma para que sigan iguales.
- ~~Color del ícono en los marcadores blancos~~: resuelto en la revisión contra Figma (`base/texto`).
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
