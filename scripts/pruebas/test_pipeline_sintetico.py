"""
Prueba de punta a punta del pipeline con una cuadrícula sintética (sin red).
Reemplaza la descarga de OSM y Nominatim, y escribe todo en una carpeta temporal.
"""

import gzip
import json
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import geopandas as gpd
import numpy as np
from shapely.geometry import LineString, Point, box

import construir_datos
from umbral_datos import config, descarga_osm
from umbral_datos.red_externa import Geocodificador

ORIGEN = (497_000.0, 1_158_000.0)  # cerca de Valledupar en UTM 18N


def _a_wgs84(capa: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    return capa.set_crs(config.CRS_METRICO).to_crs(config.CRS_GEOGRAFICO)


def ciudad_sintetica():
    """Tres calles en cada sentido cada 100 m, una manzana de edificios por cuadra y una plaza."""
    x0, y0 = ORIGEN
    lineas, nodos = [], []
    for i in range(3):
        lineas.append(LineString([(x0, y0 + 100 * i), (x0 + 200, y0 + 100 * i)]))
        lineas.append(LineString([(x0 + 100 * i, y0), (x0 + 100 * i, y0 + 200)]))
    calles = gpd.GeoDataFrame(
        {
            "u": range(len(lineas)),
            "v": range(1, len(lineas) + 1),
            "key": 0,
            "highway": ["residential", "tertiary"] * 3,
            "name": [f"Calle {i}" for i in range(len(lineas))],
        },
        geometry=lineas,
    )
    edificios = []
    for cx in (0, 100):
        for cy in (0, 100):
            if (cx, cy) == (100, 100):
                continue  # la cuadra noreste es la plaza
            edificios.append(box(x0 + cx + 8, y0 + cy + 8, x0 + cx + 92, y0 + cy + 92))
    capa_edificios = gpd.GeoDataFrame(
        {
            "element": "way",
            "id": range(len(edificios)),
            "building:levels": ["2", None, "3"],
            "height": [None, "9 m", None],
        },
        geometry=edificios,
    )
    plaza = gpd.GeoDataFrame({"name": ["Plaza de prueba"]}, geometry=[box(x0 + 108, y0 + 108, x0 + 192, y0 + 192)])
    area = Point(x0 + 100, y0 + 100).buffer(160)
    return (
        _a_wgs84(calles),
        _a_wgs84(capa_edificios),
        _a_wgs84(plaza),
        gpd.GeoSeries([area], crs=config.CRS_METRICO).to_crs(config.CRS_GEOGRAFICO).iloc[0],
    )


class PipelineSintetico(unittest.TestCase):
    def test_construye_todos_los_archivos(self):
        calles, edificios, plaza, area = ciudad_sintetica()
        with tempfile.TemporaryDirectory() as tmp:
            tmp = Path(tmp)
            provisionales = tmp / "provisional"
            shutil.copytree(config.DATOS_PROVISIONALES, provisionales)
            (provisionales / "area_estudio.geojson").write_text(
                json.dumps({"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {}, "geometry": area.__geo_interface__}]})
            )
            # Sin filas de árboles: el pipeline debe generarlos y escribir el CSV.
            (provisionales / "arboles.csv").write_text(
                (config.DATOS_PROVISIONALES / "arboles.csv").read_text(encoding="utf-8").splitlines()[0] + "\n"
            )
            (tmp / "docs").mkdir()
            vacio = gpd.GeoDataFrame(geometry=[], crs=config.CRS_GEOGRAFICO)
            with (
                mock.patch.object(config, "DATOS_PROVISIONALES", provisionales),
                mock.patch.object(config, "ARCHIVO_AREA", provisionales / "area_estudio.geojson"),
                mock.patch.object(config, "SALIDA", tmp / "salida"),
                mock.patch.object(config, "DOCS", tmp / "docs"),
                mock.patch.object(config, "CACHE", tmp / "cache"),
                mock.patch.object(descarga_osm, "descargar_calles", return_value=(None, calles)),
                mock.patch.object(descarga_osm, "descargar_edificios", return_value=edificios),
                mock.patch.object(descarga_osm, "descargar_arboles", return_value=vacio),
                mock.patch.object(descarga_osm, "descargar_plazas", return_value=plaza),
                mock.patch.object(Geocodificador, "buscar", return_value=None),
            ):
                construir_datos.construir(validar_sol=True)

            salida = tmp / "salida"
            esperados = {
                "muestras.bin.gz", "muestras.json", "red.geojson", "aceras.geojson", "edificios.geojson",
                "manzanas.geojson", "plazas.geojson", "arboles.geojson", "destinos.json", "refugios.json",
                "placas.json", "meta.json", "clima_config.json",
            }
            self.assertEqual({p.name for p in salida.iterdir()}, esperados)

            indice = json.loads((salida / "muestras.json").read_text())
            self.assertEqual(indice["compresion"], "gzip")
            binario = np.frombuffer(gzip.decompress((salida / indice["archivo"]).read_bytes()), dtype=np.uint8)
            self.assertEqual(binario.size, indice["cantidad"] * 3 * 72)
            self.assertEqual(len(indice["lon"]), indice["cantidad"])
            perfiles = binario.reshape(indice["cantidad"], 3, 72)
            self.assertGreater(perfiles[:, 0].max(), 0)  # los edificios dan sombra
            self.assertGreater(perfiles[:, 1:].max(), 0)  # y los árboles provisionales también

            red = json.loads((salida / "red.geojson").read_text())
            self.assertEqual(len(red["features"]), 6)
            lados = red["features"][0]["properties"]["lados"]
            self.assertEqual([l["lado"] for l in lados], ["a", "b"])

            meta = json.loads((salida / "meta.json").read_text())
            self.assertTrue(meta["datos_provisionales"])
            self.assertGreater(meta["provisionales"]["arboles_provisionales"], 0)
            self.assertEqual(meta["conteos"]["alturas_por_origen"], {"osm_pisos": 2, "osm_altura": 1})

            arboles_csv = (provisionales / "arboles.csv").read_text(encoding="utf-8").splitlines()
            self.assertGreater(len(arboles_csv), 1)
            self.assertIn("provisional", arboles_csv[1])

            reporte = (tmp / "docs" / "reporte-datos.md").read_text(encoding="utf-8")
            self.assertIn("Nominatim no encontró estos destinos", reporte)
            self.assertTrue((tmp / "docs" / "validacion-sol.md").exists())


if __name__ == "__main__":
    unittest.main()
