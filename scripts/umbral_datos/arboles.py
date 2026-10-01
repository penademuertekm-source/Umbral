"""
Árboles: datos/provisional/arboles.csv si tiene filas; si no, los de OSM; y si OSM no tiene
suficientes, se agregan árboles provisionales a lo largo de las aceras y en las plazas.
El resultado se escribe en arboles.csv para poder revisarlo y corregirlo a mano.
"""

from __future__ import annotations

from dataclasses import dataclass

import geopandas as gpd
import numpy as np
import pandas as pd
import shapely
from shapely.geometry import Point

from . import config
from .aceras import desplazamiento, punto_y_normal
from .tablas import escribir_csv, leer_csv, numero, si_no

COLUMNAS_CSV = [
    "id",
    "especie",
    "lat",
    "lon",
    "altura_m",
    "diametro_copa_m",
    "altura_fuste_m",
    "caducifolio",
    "meses_sin_hojas",
    "fuente",
    "fecha_levantamiento",
]


@dataclass
class ResultadoArboles:
    arboles: gpd.GeoDataFrame  # CRS métrico
    origen: str  # 'csv' | 'osm' | 'osm+provisional' | 'provisional'
    escrito_csv: bool


def especie_desde_osm(fila: pd.Series) -> str:
    texto = " ".join(
        str(fila.get(c, "")) for c in ("species", "genus", "species:es", "taxon", "name", "name:es")
    ).lower()
    if "mangifera" in texto or "mango" in texto:
        return "mango"
    if any(n in texto for n in ("handroanthus", "tabebuia", "cañaguate", "canaguate", "guayacán amarillo")):
        return "canaguate"
    return "otro"


def _medio(rango: tuple[float, float]) -> float:
    return (rango[0] + rango[1]) / 2


def _fila_arbol(id_: str, especie: str, punto: Point, altura: float, copa: float, fuente: str) -> dict:
    datos = config.ESPECIES[especie]
    return {
        "id": id_,
        "especie": especie,
        "altura_m": round(altura, 1),
        "diametro_copa_m": round(copa, 1),
        "altura_fuste_m": datos["fuste"],
        "caducifolio": datos["caducifolio"],
        "meses_sin_hojas": datos["meses_sin_hojas"],
        "fuente": fuente,
        "fecha_levantamiento": "",
        "geometry": punto,
    }


def _desde_csv(filas: list[dict[str, str]]) -> gpd.GeoDataFrame:
    registros = []
    for fila in filas:
        lat, lon = numero(fila.get("lat")), numero(fila.get("lon"))
        if lat is None or lon is None:
            continue
        especie = fila.get("especie") or "otro"
        base = config.ESPECIES.get(especie, config.ESPECIES["otro"])
        registros.append(
            {
                "id": fila.get("id", ""),
                "especie": especie,
                "altura_m": numero(fila.get("altura_m")) or _medio(base["altura"]),
                "diametro_copa_m": numero(fila.get("diametro_copa_m")) or _medio(base["copa"]),
                "altura_fuste_m": numero(fila.get("altura_fuste_m")) or base["fuste"],
                "caducifolio": si_no(fila.get("caducifolio")),
                "meses_sin_hojas": fila.get("meses_sin_hojas", ""),
                "fuente": fila.get("fuente") or "csv",
                "fecha_levantamiento": fila.get("fecha_levantamiento", ""),
                "geometry": Point(lon, lat),
            }
        )
    if not registros:
        return gpd.GeoDataFrame(columns=COLUMNAS_CSV + ["geometry"], geometry="geometry", crs=config.CRS_METRICO)
    return gpd.GeoDataFrame(registros, crs=config.CRS_GEOGRAFICO).to_crs(config.CRS_METRICO)


def _desde_osm(arboles_osm: gpd.GeoDataFrame) -> list[dict]:
    filas = []
    for _, fila in arboles_osm.iterrows():
        especie = especie_desde_osm(fila)
        base = config.ESPECIES[especie]
        altura = numero(fila.get("height")) or _medio(base["altura"])
        copa = numero(fila.get("diameter_crown")) or _medio(base["copa"])
        filas.append(_fila_arbol(f"osm-{fila.get('id', '')}", especie, fila.geometry, altura, copa, "osm"))
    return filas


class _Ubicador:
    """Lleva la cuenta de los árboles puestos para respetar la distancia mínima entre ellos."""

    def __init__(self, existentes: list[Point], edificios: gpd.GeoDataFrame) -> None:
        self.puntos = [(p.x, p.y) for p in existentes]
        self.arbol_edificios = shapely.STRtree(edificios.geometry.values) if len(edificios) else None

    def libre(self, x: float, y: float) -> bool:
        if self.arbol_edificios is not None:
            circulo = shapely.Point(x, y).buffer(0.5)
            if len(self.arbol_edificios.query(circulo, predicate="intersects")):
                return False
        if self.puntos:
            p = np.asarray(self.puntos)
            if np.min(np.hypot(p[:, 0] - x, p[:, 1] - y)) < config.DISTANCIA_MINIMA_ENTRE_ARBOLES_M:
                return False
        return True

    def agregar(self, x: float, y: float) -> None:
        self.puntos.append((x, y))


def _generar_provisionales(
    aristas: gpd.GeoDataFrame,
    plazas: gpd.GeoDataFrame,
    edificios: gpd.GeoDataFrame,
    existentes: list[Point],
    rng: np.random.Generator,
) -> list[dict]:
    nombres = list(config.ESPECIES)
    proporciones = np.array([config.ESPECIES[n]["proporcion"] for n in nombres])
    ubicador = _Ubicador(existentes, edificios)
    filas: list[dict] = []

    def poner(x: float, y: float) -> None:
        if not ubicador.libre(x, y):
            return
        especie = str(rng.choice(nombres, p=proporciones / proporciones.sum()))
        datos = config.ESPECIES[especie]
        altura = rng.uniform(*datos["altura"])
        copa = rng.uniform(*datos["copa"])
        filas.append(_fila_arbol(f"prov-{len(filas) + 1:04d}", especie, Point(x, y), altura, copa, "provisional"))
        ubicador.agregar(x, y)

    # A lo largo de las aceras: en el 40 % de los lados, cada 12–25 m, junto al borde de la calzada.
    for _, arista in aristas.iterrows():
        if arista["tipo"] == "steps":
            continue
        for signo in (1.0, -1.0):
            if rng.random() >= config.FRACCION_LADOS_CON_ARBOLES:
                continue
            retiro = max(0.5, desplazamiento(arista["tipo"]) - config.RETIRO_ARBOL_HACIA_CALZADA_M)
            distancia = rng.uniform(0, config.SEPARACION_ARBOLES_M[0])
            while distancia < arista.geometry.length:
                x, y, nx, ny = punto_y_normal(arista.geometry, distancia)
                poner(x + signo * nx * retiro, y + signo * ny * retiro)
                distancia += rng.uniform(*config.SEPARACION_ARBOLES_M)

    # En plazas y parques: una rejilla de 10 m con algo de desorden, más densa que en las calles.
    paso = config.SEPARACION_ARBOLES_PLAZA_M
    for plaza in plazas.geometry:
        minx, miny, maxx, maxy = plaza.bounds
        for x in np.arange(minx + paso / 2, maxx, paso):
            for y in np.arange(miny + paso / 2, maxy, paso):
                px, py = x + rng.uniform(-2, 2), y + rng.uniform(-2, 2)
                if rng.random() < config.PROBABILIDAD_ARBOL_PLAZA and plaza.contains(Point(px, py)):
                    poner(px, py)
    return filas


def preparar_arboles(
    arboles_osm: gpd.GeoDataFrame,
    aristas: gpd.GeoDataFrame,
    plazas: gpd.GeoDataFrame,
    edificios: gpd.GeoDataFrame,
) -> ResultadoArboles:
    """Todas las capas en el CRS métrico. `aristas` es la red de aceras.construir_red()."""
    ruta = config.DATOS_PROVISIONALES / "arboles.csv"
    _, filas_csv = leer_csv(ruta)
    if filas_csv:
        return ResultadoArboles(_desde_csv(filas_csv), "csv", False)

    filas = _desde_osm(arboles_osm)
    km_de_calle = aristas["longitud_m"].sum() / 1000 if len(aristas) else 0
    suficientes = km_de_calle > 0 and len(filas) / km_de_calle >= config.DENSIDAD_MINIMA_OSM_POR_KM
    origen = "osm"
    if not suficientes:
        rng = np.random.default_rng(config.SEMILLA)
        filas += _generar_provisionales(aristas, plazas, edificios, [f["geometry"] for f in filas], rng)
        origen = "osm+provisional" if arboles_osm is not None and len(arboles_osm) else "provisional"

    arboles = gpd.GeoDataFrame(filas, geometry="geometry", crs=config.CRS_METRICO)
    _escribir(ruta, arboles)
    return ResultadoArboles(arboles, origen, True)


def _escribir(ruta, arboles: gpd.GeoDataFrame) -> None:
    geo = arboles.to_crs(config.CRS_GEOGRAFICO)
    filas = []
    for (_, fila), punto in zip(arboles.iterrows(), geo.geometry):
        filas.append(
            {
                **{k: fila[k] for k in COLUMNAS_CSV if k in fila and k not in ("lat", "lon", "caducifolio")},
                "lat": round(punto.y, config.DECIMALES_COORD),
                "lon": round(punto.x, config.DECIMALES_COORD),
                "caducifolio": "si" if fila["caducifolio"] else "no",
            }
        )
    escribir_csv(ruta, COLUMNAS_CSV, filas)
