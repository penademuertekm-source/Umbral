"""Área de estudio: un círculo de 700 m alrededor de la Plaza Alfonso López, editable a mano."""

from __future__ import annotations

import json

import geopandas as gpd
from shapely.geometry import Point, shape
from shapely.geometry.base import BaseGeometry

from . import config
from .red_externa import Geocodificador


def cargar_o_crear_area(geocodificador: Geocodificador) -> tuple[BaseGeometry, bool]:
    """
    Devuelve el polígono del área (WGS84) y si se creó en esta ejecución.
    Si datos/provisional/area_estudio.geojson existe, se usa tal cual (no se vuelve a geocodificar).
    """
    if config.ARCHIVO_AREA.exists():
        datos = json.loads(config.ARCHIVO_AREA.read_text(encoding="utf-8"))
        geometrias = [shape(f["geometry"]) for f in datos["features"]]
        area = geometrias[0] if len(geometrias) == 1 else gpd.GeoSeries(geometrias).union_all()
        return area, False

    ubicacion = geocodificador.buscar(config.CONSULTA_CENTRO)
    if ubicacion is None:
        raise RuntimeError(f"Nominatim no encontró {config.CONSULTA_CENTRO!r}.")
    lat, lon = ubicacion
    centro = gpd.GeoSeries([Point(lon, lat)], crs=config.CRS_GEOGRAFICO)
    circulo = centro.to_crs(config.CRS_METRICO).buffer(config.RADIO_AREA_M, 64).to_crs(config.CRS_GEOGRAFICO)
    area = circulo.iloc[0]

    coleccion = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "nombre": "Área de estudio · Centro Histórico de Valledupar",
                    "centro_consulta": config.CONSULTA_CENTRO,
                    "centro_lat": round(lat, 6),
                    "centro_lon": round(lon, 6),
                    "radio_m": config.RADIO_AREA_M,
                    "nota": "Generada por scripts/construir_datos.py. Se puede editar a mano (p. ej. en geojson.io).",
                },
                "geometry": json.loads(gpd.GeoSeries([area]).to_json())["features"][0]["geometry"],
            }
        ],
    }
    config.ARCHIVO_AREA.write_text(json.dumps(coleccion, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return area, True
