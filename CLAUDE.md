# Umbral · Mapa Isocrónico de Sombras (prototipo web)

Este archivo es la memoria del proyecto para Claude Code. Léelo completo al empezar cada sesión.

## Qué es

**Umbral** es una aplicación web (PWA) bilingüe (español/inglés) que muestra qué andenes del
Centro Histórico de Valledupar (Cesar, Colombia) están en sombra a cada hora. También sugiere rutas
con menos sol, recomienda a qué hora salir y advierte cuándo no conviene caminar.

Es el prototipo funcional del proyecto de investigación-creación *"Diseño de un Mapa Isocrónico
de Sombras para el Bienestar Térmico Peatonal en el Centro Histórico de Valledupar"*
(Diseño Gráfico, Fundación Universitaria del Areandina). Los usuarios son residentes, trabajadores
y turistas nacionales y extranjeros que llegan sin conocer la ciudad.

El enfoque es "tiempo real predictivo": **no hay sensores**. La sombra se calcula con la hora
del teléfono, la posición del sol y un modelo 3D simplificado del centro (edificios, aleros y
árboles).

## Fuente de verdad del diseño

- Tokens: `design/tokens.css`. Úsalos siempre con `var(--um-…)`. **Nunca escribas colores
  hex sueltos en componentes.**
- Íconos: `design/iconos/<categoría>/<nombre>.svg` (24 px, trazo 2, `currentColor`).
  Índice en `design/iconos/indice.json`.
- Marca: `design/marca/isotipo-*.svg`. El logotipo "umbral" va siempre en minúscula, con Archivo Black.
- Pantallas: `docs/especificacion-pantallas.md` (23 pantallas, con el enlace al nodo de Figma).
- Figma: https://www.figma.com/design/AYqMU7Zqwegk1SGgZFJqTX
  Página "02 · Pantallas" (wireframes de alta fidelidad) y página "03 · Iconografía y estilo gráfico"
  (guía de estilo y componentes). Si el servidor MCP de Figma está conectado, úsalo **solo** para
  mirar una pantalla concreta cuando la especificación no alcance. Pide una captura con
  `get_screenshot` por nodo y nunca recorras el archivo entero, porque las consultas son limitadas.

## Arquitectura (Nivel B: sin servidor)

```
datos/provisional/*.csv ─┐
OpenStreetMap ───────────┼─▶ scripts/ (Python, se ejecuta a mano) ─▶ public/datos/*
                         │     · red peatonal con aceras a ambos lados
                         │     · puntos de muestreo cada 5 m
                         │     · perfiles de horizonte por punto
                         │     · validación del sol: SunCalc vs SPA del NREL (pvlib)
                         ┘
public/datos/* ─▶ app web (Vite + React + TypeScript)
                    · Web Worker: posición del sol (SunCalc) + perfiles → % de sombra por tramo y acera
                    · MapLibre GL JS con mapa base propio (GeoJSON local)
                    · ruteo e isócronas en el navegador
                    · Open-Meteo (clima) → UTCI estimado → semáforo
                    · PWA: funciona sin conexión salvo el clima
```

### Modelo de sombra (decisión clave)

- Cada punto de muestreo de acera guarda un **perfil de horizonte**: 72 sectores de azimut de 5°.
  Cada sector tiene el ángulo de elevación máximo que bloquea el cielo, en tres canales:
  1. `edificios` (incluye aleros)
  2. `arboles_perennes` (mango y otros)
  3. `arboles_caducifolios` (cañaguate; sin hojas en `meses_sin_hojas`)
- Un punto está en sombra si `elevación_sol < horizonte[sector_del_azimut_del_sol]` en algún canal
  activo. Si la elevación del sol es ≤ 0, el punto queda "sin sol".
- Codificación: `Uint8` con el ángulo en pasos de 0,5° (0–180). Archivo binario + índice JSON.
- El **Sky View Factor (SVF)** de cada punto se deriva del mismo perfil.
- Copas de árbol: un cilindro entre `altura_fuste_m` y `altura_m` con radio `diametro_copa_m/2`.
- Clasificación de tramo: sombra ≥ 70 % · parcial 30–70 % · expuesto < 30 %. Los umbrales
  viven en `src/config/umbrales.ts` y son **provisionales**.

### Semáforo térmico

Reglas en `src/config/reglas-semaforo.ts`. Son provisionales y deben ser fáciles de editar.

- Categorías UTCI: sin estrés < 26 · moderado 26–32 · fuerte 32–38 · muy fuerte 38–46 · extremo > 46 (°C).
- Niveles de la interfaz: `comodo`, `precaucion`, `evitar`, `no_recomendado`, más el estado `nublado`.
  Cada nivel tiene token de fondo, texto y forma, y una **forma propia**: círculo, triángulo,
  rombo y cuadrado. Nunca se distinguen solo por color.
- Entradas: UTCI estimado al sol y a la sombra, minutos al sol de la ruta, hora, nubosidad,
  `el_nino_activo` y el perfil de calor del usuario. El perfil vulnerable endurece un nivel.

## Pila técnica

- Vite + React + TypeScript (estricto). Sin framework de CSS: CSS Modules con `design/tokens.css`.
- MapLibre GL JS. Mapa base dibujado con capas GeoJSON locales (manzanas, calles, plazas),
  para que funcione sin conexión y respete los tokens. Fuera del centro (pantalla 21) se puede
  usar OpenFreeMap si hay conexión.
- `suncalc` (posición del sol), `@turf/turf` (geometría) y Dijkstra propio o `ngraph.path` (rutas).
- UTCI: `jsthermalcomfort` si cubre UTCI y la ganancia solar (SolarCal); si no, una implementación
  propia documentada. Todo resultado se rotula "estimado".
- `vite-plugin-pwa` (service worker) y `@fontsource/inter` (fuente local, sin Google Fonts en ejecución).
- Python 3 en `scripts/`: `osmnx`, `geopandas`, `shapely`, `pvlib`, `numpy`. Dependencias en
  `scripts/requirements.txt` y entorno virtual en `scripts/.venv` (no se sube a git).
- Pruebas: `vitest` para la lógica (sombra, rutas, semáforo).
- Publicación: GitHub Pages con GitHub Actions. Debe ser HTTPS, porque el GPS solo funciona así.

## Estructura de carpetas

```
design/            tokens, íconos, marca (NO editar salvo pedido explícito)
datos/provisional/ entradas editables a mano (CSV/JSON)
scripts/           pipeline Python → public/datos/
public/datos/      salidas generadas (no editar a mano)
src/
  app/             rutas/pantallas
  componentes/     Boton, Semaforo, Tramo, Marcador, Icono, HojaInferior, Modal, BarraSuperior…
  mapa/            capas MapLibre
  sombra/          worker + cálculo
  rutas/           grafo, Dijkstra, isócronas, "¿cuándo salir?"
  clima/           Open-Meteo, UTCI, semáforo
  i18n/            es.json, en.json
  config/          umbrales, reglas, constantes
docs/              especificación, prompts por fases, reportes de validación
```

## Reglas del proyecto

1. **Honestidad del dato.**
   - Todo valor calculado dice "estimado" y muestra su hora.
   - Mientras haya datos provisionales en uso, se ve el aviso "Datos provisionales".
   - Nunca presentes datos inventados como medidos.
   - El GPS no detecta la acera: la app recomienda la acera, pero no la verifica.
2. **Privacidad.** Sin backend, sin analítica y sin guardar el recorrido. La ubicación se usa solo
   en el dispositivo. Los ajustes se guardan en `localStorage`.
3. **Accesibilidad (WCAG 2.1 AA).**
   - Contraste AA, nada se distingue solo por color.
   - Texto mínimo de 15 px; botones de 60 px de alto; área táctil ≥ 56 px.
   - Respetar `prefers-reduced-motion`, usar etiquetas ARIA y `lang` correcto.
4. **Bilingüe.** Todo texto visible sale de `src/i18n/*.json`. Nada de textos sueltos en componentes.
5. **Sin claves ni secretos.** Open-Meteo y OpenStreetMap no requieren clave. No uses ShadeMap
   ni Shadowmap. Si hace falta una clave, detente y pregunta.
6. **Licencias.** Usa librerías por npm o pip. No copies código de repositorios con licencia GPL/AGPL.
   Atribución visible: "© colaboradores de OpenStreetMap" y "Clima: Open-Meteo".
7. **Identificadores de código en inglés**, comentarios y documentación en español.

## Forma de trabajo (plan Pro: el uso es limitado)

- Trabaja **solo la fase pedida** (ver `docs/PROMPTS.md`). No adelantes fases.
- Antes de cambios grandes, muestra un plan corto y espera confirmación.
- Lee solo los archivos necesarios. No recorras `node_modules`, `public/datos` ni `.venv`.
- Al terminar una fase:
  1. corre `npm run build` y las pruebas,
  2. actualiza `docs/BITACORA.md` con lo hecho, lo pendiente y las decisiones,
  3. haz un commit `Fase N: <resumen>`,
  4. termina con una lista de "cómo probarlo" en tres pasos.
- Si algo no se puede hacer como dice este archivo, explícalo y propone una alternativa. No improvises en silencio.

## Comandos

- `npm run dev`: servidor local (en el celular: `npm run dev -- --host`, misma red wifi).
- `npm run build` y `npm run preview`.
- `npm test`: pruebas con vitest.
- `npm run datos`: ejecuta `scripts/construir_datos.py` y regenera `public/datos/`.
