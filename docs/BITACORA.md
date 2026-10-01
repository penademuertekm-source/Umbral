# Bitácora · Umbral

Registro de lo hecho en cada fase, lo pendiente y las decisiones tomadas. La entrada más reciente va arriba.

---

## Fase 3 · Motor de sombra en el navegador (2026-10-01)

Plan aprobado por la autora el 2026-10-01.

### Hecho

- `src/config/umbrales.ts`: umbrales provisionales (sombra ≥ 70 %, parcial 30–70 %, expuesto < 30 %),
  meses sin hojas del cañaguate (1, 2, 3), paso de 5 min para "¿hasta cuándo?" y perfil de 6:00 a 18:00
  cada 15 min.
- `src/sombra/modelo.ts` (cálculo puro, sin DOM): posición del sol con SunCalc 2; un punto está en sombra
  si `elevación < horizonte[sector]` en algún canal activo; si la elevación es ≤ 0, "sin sol". Por lado de
  acera devuelve % de sombra, estado y canal principal (`edificio`, `arbol`, `mixto` o `ninguno`).
- `src/sombra/tiempo.ts`: hora de Valledupar (UTC−5 fijo). El cálculo y los textos usan esta hora aunque
  el teléfono esté en otra zona (probado con el navegador en hora de Madrid).
- `src/sombra/cargar.ts`: carga `muestras.json` y `muestras.bin.gz` y descomprime con `DecompressionStream`.
- `src/sombra/worker.ts`: Web Worker; carga los datos una sola vez, guarda en caché por cuarto de hora
  (hasta 200 resultados) y mide cada cálculo.
- `src/sombra/cliente.ts`: `motorSombra.calcular(fechaHora, opciones)`, `.sombraHasta(arista, lado, desde)`,
  `.perfilDelDia(arista, lado, fecha)` y `.lados()`. El resultado de `calcular` trae
  `.lado(arista, lado)` para leer un lado.
- `src/sombra/useSombra.ts`: hook `useSombra(fechaHora, temporada)`; mientras calcula una hora nueva
  conserva el resultado anterior (sin parpadeo).
- `/guia` → sección **Motor de sombra**: fecha, hora (6:00–18:00 cada 15 min), temporada de los
  cañaguates, conteo de lados en sombra/parcial/expuesto, sol estimado, tiempo de cálculo y un tramo de
  ejemplo con "Sombra plena hasta la…" y su perfil del día (49 barras con color según el estado y
  descripción accesible por barra). Textos en es/en.
- Pruebas: 29 en total (13 nuevas). Las tres que pide la fase (punto sin obstáculos, muro al oriente,
  cañaguate en febrero y agosto), más umbrales, temporada forzada, `sombraHasta`, `perfilDelDia`, agrupación
  de lados, hora de Valledupar y una con los datos reales de `public/datos`.

### Mediciones (meta: < 150 ms por cálculo en un celular medio)

| Dónde | Resultado |
|---|---|
| Node (prueba con datos reales, 49 horas del 15 de agosto) | promedio 1,1 ms, máximo 5,5 ms |
| Chromium con la CPU frenada 4× (build de producción, 6 horas) | 0,6–1,3 ms por cálculo |
| Primera carga en Chromium frenado 4× (página → primer resultado) | ~2 s, incluye bajar y descomprimir 1,4 MB |
| `sombraHasta` + `perfilDelDia` de un lado | 0,6 ms |

Con datos reales, el 15 de agosto: a las 12:00 hay 67 lados en sombra, 381 parciales y 556 expuestos; a las
16:00, 444 en sombra, 297 parciales y 263 expuestos (las fachadas dan sombra en la tarde, como se espera).

### Decisiones

- **Temporada**: `automatica` (cañaguates sin hojas en enero, febrero y marzo), `seca` (siempre sin hojas)
  y `lluvias` (siempre con hojas).
- **Caché por cuarto de hora**: `calcular` redondea la hora hacia abajo al cuarto de hora.
- **Canal principal**: si los edificios dan ≥ 70 % de la sombra del lado, `edificio`; si dan ≤ 30 %,
  `arbol`; si no, `mixto`. Cuando un punto tiene sombra de edificio y de árbol, cuenta como edificio.
- **`.gz` y servidores**: `vite preview` (y otros servidores) entregan el `.gz` con
  `Content-Encoding: gzip`, así que el navegador ya lo descomprime. El cargador revisa la firma gzip antes
  de descomprimir y funciona en los dos casos.
- **Nombres**: la API usa los nombres del prompt de la fase (`calcular`, `sombraHasta`, `perfilDelDia`,
  `useSombra`); lo interno va en inglés (regla 7).
- **TypeScript de pruebas**: `tsconfig.test.json` (con tipos de Node) para los `*.test.ts`; la app
  (`tsconfig.app.json`) no ve los tipos de Node.

### Pendiente

- La Fase 4 dibuja estos resultados en el mapa (`aceras.geojson` + `useSombra`).
- Los umbrales y los meses sin hojas siguen siendo provisionales.

---

## Fase 2 · Datos y modelo de sombra en Python (2026-10-01)

Plan aprobado por la autora el 2026-10-01. `public/datos/` ya tiene datos reales de OpenStreetMap.

### Resultado (`docs/reporte-datos.md`)

| Dato | Valor |
|---|---|
| Área de estudio | 700 m alrededor de la Plaza Alfonso López (10,47775, −73,24463) · 1,54 km² |
| Red peatonal | 502 aristas · 37,2 km de ejes · 1.004 lados de acera (240 norte, 240 sur, 262 oriental, 262 occidental) |
| Puntos de muestreo | 14.876 (1.403 acercados al eje porque caían en un edificio; 135 siguen dentro, 0,9 %) |
| Edificios | 1.986: 1.820 con `height` de OSM (1.457 de ellos con 3 m), 18 con pisos, 148 provisionales (3,5 m) |
| Árboles | 1.808: 258 de OSM y 1.550 provisionales (946 mango, 377 cañaguate, 485 otro) |
| Perfiles | `muestras.bin.gz` de 946 KB (3,1 MB sin comprimir) · meta < 2 MB: **cumple** |
| Validación del sol | SunCalc vs SPA del NREL: separación máxima de **0,075°** |
| Lugares | Destinos 2 de 5 con coordenadas · refugios 3 de 4 · placas 0 de 2 |
| Tiempo | ~2 min de descarga y 14 s de cálculo de perfiles (en paralelo) |

### Hecho

- `scripts/requirements.txt` y entorno virtual en `scripts/.venv` (ignorado por git, igual que
  `scripts/.cache/`).
- Comandos (Windows, macOS y Linux, gracias a `scripts/datos.mjs`):
  - `npm run datos:preparar`: crea `scripts/.venv` e instala las dependencias;
  - `npm run datos`: ejecuta `scripts/construir_datos.py` y regenera `public/datos/`;
  - `npm run datos -- --solo-validacion-sol`: solo la validación del sol (sin internet);
  - `npm run test:datos`: 18 pruebas del pipeline (unittest), todas sin red.
- **GitHub Actions · "Datos de sombra"** (`.github/workflows/datos.yml`): corre las pruebas y
  `npm run datos` en las máquinas de GitHub y hace commit de los datos en la rama. Para volver a
  generarlos (por ejemplo, con datos de campo): pestaña **Actions → Datos de sombra → Run workflow**.
- Módulos en `scripts/umbral_datos/`:
  - `area.py`: geocodifica la plaza y guarda `datos/provisional/area_estudio.geojson` (editable a mano).
  - `descarga_osm.py`: consultas propias a Overpass (rectángulo del área, recortado después al círculo),
    con caché en `scripts/.cache/overpass/`; osmnx solo lee el `.osm`.
  - `edificios.py`: altura desde `edificios_pisos.csv` → `height` → `building:levels` × 3,5 m → 3,5 m
    provisional; cada edificio guarda su `origen_altura`. Aleros desde `aleros.csv`.
  - `arboles.py`: `arboles.csv` → OSM → provisionales con semilla fija. El resultado quedó escrito en
    `datos/provisional/arboles.csv` y desde ahora se usa ese archivo tal cual.
  - `aceras.py`: dos aceras por arista con orientación cardinal y muestras cada 5 m.
  - `horizonte.py`: 72 sectores, 60 m, 3 canales, Uint8 en pasos de 0,5°, SVF; calcula en paralelo.
  - `lugares.py`, `exportar.py`, `reporte.py` y `validacion_sol.py`.

### Decisiones

- **Generación en GitHub Actions.** Las sesiones en la nube no llegaban a OpenStreetMap. Con los dominios
  ya permitidos, `overpass-api.de` igual corta las conexiones desde la nube; las máquinas de GitHub sí
  descargan bien.
- **Cliente propio de Overpass.** osmnx reintenta para siempre ante 429/504 (así se quedaron trabadas las
  dos primeras corridas, 21 y 10 min). Ahora hay 3 intentos por servidor y cambio automático entre
  `overpass-api.de`, `overpass.kumi.systems`, `overpass.private.coffee` y `maps.mail.ru`
  (variable `UMBRAL_OVERPASS` para cambiarlos). En la última corrida, `overpass-api.de` respondió 504/429
  y los datos salieron de `overpass.kumi.systems`.
- **`muestras.bin.gz` en lugar de `muestras.bin`.** La alternativa aprobada (guardar los árboles solo
  donde existen) no ahorraba nada: hay árboles a menos de 60 m del 100 % de las aceras. Con gzip los
  3,1 MB quedan en 946 KB sin perder datos. El índice (`muestras.json`) dice `"archivo"` y
  `"compresion": "gzip"`. El worker de la Fase 3 lo abre con `DecompressionStream("gzip")` (probado en
  Node con los datos reales).
- **SunCalc 2.x cambió su formato**: `getPosition` da el azimut en **grados desde el norte** (sentido
  horario) y la elevación **aparente** (con refracción), en grados. El worker de la Fase 3 debe usarlo así.
- **Perfil de horizonte por rayos**: 144 rayos (cada 2,5°) contra fachadas y copas, más los vértices de
  edificio; un punto bajo una copa o un alero queda con 90° en ese canal.
- **Geocodificación**: se ajustaron las consultas de la iglesia ("Inmaculada Concepción, Valledupar") y
  del Parque de la Leyenda para que coincidan con los nombres de OSM. Lo que no está en OSM queda vacío.
- **Archivos extra** en `public/datos/`: `aceras.geojson` (un trazo por lado de acera, para la Fase 4),
  `plazas.geojson` (mapa base) y `clima_config.json` (copia para la Fase 5).
- **Texto Micro**: sube a 15/20 px (decisión de la autora).

### Pendiente

- **Coordenadas de campo** (no están en OSM): Casa Beto Murgas, Mercado público y Callejón de la
  Purrututú (destino y refugio). Se escriben en `lat`/`lon` de `destinos.csv` y `refugios.csv`.
- **Parque de la Leyenda** quedó a 3 km del centro, fuera del área de estudio: decidir si sigue en la
  lista de refugios.
- **Placas QR**: ubicación de las dos placas (`placas_qr.csv`), necesaria en la Fase 8.
- **Revisar** los 1.550 árboles provisionales de `arboles.csv` y las alturas: 1.457 edificios tienen
  `height=3` en OSM (probablemente 1 piso, sin verificar).
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
