"""
Perfil de horizonte de cada punto de muestreo (ver CLAUDE.md, "Modelo de sombra").

Para cada punto se guardan 72 sectores de azimut de 5° (0° = norte, sentido horario). En cada sector,
el ángulo de elevación máximo que bloquea el cielo, visto desde 1,5 m de altura, en tres canales:
  0. edificios (incluye aleros),
  1. árboles perennes (mango y otros),
  2. árboles caducifolios (cañaguate).

Método: se lanzan 144 rayos (cada 2,5°) desde el punto. Cada rayo toma la distancia a la fachada o a la
copa más cercana en esa dirección y la convierte en ángulo: atan((altura − 1,5) / distancia). Un sector
toma el máximo de sus rayos de borde y de centro, y además el de los vértices de edificio que caen en él
(así no se pierden esquinas entre dos rayos).

Simplificaciones (documentadas también en docs/reporte-datos.md):
- Terreno plano: el centro de Valledupar casi no tiene pendiente.
- Edificios como prismas de altura única (sin techos inclinados).
- Copas como cilindros entre `altura_fuste_m` y `altura_m`. Se guarda solo el borde superior: el sol bajo
  que pasa por debajo de una copa lejana no se modela.
- Un punto bajo una copa o bajo un alero queda con 90° en todo ese canal (siempre en sombra de ese objeto).
"""

from __future__ import annotations

import multiprocessing as mp
import os
from concurrent.futures import ProcessPoolExecutor
from dataclasses import dataclass

import geopandas as gpd
import numpy as np
import shapely
from scipy.spatial import cKDTree

from . import config

N_RAYOS = config.SECTORES * 2
_ANGULOS_RAYOS = np.arange(N_RAYOS) * (2 * np.pi / N_RAYOS)
_UX = np.sin(_ANGULOS_RAYOS)
_UY = np.cos(_ANGULOS_RAYOS)
LONGITUD_MAXIMA_SEGMENTO_M = 5.0


@dataclass
class Obstaculos:
    # Segmentos de fachada (cortados a 5 m como máximo) con su altura.
    seg_a: np.ndarray
    seg_b: np.ndarray
    seg_h: np.ndarray
    arbol_segmentos: cKDTree | None
    # Vértices de los polígonos (esquinas).
    vert: np.ndarray
    vert_h: np.ndarray
    arbol_vertices: cKDTree | None
    # Polígonos bajo los que un punto queda cubierto (aleros).
    techos: shapely.STRtree | None
    # Árboles: centro, radio de copa, altura, canal (1 perenne, 2 caducifolio).
    arb_c: np.ndarray
    arb_r: np.ndarray
    arb_h: np.ndarray
    arb_canal: np.ndarray
    arbol_arboles: cKDTree | None


def _anillos(geom) -> list[np.ndarray]:
    poligonos = list(geom.geoms) if geom.geom_type == "MultiPolygon" else [geom]
    anillos = []
    for poligono in poligonos:
        anillos.append(np.asarray(poligono.exterior.coords))
        anillos.extend(np.asarray(interior.coords) for interior in poligono.interiors)
    return anillos


def preparar_obstaculos(
    edificios: gpd.GeoDataFrame, aleros: gpd.GeoDataFrame, arboles: gpd.GeoDataFrame
) -> Obstaculos:
    """Capas en el CRS métrico. `edificios` y `aleros` con `altura_m`; `arboles` con las columnas de arboles.py."""
    seg_a, seg_b, seg_h, vert, vert_h = [], [], [], [], []
    for capa in (edificios, aleros):
        for geom, altura in zip(capa.geometry, capa["altura_m"]):
            if geom is None or geom.is_empty:
                continue
            for anillo in _anillos(geom):
                vert.append(anillo[:-1])
                vert_h.append(np.full(len(anillo) - 1, altura))
                a, b = anillo[:-1], anillo[1:]
                largo = np.hypot(*(b - a).T)
                partes = np.maximum(1, np.ceil(largo / LONGITUD_MAXIMA_SEGMENTO_M)).astype(int)
                for p0, p1, n in zip(a, b, partes):
                    t = np.linspace(0, 1, n + 1)[:, None]
                    puntos = p0 + t * (p1 - p0)
                    seg_a.append(puntos[:-1])
                    seg_b.append(puntos[1:])
                    seg_h.append(np.full(n, altura))

    def unir(partes: list[np.ndarray], columnas: int) -> np.ndarray:
        return np.concatenate(partes) if partes else np.zeros((0, columnas) if columnas else 0)

    seg_a_arr, seg_b_arr = unir(seg_a, 2), unir(seg_b, 2)
    vert_arr = unir(vert, 2)
    arb_c = np.array([[p.x, p.y] for p in arboles.geometry]) if len(arboles) else np.zeros((0, 2))
    return Obstaculos(
        seg_a=seg_a_arr,
        seg_b=seg_b_arr,
        seg_h=unir(seg_h, 0),
        arbol_segmentos=cKDTree((seg_a_arr + seg_b_arr) / 2) if len(seg_a_arr) else None,
        vert=vert_arr,
        vert_h=unir(vert_h, 0),
        arbol_vertices=cKDTree(vert_arr) if len(vert_arr) else None,
        techos=shapely.STRtree(aleros.geometry.values) if len(aleros) else None,
        arb_c=arb_c,
        arb_r=arboles["diametro_copa_m"].to_numpy(float) / 2 if len(arboles) else np.zeros(0),
        arb_h=arboles["altura_m"].to_numpy(float) if len(arboles) else np.zeros(0),
        arb_canal=np.where(arboles["caducifolio"].to_numpy(bool), 2, 1) if len(arboles) else np.zeros(0, int),
        arbol_arboles=cKDTree(arb_c) if len(arb_c) else None,
    )


def _sectores_desde_rayos(rayos: np.ndarray) -> np.ndarray:
    """Sector k ← máximo de los rayos 2k (borde), 2k+1 (centro) y 2k+2 (borde siguiente)."""
    return np.maximum(np.maximum(rayos[0::2], rayos[1::2]), np.roll(rayos[0::2], -1))


def _sector_de(dx: np.ndarray, dy: np.ndarray) -> np.ndarray:
    azimut = np.arctan2(dx, dy) % (2 * np.pi)
    return np.minimum((azimut / (2 * np.pi / config.SECTORES)).astype(int), config.SECTORES - 1)


def _elevacion(altura: np.ndarray, distancia: np.ndarray) -> np.ndarray:
    return np.maximum(0.0, np.arctan2(altura - config.ALTURA_OJO_M, distancia))


def _canal_edificios(obs: Obstaculos, p: np.ndarray) -> np.ndarray:
    radio = config.RADIO_HORIZONTE_M
    sectores = np.zeros(config.SECTORES)
    if obs.techos is not None and len(obs.techos.query(shapely.Point(*p), predicate="intersects")):
        return np.full(config.SECTORES, np.pi / 2)

    if obs.arbol_segmentos is not None:
        indices = obs.arbol_segmentos.query_ball_point(p, radio + LONGITUD_MAXIMA_SEGMENTO_M / 2)
        if indices:
            a = obs.seg_a[indices] - p
            e = obs.seg_b[indices] - obs.seg_a[indices]
            h = obs.seg_h[indices]
            # Rayo p + s·u contra segmento a + t·e:  s = (a×e)/(u×e),  t = (a×u)/(u×e)
            denom = _UX[:, None] * e[:, 1] - _UY[:, None] * e[:, 0]
            a_x_e = a[:, 0] * e[:, 1] - a[:, 1] * e[:, 0]
            a_x_u = a[:, 0] * _UY[:, None] - a[:, 1] * _UX[:, None]
            with np.errstate(divide="ignore", invalid="ignore"):
                s = a_x_e / denom
                t = a_x_u / denom
            valido = (np.abs(denom) > 1e-12) & (s > 1e-6) & (s <= radio) & (t >= 0) & (t <= 1)
            elev = np.where(valido, _elevacion(h[None, :], np.where(valido, s, 1.0)), 0.0)
            sectores = _sectores_desde_rayos(elev.max(axis=1))

    if obs.arbol_vertices is not None:
        indices = obs.arbol_vertices.query_ball_point(p, radio)
        if indices:
            d = obs.vert[indices] - p
            distancia = np.hypot(d[:, 0], d[:, 1])
            cerca = distancia > 1e-6
            if cerca.any():
                np.maximum.at(
                    sectores,
                    _sector_de(d[cerca, 0], d[cerca, 1]),
                    _elevacion(obs.vert_h[indices][cerca], distancia[cerca]),
                )
    return sectores


def _canales_arboles(obs: Obstaculos, p: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    perennes = np.zeros(config.SECTORES)
    caducifolios = np.zeros(config.SECTORES)
    if obs.arbol_arboles is None:
        return perennes, caducifolios
    radio_max = float(obs.arb_r.max()) if len(obs.arb_r) else 0.0
    indices = obs.arbol_arboles.query_ball_point(p, config.RADIO_HORIZONTE_M + radio_max)
    for i in indices:
        destino = perennes if obs.arb_canal[i] == 1 else caducifolios
        dx, dy = obs.arb_c[i] - p
        dc, r, h = float(np.hypot(dx, dy)), float(obs.arb_r[i]), float(obs.arb_h[i])
        if h <= config.ALTURA_OJO_M:
            continue
        if dc <= r:
            destino[:] = np.pi / 2  # bajo la copa
            continue
        if dc - r > config.RADIO_HORIZONTE_M:
            continue
        theta_c = np.arctan2(dx, dy)
        alfa = np.arcsin(min(1.0, r / dc))
        delta = (_ANGULOS_RAYOS - theta_c + np.pi) % (2 * np.pi) - np.pi
        en_copa = np.abs(delta) <= alfa
        rayos = np.zeros(N_RAYOS)
        if en_copa.any():
            dd = delta[en_copa]
            s_cerca = dc * np.cos(dd) - np.sqrt(np.maximum(0.0, r**2 - (dc * np.sin(dd)) ** 2))
            rayos[en_copa] = np.where(
                s_cerca <= config.RADIO_HORIZONTE_M, _elevacion(h, np.maximum(s_cerca, 0.01)), 0.0
            )
        sectores = _sectores_desde_rayos(rayos)
        # Dirección al centro de la copa: el punto más cercano de la copa.
        k = _sector_de(np.array([dx]), np.array([dy]))[0]
        sectores[k] = max(sectores[k], float(_elevacion(h, dc - r)))
        np.maximum(destino, sectores, out=destino)
    return perennes, caducifolios


def perfil(obs: Obstaculos, p: np.ndarray) -> np.ndarray:
    """Perfil de un punto: matriz (3, 72) de ángulos en radianes."""
    perennes, caducifolios = _canales_arboles(obs, p)
    return np.stack([_canal_edificios(obs, p), perennes, caducifolios])


def codificar(radianes: np.ndarray) -> np.ndarray:
    """Ángulo → Uint8 en pasos de 0,5° (0 = 0°, 180 = 90°)."""
    grados = np.degrees(radianes)
    return np.clip(np.round(grados / config.PASO_CODIFICACION_GRADOS), 0, 180).astype(np.uint8)


def sky_view_factor(radianes: np.ndarray) -> float:
    """SVF de una superficie horizontal: 1 − promedio de sen²(horizonte), con todos los canales y con hojas."""
    horizonte = radianes.max(axis=0)
    return float(1.0 - np.mean(np.sin(horizonte) ** 2))


_OBSTACULOS_PROCESO: Obstaculos | None = None  # copia heredada por los procesos hijos (fork)
TAMANO_BLOQUE = 500


def _calcular_bloque(puntos: np.ndarray, obs: Obstaculos | None = None) -> tuple[np.ndarray, np.ndarray]:
    obs = obs if obs is not None else _OBSTACULOS_PROCESO
    perfiles = np.zeros((len(puntos), len(config.CANALES), config.SECTORES), dtype=np.uint8)
    svf = np.zeros(len(puntos))
    for i, p in enumerate(puntos):
        radianes = perfil(obs, p)
        perfiles[i] = codificar(radianes)
        svf[i] = sky_view_factor(radianes)
    return perfiles, svf


def calcular_perfiles(
    obs: Obstaculos, puntos: np.ndarray, progreso=None, procesos: int | None = None
) -> tuple[np.ndarray, np.ndarray]:
    """
    Devuelve (perfiles Uint8 de forma (n, 3, 72), svf de forma (n,)).
    El SVF se calcula con los ángulos sin redondear.
    Reparte los puntos entre los núcleos del computador cuando el sistema permite `fork`
    (Linux y macOS); en Windows calcula en un solo proceso. El resultado es el mismo.
    """
    global _OBSTACULOS_PROCESO
    n = len(puntos)
    bloques = [puntos[i : i + TAMANO_BLOQUE] for i in range(0, n, TAMANO_BLOQUE)]
    procesos = procesos or os.cpu_count() or 1
    usar_procesos = procesos > 1 and len(bloques) > 1 and "fork" in mp.get_all_start_methods()

    resultados: list[tuple[np.ndarray, np.ndarray]] = []
    hechos = 0
    if usar_procesos:
        _OBSTACULOS_PROCESO = obs
        try:
            with ProcessPoolExecutor(procesos, mp_context=mp.get_context("fork")) as ejecutor:
                for bloque, resultado in zip(bloques, ejecutor.map(_calcular_bloque, bloques)):
                    resultados.append(resultado)
                    hechos += len(bloque)
                    if progreso:
                        progreso(hechos, n)
        finally:
            _OBSTACULOS_PROCESO = None
    else:
        for bloque in bloques:
            resultados.append(_calcular_bloque(bloque, obs))
            hechos += len(bloque)
            if progreso:
                progreso(hechos, n)

    if not resultados:
        return np.zeros((0, len(config.CANALES), config.SECTORES), dtype=np.uint8), np.zeros(0)
    return np.concatenate([r[0] for r in resultados]), np.concatenate([r[1] for r in resultados])
