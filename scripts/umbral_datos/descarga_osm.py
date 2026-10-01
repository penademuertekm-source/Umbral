"""Descarga de OpenStreetMap con osmnx (Overpass). © colaboradores de OpenStreetMap, ODbL."""

from __future__ import annotations

import logging
import os
import time

import geopandas as gpd
import osmnx as ox
import requests
from shapely.geometry import box
from shapely.geometry.base import BaseGeometry

from . import config
from .red_externa import explicar_error_red

# Pausas entre reintentos (s) en un mismo servidor, antes de pasar al siguiente.
PAUSAS_REINTENTO_S = (5, 20)


def servidores_overpass() -> list[str]:
    propios = os.environ.get("UMBRAL_OVERPASS", "")
    return [s.strip().rstrip("/") for s in propios.split(",") if s.strip()] or list(config.SERVIDORES_OVERPASS)


def configurar() -> None:
    ox.settings.use_cache = True
    ox.settings.cache_folder = str(config.CACHE / "osmnx")
    ox.settings.http_user_agent = config.USER_AGENT
    ox.settings.requests_timeout = config.OVERPASS_TIEMPO_ESPERA_S
    ox.settings.log_console = False
    ox.settings.log_level = logging.WARNING
    # Sin DNS sobre HTTPS: el proxy resuelve los nombres.
    ox.settings.doh_url_template = None
    # Son pocas consultas; los reintentos van por cuenta de _con_red (la consulta de estado previa
    # también puede cortarse y osmnx espera un minuto completo cuando falla).
    ox.settings.overpass_rate_limit = False
    ox.settings.useful_tags_way = list(
        dict.fromkeys([*ox.settings.useful_tags_way, "name", "ref", "highway", "width", "sidewalk"])
    )


def _con_red(funcion, *args, **kwargs):
    """
    Llama a osmnx probando los servidores de Overpass en orden, con reintentos en cada uno.
    Si ninguno responde, explica el error.
    """
    ultimo_error: Exception | None = None
    for servidor in servidores_overpass():
        ox.settings.overpass_url = servidor
        for intento, pausa in enumerate((*PAUSAS_REINTENTO_S, None), start=1):
            try:
                return funcion(*args, **kwargs)
            except (requests.RequestException, ConnectionError) as error:
                ultimo_error = error
                if pausa is None:
                    print(f"  {servidor} no respondió; se prueba el siguiente servidor", flush=True)
                    break
                print(f"  {servidor} no respondió ({type(error).__name__}); reintento {intento} en {pausa} s", flush=True)
                time.sleep(pausa)
    raise explicar_error_red("Overpass (OpenStreetMap)", "overpass-api.de", ultimo_error or RuntimeError())


def rectangulo(area: BaseGeometry) -> BaseGeometry:
    """
    Rectángulo que contiene el área. Overpass responde mucho más rápido a un rectángulo que al círculo
    de 257 vértices; el resultado se recorta después al área real.
    """
    return box(*area.bounds)


def descargar_calles(area: BaseGeometry) -> tuple[gpd.GeoDataFrame, gpd.GeoDataFrame]:
    """Calles peatonales y vehiculares (sin autopistas) como grafo no dirigido: (nodos, aristas)."""
    grafo = _con_red(
        ox.graph.graph_from_polygon,
        rectangulo(area),
        custom_filter=config.FILTRO_CALLES,
        simplify=True,
        retain_all=False,
        truncate_by_edge=True,
    )
    grafo = ox.truncate.truncate_graph_polygon(grafo, area, truncate_by_edge=True)
    grafo = ox.truncate.largest_component(grafo)
    grafo = ox.convert.to_undirected(grafo)
    nodos, aristas = ox.convert.graph_to_gdfs(grafo)
    return nodos, aristas.reset_index()


def _features(area: BaseGeometry, etiquetas: dict) -> gpd.GeoDataFrame:
    try:
        capa = _con_red(ox.features.features_from_polygon, rectangulo(area), etiquetas)
    except ox._errors.InsufficientResponseError:
        return gpd.GeoDataFrame(geometry=[], crs=config.CRS_GEOGRAFICO)
    return capa[capa.intersects(area)]


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
