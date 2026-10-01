"""Pruebas de aceras, orientación y muestreo (sin red)."""

import unittest

import geopandas as gpd
from shapely.geometry import LineString, box

from umbral_datos import config
from umbral_datos.aceras import construir_red, orientacion_cardinal

CRS = config.CRS_METRICO


def aristas(*lineas, tipo="residential"):
    return gpd.GeoDataFrame(
        {"u": list(range(len(lineas))), "v": list(range(1, len(lineas) + 1)), "highway": tipo, "name": "Calle 16"},
        geometry=list(lineas),
        crs=CRS,
    )


def sin_edificios():
    return gpd.GeoDataFrame({"altura_m": []}, geometry=[], crs=CRS)


class Aceras(unittest.TestCase):
    def test_orientacion(self):
        self.assertEqual(orientacion_cardinal(0, 1), "norte")
        self.assertEqual(orientacion_cardinal(1, 0), "oriental")
        self.assertEqual(orientacion_cardinal(0, -1), "sur")
        self.assertEqual(orientacion_cardinal(-1, 0), "occidental")

    def test_calle_este_oeste(self):
        red = construir_red(aristas(LineString([(0, 0), (100, 0)])), sin_edificios())
        self.assertEqual(len(red.lados), 2)
        lado_a = red.lados[red.lados["lado"] == "a"].iloc[0]
        lado_b = red.lados[red.lados["lado"] == "b"].iloc[0]
        # Hacia el este, la izquierda es el norte.
        self.assertEqual(lado_a["orientacion"], "norte")
        self.assertEqual(lado_b["orientacion"], "sur")
        self.assertEqual(lado_a["muestra_cantidad"], 20)  # 100 m / 5 m
        muestras_a = red.muestras.iloc[lado_a["muestra_inicio"] : lado_a["muestra_inicio"] + 20]
        self.assertTrue((muestras_a["y"].round(6) == 4.0).all())
        self.assertAlmostEqual(muestras_a["x"].iloc[0], 2.5)

    def test_acera_que_cae_en_un_edificio_se_acerca_al_eje(self):
        edificio = gpd.GeoDataFrame({"altura_m": [7]}, geometry=[box(0, 3, 100, 20)], crs=CRS)
        red = construir_red(aristas(LineString([(0, 0), (100, 0)])), edificio)
        norte = red.muestras[red.muestras["lado"] == "a"]
        self.assertTrue((norte["desplazamiento_m"] == 2.5).all())
        self.assertFalse(norte["dentro_edificio"].any())

    def test_arista_corta_tiene_una_muestra_por_lado(self):
        red = construir_red(aristas(LineString([(0, 0), (0, 3)])), sin_edificios())
        self.assertEqual(red.lados["muestra_cantidad"].tolist(), [1, 1])
        self.assertEqual(set(red.lados["orientacion"]), {"occidental", "oriental"})


if __name__ == "__main__":
    unittest.main()
