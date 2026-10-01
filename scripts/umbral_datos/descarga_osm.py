"""
Descarga de OpenStreetMap (Overpass) y lectura con osmnx. © colaboradores de OpenStreetMap, ODbL.

Las consultas a Overpass se hacen aquí y no con osmnx: osmnx reintenta para siempre cuando el servidor
responde 429 o 504, y así no hay forma de pasar a otro servidor. Cada respuesta se guarda en
scripts/.cache/overpass/, así que volver a correr el pipeline no repite las descargas.
"""

from __future__ import annotations

import hashlib
import logging
import os
import re
import time
from pathlib import Path

import geopandas as gpd
import osmnx as ox
import requests
from shapely.geometry.base import BaseGeometry

from . import config
from .red_externa import explicar_error_red

# Pausas entre reintentos (s) en un mismo servidor, antes de pasar al siguiente.
PAUSAS_REINTENTO_S: tuple[float, ...] = (5, 20)
ESTADOS_REINTENTABLES = {429, 502, 503, 504}

_servidor_que_respondio: str | None = None


def configurar() -> None:
    ox.settings.log_console = False
    ox.settings.log_level = logging.WARNING
    ox.settings.useful_tags_way = list(
        dict.fromkeys([*ox.settings.useful_tags_way, "name", "ref", "highway", "width", "sidewalk"])
    )


def servidores_overpass() -> list[str]:
    """Servidores en orden; el último que respondió va primero."""
    propios = os.environ.get("UMBRAL_OVERPASS", "")
    servidores = [s.strip().rstrip("/") for s in propios.split(",") if s.strip()] or list(config.SERVIDORES_OVERPASS)
    if _servidor_que_respondio in servidores:
        servidores.remove(_servidor_que_respondio)
        servidores.insert(0, _servidor_que_respondio)
    return servidores


def _bbox(area: BaseGeometry) -> str:
    """Rectángulo del área en el orden de Overpass: sur, oeste, norte, este."""
    oeste, sur, este, norte = area.bounds
    return f"{sur:.6f},{oeste:.6f},{norte:.6f},{este:.6f}"


def consulta(cuerpo: str, area: BaseGeometry) -> str:
    """
    Consulta Overpass QL sobre el rectángulo del área (Overpass responde mucho más rápido a un rectángulo
    que al círculo de 257 vértices; el resultado se recorta después al área real).
    """
    return f"[out:xml][timeout:90][bbox:{_bbox(area)}];\n{cuerpo}\n(._;>;);\nout body;"


def consultar_overpass(nombre: str, texto_consulta: str) -> Path:
    """Devuelve un archivo .osm con la respuesta, desde la caché o desde el primer servidor que responda."""
    global _servidor_que_respondio
    huella = hashlib.sha1(texto_consulta.encode()).hexdigest()[:12]
    destino = config.CACHE / "overpass" / f"{nombre}-{huella}.osm"
    if destino.exists() and destino.stat().st_size > 0:
        print(f"  {nombre}: desde la caché ({destino.name})", flush=True)
        return destino
    destino.parent.mkdir(parents=True, exist_ok=True)

    sesion = requests.Session()
    sesion.headers["User-Agent"] = config.USER_AGENT
    ultimo_error: Exception | None = None
    for servidor in servidores_overpass():
        for intento, pausa in enumerate((*PAUSAS_REINTENTO_S, None), start=1):
            try:
                respuesta = sesion.post(
                    f"{servidor}/interpreter", data={"data": texto_consulta}, timeout=config.OVERPASS_TIEMPO_ESPERA_S
                )
                if respuesta.status_code == 400:
                    raise RuntimeError(f"Consulta de Overpass inválida: {respuesta.text[:500]}")
                if respuesta.status_code in ESTADOS_REINTENTABLES:
                    raise requests.HTTPError(f"{respuesta.status_code} {respuesta.reason}", response=respuesta)
                respuesta.raise_for_status()
                contenido = respuesta.content
                if b"<osm" not in contenido[:1000]:
                    raise requests.HTTPError("la respuesta no trae datos OSM", response=respuesta)
                error_remoto = re.search(rb"<remark>(.*?(?:error|timed out).*?)</remark>", contenido, re.I | re.S)
                if error_remoto:
                    raise requests.HTTPError(error_remoto.group(1).decode(errors="replace").strip(), response=respuesta)
                temporal = destino.with_suffix(".tmp")
                temporal.write_bytes(contenido)
                temporal.replace(destino)
                _servidor_que_respondio = servidor
                print(f"  {nombre}: {len(contenido) / 1024:,.0f} KB desde {servidor}", flush=True)
                return destino
            except requests.RequestException as error:
                ultimo_error = error
                motivo = str(error)[:120]
                if pausa is None:
                    print(f"  {servidor} no respondió ({motivo}); se prueba el siguiente servidor", flush=True)
                    break
                print(f"  {servidor} no respondió ({motivo}); reintento {intento} en {pausa:g} s", flush=True)
                time.sleep(pausa)
    raise explicar_error_red("Overpass (OpenStreetMap)", "overpass-api.de", ultimo_error or RuntimeError())


def descargar_calles(area: BaseGeometry) -> tuple[gpd.GeoDataFrame, gpd.GeoDataFrame]:
    """Calles peatonales y vehiculares (sin autopistas) como grafo no dirigido: (nodos, aristas)."""
    ruta = consultar_overpass("calles", consulta(f"way{config.FILTRO_CALLES};", area))
    grafo = ox.graph.graph_from_xml(ruta, bidirectional=False, simplify=True, retain_all=True)
    grafo = ox.truncate.truncate_graph_polygon(grafo, area, truncate_by_edge=True)
    grafo = ox.truncate.largest_component(grafo)
    grafo = ox.convert.to_undirected(grafo)
    nodos, aristas = ox.convert.graph_to_gdfs(grafo)
    return nodos, aristas.reset_index()


def _features(nombre: str, cuerpo: str, etiquetas: dict, area: BaseGeometry) -> gpd.GeoDataFrame:
    ruta = consultar_overpass(nombre, consulta(cuerpo, area))
    try:
        capa = ox.features.features_from_xml(ruta, tags=etiquetas)
    except ox._errors.InsufficientResponseError:
        return gpd.GeoDataFrame(geometry=[], crs=config.CRS_GEOGRAFICO)
    return capa[capa.intersects(area)]


def descargar_edificios(area: BaseGeometry) -> gpd.GeoDataFrame:
    edificios = _features(
        "edificios",
        '(way["building"]; relation["building"]["type"="multipolygon"];);',
        {"building": True},
        area,
    )
    if edificios.empty:
        return edificios
    edificios = edificios[edificios.geometry.geom_type.isin(["Polygon", "MultiPolygon"])]
    return edificios.reset_index()


def descargar_arboles(area: BaseGeometry) -> gpd.GeoDataFrame:
    arboles = _features("arboles", 'node["natural"="tree"];', {"natural": "tree"}, area)
    if arboles.empty:
        return arboles
    return arboles[arboles.geometry.geom_type == "Point"].reset_index()


def descargar_plazas(area: BaseGeometry) -> gpd.GeoDataFrame:
    """Plazas y parques (para densificar árboles provisionales y dibujar el mapa base)."""
    plazas = _features(
        "plazas",
        '(way["place"="square"]; relation["place"="square"]; '
        'way["leisure"~"^(park|garden)$"]; relation["leisure"~"^(park|garden)$"];);',
        {"place": "square", "leisure": ["park", "garden"]},
        area,
    )
    if plazas.empty:
        return plazas
    plazas = plazas[plazas.geometry.geom_type.isin(["Polygon", "MultiPolygon"])]
    return plazas.reset_index()
