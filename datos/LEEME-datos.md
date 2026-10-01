# Datos de Umbral

Todo lo que está en `provisional/` es **dato de prueba** para que el prototipo funcione.
Cada fila tiene una columna `fuente` y/o `provisional`. La app debe mostrar
"Datos provisionales" mientras exista al menos un dato provisional en uso.

## Archivos y columnas

| Archivo | Qué es | Columnas clave |
|---|---|---|
| `destinos.csv` | Destinos frecuentes (pantalla 05) | `consulta_geocodificacion` se usa si `lat/lon` están vacíos |
| `refugios.csv` | Puntos de permanencia (pantalla 10) | `asientos`, `agua_potable`, `cubierto` = si/no/parcial |
| `placas_qr.csv` | Placas QR (pantallas 08 y 12) | `id` es el que va en el enlace `?placa=<id>` |
| `arboles.csv` | Inventario arbóreo | `especie` = mango / canaguate / otro · `caducifolio` = si/no · `meses_sin_hojas` = "1,2,3" |
| `edificios_pisos.csv` | Pisos o altura por edificación | si falta, se asume 1 piso = 3,5 m (provisional) |
| `aleros.csv` | Aleros y toldos sobre el andén | `profundidad_m`, `altura_m` |
| `clima_config.json` | Interruptor manual de El Niño | `el_nino_activo` |

## Cómo se generan los provisionales (Fase 2)

- **Calles y edificios**: OpenStreetMap (© colaboradores de OpenStreetMap, ODbL).
- **Alturas**: `building:levels` de OSM si existe; si no, 1 piso (3,5 m) marcado provisional.
- **Árboles**: los `natural=tree` de OSM si existen; si no, árboles sintéticos a lo largo
  de algunos andenes y en plazas, marcados `fuente=provisional`. Mezcla aproximada: 60 % mango,
  25 % cañaguate, 15 % otro.
- **Coordenadas de destinos y refugios**: geocodificación con Nominatim (máx. 1 consulta por
  segundo, con un User-Agent propio). Si no encuentra el lugar, queda vacío y se reporta.

## Reemplazo por datos reales (Fase 10)

Se llenan estos mismos CSV con el levantamiento de campo (`fuente=campo`) y se vuelve a
ejecutar el script de la Fase 2. El código de la app no cambia.
