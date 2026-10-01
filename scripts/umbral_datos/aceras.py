"""Aceras a ambos lados de cada calle y puntos de muestreo cada 5 m."""

from __future__ import annotations

import math
from dataclasses import dataclass

import geopandas as gpd
import numpy as np
import pandas as pd
import shapely
from shapely.geometry import LineString

from . import config

LADOS = (("a", 1.0), ("b", -1.0))  # a = izquierda del sentido de la geometría, b = derecha


def primer_valor(valor: object) -> str:
    """osmnx junta etiquetas en listas cuando simplifica el grafo: se toma la primera."""
    if isinstance(valor, (list, tuple)):
        valor = valor[0] if valor else ""
    if valor is None or (isinstance(valor, float) and math.isnan(valor)):
        return ""
    return str(valor)


def nombre_calle(fila: pd.Series) -> str:
    nombres = fila.get("name")
    if isinstance(nombres, (list, tuple)):
        unicos = list(dict.fromkeys(str(n) for n in nombres if n))
        return " / ".join(unicos)
    return primer_valor(nombres) or primer_valor(fila.get("ref"))


def desplazamiento(tipo_via: str) -> float:
    return config.DESPLAZAMIENTO_ACERA_M.get(tipo_via, config.DESPLAZAMIENTO_ACERA_DEFECTO_M)


def orientacion_cardinal(nx: float, ny: float) -> str:
    """Lado de la calle según hacia dónde apunta la normal de la acera (0° = norte, sentido horario)."""
    azimut = math.degrees(math.atan2(nx, ny)) % 360
    if azimut >= 315 or azimut < 45:
        return "norte"
    if azimut < 135:
        return "oriental"
    if azimut < 225:
        return "sur"
    return "occidental"


def punto_y_normal(linea: LineString, distancia: float) -> tuple[float, float, float, float]:
    """Punto sobre la línea y su normal unitaria a la izquierda."""
    longitud = linea.length
    d0, d1 = max(0.0, distancia - 0.5), min(longitud, distancia + 0.5)
    p0, p1 = linea.interpolate(d0), linea.interpolate(d1)
    tx, ty = p1.x - p0.x, p1.y - p0.y
    norma = math.hypot(tx, ty) or 1.0
    punto = linea.interpolate(distancia)
    return punto.x, punto.y, -ty / norma, tx / norma


@dataclass
class Red:
    aristas: gpd.GeoDataFrame  # id, u, v, nombre, tipo, longitud_m, geometry (eje, métrico)
    lados: gpd.GeoDataFrame  # arista, lado, orientacion, muestra_inicio, muestra_cantidad, geometry
    muestras: pd.DataFrame  # x, y, arista, lado, desplazamiento_m, dentro_edificio


def construir_red(aristas_osm: gpd.GeoDataFrame, edificios: gpd.GeoDataFrame) -> Red:
    """
    `aristas_osm` y `edificios` en el CRS métrico. Cada arista da dos aceras (a y b) desplazadas
    del eje según el tipo de vía. Si una muestra cae dentro de un edificio, se acerca al eje en pasos
    de 0,5 m (el eje de OSM no siempre está centrado entre fachadas).
    """
    arbol_edificios = shapely.STRtree(edificios.geometry.values) if len(edificios) else None

    def dentro_de_edificio(x: float, y: float) -> bool:
        if arbol_edificios is None:
            return False
        return len(arbol_edificios.query(shapely.Point(x, y), predicate="intersects")) > 0

    filas_aristas, filas_lados, filas_muestras = [], [], []
    for indice, (_, serie) in enumerate(aristas_osm.iterrows()):
        eje: LineString = serie["geometry"]
        longitud = eje.length
        if longitud < 0.5:
            continue
        tipo = primer_valor(serie.get("highway"))
        filas_aristas.append(
            {
                "id": indice,
                "u": int(serie.get("u", -1)),
                "v": int(serie.get("v", -1)),
                "nombre": nombre_calle(serie),
                "tipo": tipo,
                "longitud_m": round(longitud, 1),
                "geometry": eje,
            }
        )

        cantidad = max(1, round(longitud / config.SEPARACION_MUESTRAS_M))
        posiciones = [(k + 0.5) * longitud / cantidad for k in range(cantidad)]
        bases = [punto_y_normal(eje, d) for d in posiciones]
        (x0, y0), (x1, y1) = eje.coords[0], eje.coords[-1]
        cuerda = math.hypot(x1 - x0, y1 - y0) or 1.0
        normal_media = (-(y1 - y0) / cuerda, (x1 - x0) / cuerda)
        d_base = desplazamiento(tipo)

        for lado, signo in LADOS:
            inicio = len(filas_muestras)
            puntos = []
            for x, y, nx, ny in bases:
                d = d_base
                px, py = x + signo * nx * d, y + signo * ny * d
                while dentro_de_edificio(px, py) and d - config.PASO_AJUSTE_ACERA_M >= config.DESPLAZAMIENTO_MINIMO_M:
                    d -= config.PASO_AJUSTE_ACERA_M
                    px, py = x + signo * nx * d, y + signo * ny * d
                filas_muestras.append(
                    {
                        "x": px,
                        "y": py,
                        "arista": indice,
                        "lado": lado,
                        "desplazamiento_m": d,
                        "dentro_edificio": dentro_de_edificio(px, py),
                    }
                )
                puntos.append((px, py))
            if len(puntos) == 1:
                # Arista corta: un trazo de 2 m en el sentido de la calle para poder dibujarla.
                x, y, nx, ny = bases[0]
                px, py = puntos[0]
                puntos = [(px - ny, py + nx), (px + ny, py - nx)]
            filas_lados.append(
                {
                    "arista": indice,
                    "lado": lado,
                    "orientacion": orientacion_cardinal(signo * normal_media[0], signo * normal_media[1]),
                    "muestra_inicio": inicio,
                    "muestra_cantidad": len(filas_muestras) - inicio,
                    "geometry": LineString(puntos),
                }
            )

    crs = aristas_osm.crs
    return Red(
        aristas=gpd.GeoDataFrame(filas_aristas, geometry="geometry", crs=crs),
        lados=gpd.GeoDataFrame(filas_lados, geometry="geometry", crs=crs),
        muestras=pd.DataFrame(filas_muestras),
    )


def coordenadas_muestras(muestras: pd.DataFrame) -> np.ndarray:
    return muestras[["x", "y"]].to_numpy(dtype=float)
