"""Pruebas del perfil de horizonte con obstáculos sintéticos (sin red)."""

import math
import unittest

import geopandas as gpd
import numpy as np
from shapely.geometry import Point, box

from umbral_datos import config
from umbral_datos.horizonte import codificar, perfil, preparar_obstaculos, sky_view_factor

CRS = config.CRS_METRICO


def capa_edificios(*edificios):
    return gpd.GeoDataFrame(
        {"altura_m": [h for _, h in edificios]}, geometry=[g for g, _ in edificios], crs=CRS
    )


def sin_capa():
    return gpd.GeoDataFrame({"altura_m": []}, geometry=[], crs=CRS)


def capa_arboles(*arboles):
    return gpd.GeoDataFrame(
        {
            "altura_m": [a["altura"] for a in arboles],
            "diametro_copa_m": [a["copa"] for a in arboles],
            "caducifolio": [a.get("caducifolio", False) for a in arboles],
        },
        geometry=[Point(*a["centro"]) for a in arboles],
        crs=CRS,
    )


def sin_arboles():
    return gpd.GeoDataFrame({"altura_m": [], "diametro_copa_m": [], "caducifolio": []}, geometry=[], crs=CRS)


def sector(azimut_grados):
    return int(azimut_grados // 5)


class PerfilDeHorizonte(unittest.TestCase):
    def test_punto_sin_obstaculos(self):
        obs = preparar_obstaculos(sin_capa(), sin_capa(), sin_arboles())
        radianes = perfil(obs, np.array([0.0, 0.0]))
        self.assertTrue(np.all(radianes == 0))
        self.assertAlmostEqual(sky_view_factor(radianes), 1.0)

    def test_muro_al_oriente(self):
        # Muro de 11,5 m de alto a 5 m al oriente: se ve a atan(10 / 5) = 63,4° hacia el este.
        muro = box(5, -50, 6, 50)
        obs = preparar_obstaculos(capa_edificios((muro, 11.5)), sin_capa(), sin_arboles())
        radianes = perfil(obs, np.array([0.0, 0.0]))
        este = math.degrees(radianes[0, sector(90)])
        self.assertAlmostEqual(este, math.degrees(math.atan2(10, 5)), delta=0.5)
        self.assertEqual(math.degrees(radianes[0, sector(270)]), 0.0)  # occidente despejado
        self.assertGreater(math.degrees(radianes[0, sector(45)]), 0)  # el muro es largo: también al noreste
        self.assertTrue(np.all(radianes[1:] == 0))  # sin árboles

    def test_esquina_entre_rayos(self):
        # Un edificio pequeño y alto, cerca: su esquina debe aparecer aunque caiga entre dos rayos.
        poste = box(3.0, 0.9, 3.4, 1.3)
        obs = preparar_obstaculos(capa_edificios((poste, 20)), sin_capa(), sin_arboles())
        radianes = perfil(obs, np.array([0.0, 0.0]))
        self.assertGreater(radianes[0].max(), math.radians(70))

    def test_copa_de_arbol(self):
        arbol = {"centro": (10, 0), "altura": 10.5, "copa": 8}
        obs = preparar_obstaculos(sin_capa(), sin_capa(), capa_arboles(arbol))
        radianes = perfil(obs, np.array([0.0, 0.0]))
        # Borde de la copa a 6 m: atan(9 / 6) = 56,3° hacia el oriente.
        self.assertAlmostEqual(math.degrees(radianes[1, sector(90)]), math.degrees(math.atan2(9, 6)), delta=0.5)
        self.assertEqual(radianes[1, sector(270)], 0)
        self.assertTrue(np.all(radianes[2] == 0))  # perenne: nada en el canal caducifolio

    def test_bajo_la_copa_de_un_canaguate(self):
        arbol = {"centro": (1, 1), "altura": 10, "copa": 8, "caducifolio": True}
        obs = preparar_obstaculos(sin_capa(), sin_capa(), capa_arboles(arbol))
        radianes = perfil(obs, np.array([0.0, 0.0]))
        self.assertTrue(np.allclose(radianes[2], math.pi / 2))
        self.assertTrue(np.all(radianes[1] == 0))

    def test_alero(self):
        alero = gpd.GeoDataFrame({"altura_m": [3.0]}, geometry=[box(-1, -1, 1, 1)], crs=CRS)
        obs = preparar_obstaculos(sin_capa(), alero, sin_arboles())
        self.assertTrue(np.allclose(perfil(obs, np.array([0.0, 0.0]))[0], math.pi / 2))

    def test_codificacion(self):
        valores = codificar(np.radians(np.array([0.0, 0.24, 0.26, 45.0, 90.0, 95.0])))
        self.assertEqual(valores.dtype, np.uint8)
        self.assertEqual(valores.tolist(), [0, 0, 1, 90, 180, 180])


if __name__ == "__main__":
    unittest.main()
