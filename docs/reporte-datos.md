# Reporte de datos · Umbral

Generado por `npm run datos` el 2026-10-01 08:49 en 123 s.

## Área de estudio

- Centro: 10.47775, -73.24463 · 1.54 km²
- Polígono: `datos/provisional/area_estudio.geojson` (existente, sin geocodificar).

## Red peatonal

| Dato | Valor |
|---|---|
| Aristas (tramos de calle entre esquinas) | 502 |
| Longitud total de ejes | 37.2 km |
| Lados de acera | 1004 |
| Puntos de muestreo (cada 5 m) | 14876 |
| Muestras acercadas al eje porque caían en un edificio | 1403 |
| Muestras que siguen dentro de un edificio | 135 |

Tramos por tipo de vía:

| Tipo | Aristas |
|---|---|
| residential | 357 |
| tertiary | 63 |
| secondary | 50 |
| footway | 14 |
| service | 7 |
| path | 5 |
| pedestrian | 4 |
| secondary_link | 1 |
| steps | 1 |

## Edificios

| Origen de la altura | Edificios |
|---|---|
| osm_altura | 1820 |
| provisional | 148 |
| osm_pisos | 18 |
| **Total** | **1986** |

Aleros cargados: 0.

## Árboles

Origen del inventario: **osm+provisional**.

| Fuente | Árboles |
|---|---|
| provisional | 1550 |
| osm | 258 |

| Especie | Árboles |
|---|---|
| mango | 946 |
| otro | 485 |
| canaguate | 377 |

## Lugares

| Capa | Total | Con coordenadas | Geocodificados ahora | No encontrados |
|---|---|---|---|---|
| Destinos | 5 | 1 | 1 | 4 |
| Refugios | 4 | 1 | 1 | 3 |
| Placas QR | 2 | 0 | 0 | 0 |

## Perfil de horizonte

- 72 sectores de 5°, radio de 60 m, ojo a 1.5 m.
- Canales: edificios, arboles_perennes, arboles_caducifolios. Codificación Uint8 en pasos de 0.5°.
- SVF medio: 0.53 (mín. 0.00, máx. 1.00).
- Tiempo de cálculo: 16 s.

## Archivos en `public/datos/`

| Archivo | Tamaño |
|---|---|
| `aceras.geojson` | 515 KB |
| `arboles.geojson` | 455 KB |
| `clima_config.json` | 0 KB |
| `destinos.json` | 1 KB |
| `edificios.geojson` | 494 KB |
| `manzanas.geojson` | 35 KB |
| `meta.json` | 1 KB |
| `muestras.bin` | 3.138 KB |
| `muestras.json` | 494 KB |
| `placas.json` | 0 KB |
| `plazas.geojson` | 1 KB |
| `red.geojson` | 198 KB |
| `refugios.json` | 1 KB |

Meta: `muestras.bin` de menos de 2 MB → 3.138 KB, **no cumple**.

## Avisos

- Se escribió `datos/provisional/arboles.csv`. Las próximas ejecuciones lo usan tal cual; bórralo para volver a generar los árboles.
- Nominatim no encontró estos destinos: iglesia-concepcion, casa-beto-murgas, mercado-publico, callejon-purrututu.
- Destinos sin coordenadas (no aparecen en el mapa): iglesia-concepcion, casa-beto-murgas, mercado-publico, callejon-purrututu.
- Nominatim no encontró estos refugios: ref-atrio-concepcion, ref-purrututu, ref-parque-leyenda.
- Refugios sin coordenadas (no aparecen en el mapa): ref-atrio-concepcion, ref-purrututu, ref-parque-leyenda.
- Placas sin coordenadas (no aparecen en el mapa): calle-grande-cra7, plaza-alfonso-lopez.

## Simplificaciones del modelo

- Terreno plano y edificios como prismas de una sola altura.
- Copas de árbol como cilindros; se guarda el borde superior de la copa. El sol bajo que pasa por debajo
  de una copa lejana no se modela.
- Un punto bajo una copa o un alero queda en sombra de ese objeto a cualquier hora.
- La acera está a una distancia fija del eje según el tipo de vía; si cae dentro de un edificio, se acerca
  al eje. El GPS no detecta la acera: la app la recomienda, pero no la verifica.
