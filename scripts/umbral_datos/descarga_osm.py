"""Descarga de OpenStreetMap con osmnx (Overpass). © colaboradores de OpenStreetMap, ODbL."""

from __future__ import annotations

import logging

import geopandas as gpd
import osmnx as ox
import requests
from shapely.geometry.base import BaseGeometry

from . import config
from .red_externa import explicar_error_red


def configurar() -> None:
    ox.settings.use_cache = True
    ox.settings.cache_folder = str(config.CACHE / "osmnx")
    ox.settings.http_user_agent = config.USER_AGENT
    ox.settings.requests_timeout = 180
    ox.settings.log_console = False
    ox.settings.log_level = logging.WARNING
    # Sin DNS sobre HTTPS: el proxy resuelve los nombres.
    ox.settings.doh_url_template = None
    ox.settings.useful_tags_way = list(
        dict.fromkeys([*ox.settings.useful_tags_way, "name", "ref", "highway", "width", "sidewalk"])
    )


def _con_red(funcion, *args, **kwargs):
    try:
        return funcion(*args, **kwargs)
    except (requests.RequestException, ConnectionError) as error:
        raise explicar_error_red("Overpass (OpenStreetMap)", "overpass-api.de", error) from error


def descargar_calles(area: BaseGeometry) -> tuple[gpd.GeoDataFrame, gpd.GeoDataFrame]:
    """Calles peatonales y vehiculares (sin autopistas) como grafo no dirigido: (nodos, aristas)."""
    grafo = _con_red(
        ox.graph.graph_from_polygon,
        area,
        custom_filter=config.FILTRO_CALLES,
        simplify=True,
        retain_all=False,
        truncate_by_edge=True,
    )
    grafo = ox.convert.to_undirected(grafo)
    nodos, aristas = ox.convert.graph_to_gdfs(grafo)
    return nodos, aristas.reset_index()


def _features(area: BaseGeometry, etiquetas: dict) -> gpd.GeoDataFrame:
    try:
        return _con_red(ox.features.features_from_polygon, area, etiquetas)
    except ox._errors.InsufficientResponseError:
        return gpd.GeoDataFrame(geometry=[], crs=config.CRS_GEOGRAFICO)


def descargar_edificios(area: BaseGeometry) -> gpd.GeoDataFrame:
    edificios = _features(area, {"building": True})
    if edificios.empty:
        return edificios
    edificios = edificios[edificios.geometry.geom_type.isin(["Polygon", "MultiPolygon"])]
    return edificios.reset_index()


def descargar_arboles(area: BaseGeometry) -> gpd.GeoDataFrame:
    arboles = _features(area, {"natural": "tree"})
    if arboles.empty:
        return arboles
    return arboles[arboles.geometry.geom_type == "Point"].reset_index()


def descargar_plazas(area: BaseGeometry) -> gpd.GeoDataFrame:
    """Plazas y parques (para densificar árboles provisionales y dibujar el mapa base)."""
    plazas = _features(area, {"place": "square", "leisure": ["park", "garden"]})
    if plazas.empty:
        return plazas
    plazas = plazas[plazas.geometry.geom_type.isin(["Polygon", "MultiPolygon"])]
    return plazas.reset_index()
