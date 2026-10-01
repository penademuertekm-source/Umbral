"""Escritura de public/datos/ (salidas generadas: no se editan a mano)."""

from __future__ import annotations

import gzip
import json
import shutil
from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd
import shapely
from shapely.geometry import mapping

from . import config

FORMATO_MUESTRAS = 1
ARCHIVO_MUESTRAS = "muestras.bin.gz"


def _redondear(coords, decimales: int):
    if isinstance(coords, (int, float)):
        return round(float(coords), decimales)
    return [_redondear(c, decimales) for c in coords]


def _limpio(valor):
    """Valores de pandas/numpy → JSON (NaN → None)."""
    if isinstance(valor, (np.integer,)):
        return int(valor)
    if isinstance(valor, (np.floating, float)):
        return None if np.isnan(valor) else round(float(valor), 3)
    if isinstance(valor, (np.bool_,)):
        return bool(valor)
    return valor


def escribir_json(ruta: Path, datos) -> None:
    ruta.write_text(json.dumps(datos, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")


def escribir_geojson(ruta: Path, capa: gpd.GeoDataFrame, propiedades: list[str]) -> None:
    """GeoJSON en WGS84 con coordenadas de 6 decimales (~0,1 m) y solo las propiedades pedidas."""
    geo = capa.to_crs(config.CRS_GEOGRAFICO) if len(capa) else capa
    features = []
    for (_, fila), geom in zip(geo.iterrows(), geo.geometry):
        if geom is None or geom.is_empty:
            continue
        geometria = mapping(geom)
        geometria = {"type": geometria["type"], "coordinates": _redondear(geometria["coordinates"], config.DECIMALES_COORD)}
        features.append(
            {"type": "Feature", "properties": {k: _limpio(fila[k]) for k in propiedades}, "geometry": geometria}
        )
    escribir_json(ruta, {"type": "FeatureCollection", "features": features})


def escribir_muestras(
    salida: Path,
    muestras: pd.DataFrame,
    perfiles: np.ndarray,
    svf: np.ndarray,
) -> dict:
    """
    muestras.bin.gz: Uint8, `n × 3 × 72` en orden muestra → canal → sector (216 bytes por muestra),
    comprimido con gzip (el navegador lo abre con DecompressionStream("gzip")).
    muestras.json: índice con los parámetros y, por columnas, coordenadas, arista, lado y SVF.
    """
    crudo = np.ascontiguousarray(perfiles, dtype=np.uint8).tobytes()
    # mtime=0: el mismo resultado da el mismo archivo (sin cambios falsos en git).
    (salida / ARCHIVO_MUESTRAS).write_bytes(gzip.compress(crudo, compresslevel=9, mtime=0))
    (salida / "muestras.bin").unlink(missing_ok=True)  # formato anterior, sin comprimir
    geo = gpd.GeoSeries(gpd.points_from_xy(muestras["x"], muestras["y"]), crs=config.CRS_METRICO).to_crs(
        config.CRS_GEOGRAFICO
    )
    indice = {
        "formato": FORMATO_MUESTRAS,
        "archivo": ARCHIVO_MUESTRAS,
        "compresion": "gzip",
        "cantidad": int(len(muestras)),
        "orden": "muestra-canal-sector",
        "bytes_por_muestra": len(config.CANALES) * config.SECTORES,
        "sectores": config.SECTORES,
        "grados_por_sector": 360 / config.SECTORES,
        "azimut": "0° = norte, sentido horario; el sector k cubre [5k, 5k+5)",
        "codificacion": "uint8; ángulo de elevación = valor × 0,5° (0–180 → 0°–90°)",
        "paso_grados": config.PASO_CODIFICACION_GRADOS,
        "canales": list(config.CANALES),
        "altura_ojo_m": config.ALTURA_OJO_M,
        "radio_horizonte_m": config.RADIO_HORIZONTE_M,
        "separacion_m": config.SEPARACION_MUESTRAS_M,
        "lon": [round(p.x, config.DECIMALES_COORD) for p in geo],
        "lat": [round(p.y, config.DECIMALES_COORD) for p in geo],
        "arista": muestras["arista"].astype(int).tolist(),
        "lado": muestras["lado"].tolist(),
        "svf": [round(float(v), 3) for v in svf],
    }
    escribir_json(salida / "muestras.json", indice)
    return indice


def manzanas_desde_red(aristas: gpd.GeoDataFrame, area_metrica, retiro_m: float = 5.0) -> gpd.GeoDataFrame:
    """Manzanas aproximadas: los huecos cerrados entre ejes de calle, recortados `retiro_m` hacia adentro."""
    lineas = shapely.union_all(aristas.geometry.values)
    poligonos = shapely.get_parts(shapely.polygonize(shapely.get_parts(lineas)))
    manzanas = []
    for poligono in poligonos:
        interior = poligono.buffer(-retiro_m, join_style="mitre").intersection(area_metrica)
        if not interior.is_empty and interior.area >= 50:
            manzanas.append(interior.simplify(config.TOLERANCIA_SIMPLIFICAR_M))
    return gpd.GeoDataFrame({"id": range(len(manzanas))}, geometry=manzanas, crs=config.CRS_METRICO)


def copiar_clima_config(salida: Path) -> None:
    """La app lee el_nino_activo de public/datos/clima_config.json (Fase 5)."""
    shutil.copyfile(config.DATOS_PROVISIONALES / "clima_config.json", salida / "clima_config.json")


def tamano(ruta: Path) -> int:
    return ruta.stat().st_size if ruta.exists() else 0
