<p align="center">
  <img src="design/marca/isotipo-positivo.svg" width="72" height="72" alt="">
</p>

# umbral

**Mapa isocrónico de sombras del Centro Histórico de Valledupar.** Umbral es una aplicación web (PWA)
bilingüe, en español e inglés, que muestra qué andenes están en sombra a cada hora. También sugiere rutas
con menos sol, recomienda a qué hora salir y advierte cuándo no conviene caminar.

**Pruébala:** https://penademuertekm-source.github.io/Umbral/

> Prototipo de investigación-creación. Los valores son **estimados** y parte de los datos son
> **provisionales**, mientras llega el levantamiento de campo. La app lo indica en pantalla.

## Qué hace

- **Mapa de sombra** por lado de acera, de 6 a. m. a 6 p. m., con un deslizador para ver otras horas.
- **Ficha de cada tramo**: qué acera protege, hasta qué hora hay sombra y qué árboles la dan.
- **Semáforo térmico**: el UTCI estimado al sol y a la sombra con el clima de Open-Meteo, con cinco
  estados (cómodo, precaución, evitar, no recomendado y nublado), cada uno con forma propia.
- **Rutas con sombra** frente a la más corta, **"¿cuándo salir?"** e **isócronas** de 5, 10 y 15 minutos.
- **Recorrido guiado** con GPS o en modo simulación, avisos antes de salir y llegada con "¿Te sirvió esta
  ruta?".
- **Puntos de permanencia** (refugios), **ajustes de accesibilidad** (texto grande, alto contraste) y
  **perfil de calor**.
- **Funciona sin conexión** después de la primera visita; solo el clima necesita internet.

## Cómo funciona

No hay sensores. La sombra se calcula **en el teléfono** con tres datos:

1. la hora del teléfono;
2. la posición del sol (SunCalc, validado contra el algoritmo SPA del NREL: `docs/validacion-sol.md`);
3. un modelo 3D simplificado del centro (edificios, aleros y árboles).

Cada punto de la acera guarda un **perfil de horizonte**: qué tan alto tapa el cielo en 72 direcciones.
Un punto está en sombra si el sol está más bajo que ese horizonte. El UTCI sigue el método de
`docs/metodo-utci.md`.

```
datos/provisional/*.csv ─┐
OpenStreetMap ───────────┼─▶ scripts/ (Python) ─▶ public/datos/ ─▶ app (Vite + React + TypeScript)
                         ┘                                          · motor de sombra en un Web Worker
                                                                    · mapa MapLibre con capas propias
                                                                    · rutas e isócronas en el navegador
                                                                    · clima Open-Meteo → UTCI → semáforo
```

## Cómo correrla en tu computador

Requisitos: [Node.js](https://nodejs.org) 22 o más reciente y Git.

```
git clone https://github.com/penademuertekm-source/Umbral.git
cd Umbral
npm install
npm run dev
```

Abre la dirección que aparece (normalmente http://localhost:5173/).

| Comando | Para qué |
|---|---|
| `npm run dev` | Servidor de desarrollo. Para verlo en el celular por la misma red wifi: `npm run dev -- --host` |
| `npm test` | Pruebas (vitest) |
| `npm run lint` | Revisión de código (oxlint) |
| `npm run build` y `npm run preview` | Versión de producción, con el modo sin conexión |
| `npm run contraste` | Revisión de contraste de los colores (`docs/accesibilidad.md`) |
| `npm run iconos` | Regenera los íconos de la app desde el isotipo |
| `npm run datos` | Regenera `public/datos/` con Python y OpenStreetMap (ver `scripts/`) |

**En Windows**, si PowerShell dice que "la ejecución de scripts está deshabilitada", escribe `npm.cmd` en
vez de `npm` (por ejemplo, `npm.cmd install`) o usa la terminal *Command Prompt*.

Los datos también se pueden regenerar en GitHub: pestaña **Actions → Datos de sombra → Run workflow**.

## Publicación

La app se publica en GitHub Pages con GitHub Actions cada vez que se suben cambios. Los pasos y qué hacer
si algo falla están en [`docs/publicacion.md`](docs/publicacion.md).

## Prueba de campo

El protocolo para comparar la sombra predicha con fotos en 10 puntos y 4 horas está en
[`docs/guia-prueba-campo.md`](docs/guia-prueba-campo.md), con la planilla
[`docs/plantilla-prueba-campo.csv`](docs/plantilla-prueba-campo.csv).

## Privacidad

- Sin servidor propio, sin analítica y sin cuentas.
- La ubicación se usa solo en el teléfono, no se envía y no se guarda el recorrido.
- Los ajustes y las respuestas de "¿Te sirvió esta ruta?" quedan en el navegador (`localStorage`) y solo
  salen si la persona las exporta.
- La única petición externa es el pronóstico de Open-Meteo, y se hace para el centro del área, nunca para
  la posición de la persona.

## Estructura

```
design/            tokens, íconos y marca (fuente de verdad del diseño)
datos/provisional/ entradas editables a mano (CSV y JSON)
scripts/           pipeline Python de datos y utilidades (íconos, contraste)
public/datos/      datos generados del centro
src/               app: pantallas (app/), componentes, mapa, sombra, rutas, clima, i18n, config
docs/              especificación, bitácora, métodos, accesibilidad, publicación y prueba de campo
```

`CLAUDE.md` resume las reglas del proyecto y `docs/BITACORA.md` registra lo hecho en cada fase.

## Fuentes de datos

| Fuente | Uso | Licencia y atribución |
|---|---|---|
| [OpenStreetMap](https://www.openstreetmap.org/copyright) | Calles, manzanas, edificios, árboles y lugares | ODbL 1.0 · "© colaboradores de OpenStreetMap" |
| [Open-Meteo](https://open-meteo.com/) | Pronóstico horario (temperatura, humedad, viento, radiación, nubes, UV) | CC BY 4.0 · "Clima: Open-Meteo" |
| IDEAM (boletines) | Indicador de El Niño, actualizado a mano en `datos/provisional/clima_config.json` | Fuente citada en la app |
| `datos/provisional/` | Alturas, aleros, árboles, destinos y refugios provisionales | Del proyecto; se reemplazan con el trabajo de campo |

Las atribuciones de OpenStreetMap y Open-Meteo se ven en el mapa.

## Licencias de terceros

| Componente | Licencia |
|---|---|
| React, React DOM, React Router | MIT |
| MapLibre GL JS | BSD-3-Clause |
| SunCalc | BSD-2-Clause |
| jsthermalcomfort (UTCI y SolarCal) | MIT |
| vite-plugin-pwa y Workbox | MIT |
| Fuentes Inter y Archivo Black (@fontsource) | SIL Open Font License 1.1 |
| Vite, Vitest, oxlint | MIT · TypeScript: Apache-2.0 · sharp (solo para generar íconos): Apache-2.0 |
| Pipeline Python: OSMnx y pyproj (MIT); GeoPandas, Shapely, pvlib, NumPy, SciPy y pandas (BSD-3-Clause); requests (Apache-2.0) | Según cada paquete |

No se usa código con licencia GPL ni AGPL, ni servicios con clave.

## Licencia de Umbral

**Por definir.** Mientras tanto, el código se puede ver en este repositorio pero no reutilizar sin permiso
de las autoras y los autores.

## Créditos

Proyecto de investigación-creación *"Diseño de un Mapa Isocrónico de Sombras para el Bienestar Térmico
Peatonal en el Centro Histórico de Valledupar"*. Programa de Diseño Gráfico, Fundación Universitaria del
Areandina.

- **Autoría:** [por completar]
- **Docente:** [por completar]
- **Institución:** Fundación Universitaria del Areandina
