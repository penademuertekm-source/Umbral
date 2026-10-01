"""Alturas de los edificios y aleros (canal "edificios" del perfil de horizonte)."""

from __future__ import annotations

import geopandas as gpd
import pandas as pd
from shapely.geometry import LineString

from . import config
from .tablas import leer_csv, numero


def _ref_osm(fila: pd.Series) -> str:
    return f"{fila.get('element', 'way')}/{fila.get('id', '')}"


def asignar_alturas(edificios: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Agrega `altura_m` y `origen_altura` a cada edificio. Prioridad:
    1. datos/provisional/edificios_pisos.csv (altura_m, o pisos × 3,5 m),
    2. etiqueta `height` de OSM,
    3. `building:levels` de OSM × 3,5 m,
    4. 1 piso = 3,5 m (provisional).
    """
    _, filas = leer_csv(config.DATOS_PROVISIONALES / "edificios_pisos.csv")
    por_ref = {f["ref_osm"]: f for f in filas if f.get("ref_osm")}

    alturas, origenes, refs = [], [], []
    for _, fila in edificios.iterrows():
        ref = _ref_osm(fila)
        refs.append(ref)
        manual = por_ref.get(ref)
        if manual and numero(manual.get("altura_m")):
            alturas.append(numero(manual["altura_m"]))
            origenes.append(manual.get("fuente") or "csv")
        elif manual and numero(manual.get("pisos")):
            alturas.append(numero(manual["pisos"]) * config.ALTURA_PISO_M)
            origenes.append(manual.get("fuente") or "csv")
        elif numero(fila.get("height")):
            alturas.append(numero(fila.get("height")))
            origenes.append("osm_altura")
        elif numero(fila.get("building:levels")):
            alturas.append(numero(fila.get("building:levels")) * config.ALTURA_PISO_M)
            origenes.append("osm_pisos")
        else:
            alturas.append(config.ALTURA_PISO_M)
            origenes.append("provisional")

    resultado = edificios[["geometry"]].copy()
    resultado["ref_osm"] = refs
    resultado["altura_m"] = alturas
    resultado["origen_altura"] = origenes
    return resultado


def cargar_aleros() -> gpd.GeoDataFrame:
    """
    Aleros y toldos de datos/provisional/aleros.csv, como losas a `altura_m`.
    El polígono es la línea con un ancho de `profundidad_m` a cada lado: la parte que cae dentro
    del edificio no cambia el resultado, porque la fachada es más alta.
    """
    _, filas = leer_csv(config.DATOS_PROVISIONALES / "aleros.csv")
    registros = []
    for fila in filas:
        coords = [numero(fila.get(c)) for c in ("lon_inicio", "lat_inicio", "lon_fin", "lat_fin")]
        profundidad, altura = numero(fila.get("profundidad_m")), numero(fila.get("altura_m"))
        if None in coords or not profundidad or not altura:
            continue
        registros.append(
            {
                "id": fila.get("id", ""),
                "profundidad_m": profundidad,
                "altura_m": altura,
                "fuente": fila.get("fuente", ""),
                "geometry": LineString([(coords[0], coords[1]), (coords[2], coords[3])]),
            }
        )
    if not registros:
        return gpd.GeoDataFrame(
            {"id": [], "altura_m": [], "fuente": []}, geometry=[], crs=config.CRS_METRICO
        )
    lineas = gpd.GeoDataFrame(registros, crs=config.CRS_GEOGRAFICO).to_crs(config.CRS_METRICO)
    lineas["geometry"] = [
        geom.buffer(prof, cap_style="flat") for geom, prof in zip(lineas.geometry, lineas["profundidad_m"])
    ]
    return lineas
