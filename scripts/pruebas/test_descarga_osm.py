"""Pruebas de la descarga de OSM sin red: lectura de un .osm pequeño y cambio de servidor de Overpass."""

import tempfile
import unittest
from pathlib import Path
from unittest import mock

from shapely.geometry import box

from umbral_datos import config, descarga_osm

# Una esquina en Valledupar: dos calles que se cruzan, un edificio y un árbol.
OSM = """<?xml version="1.0" encoding="UTF-8"?>
<osm version="0.6" generator="prueba">
  <node id="1" lat="10.4770" lon="-73.2450"/>
  <node id="2" lat="10.4770" lon="-73.2440"/>
  <node id="3" lat="10.4770" lon="-73.2430"/>
  <node id="4" lat="10.4760" lon="-73.2440"/>
  <node id="5" lat="10.4780" lon="-73.2440"/>
  <node id="10" lat="10.4772" lon="-73.2448"/>
  <node id="11" lat="10.4772" lon="-73.2442"/>
  <node id="12" lat="10.4776" lon="-73.2442"/>
  <node id="13" lat="10.4776" lon="-73.2448"/>
  <node id="20" lat="10.4768" lon="-73.2435"><tag k="natural" v="tree"/><tag k="species" v="Mangifera indica"/></node>
  <way id="100"><nd ref="1"/><nd ref="2"/><nd ref="3"/><tag k="highway" v="residential"/><tag k="name" v="Calle 16"/></way>
  <way id="101"><nd ref="4"/><nd ref="2"/><nd ref="5"/><tag k="highway" v="tertiary"/><tag k="name" v="Carrera 7"/></way>
  <way id="200"><nd ref="10"/><nd ref="11"/><nd ref="12"/><nd ref="13"/><nd ref="10"/><tag k="building" v="yes"/><tag k="building:levels" v="2"/></way>
</osm>
"""

AREA = box(-73.2460, 10.4750, -73.2420, 10.4790)


class Respuesta:
    def __init__(self, status: int, contenido: bytes = b""):
        self.status_code = status
        self.reason = "Too Many Requests" if status == 429 else "OK"
        self.content = contenido
        self.text = contenido.decode()

    def raise_for_status(self):
        pass


class DescargaOSM(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.cache = mock.patch.object(config, "CACHE", Path(self.tmp.name))
        self.cache.start()
        descarga_osm.configurar()
        descarga_osm._servidor_que_respondio = None

    def tearDown(self):
        self.cache.stop()
        self.tmp.cleanup()

    def _con_osm(self):
        ruta = Path(self.tmp.name) / "prueba.osm"
        ruta.write_text(OSM, encoding="utf-8")
        return mock.patch.object(descarga_osm, "consultar_overpass", return_value=ruta)

    def test_lee_calles_edificios_y_arboles(self):
        with self._con_osm():
            _, aristas = descarga_osm.descargar_calles(AREA)
            edificios = descarga_osm.descargar_edificios(AREA)
            arboles = descarga_osm.descargar_arboles(AREA)
        self.assertEqual(len(aristas), 4)  # dos calles cortadas en la esquina
        self.assertIn("Calle 16", set(aristas["name"]))
        self.assertEqual(len(edificios), 1)
        self.assertEqual(str(edificios.iloc[0]["building:levels"]), "2")
        self.assertEqual(len(arboles), 1)

    def test_consulta_usa_el_rectangulo(self):
        texto = descarga_osm.consulta('node["natural"="tree"];', AREA)
        self.assertIn("[bbox:10.475000,-73.246000,10.479000,-73.242000]", texto)
        self.assertTrue(texto.rstrip().endswith("out body;"))

    def test_pasa_al_siguiente_servidor_si_uno_responde_429(self):
        llamadas = []

        def post(url, **_):
            llamadas.append(url)
            if "uno" in url:
                return Respuesta(429)
            return Respuesta(200, OSM.encode())

        with (
            mock.patch.object(descarga_osm, "PAUSAS_REINTENTO_S", (0,)),
            mock.patch.dict("os.environ", {"UMBRAL_OVERPASS": "https://uno.example/api,https://dos.example/api"}),
            mock.patch("requests.Session.post", side_effect=post),
        ):
            ruta = descarga_osm.consultar_overpass("prueba", "consulta")
            self.assertTrue(ruta.exists())
            # La segunda consulta empieza por el servidor que respondió.
            descarga_osm.consultar_overpass("otra", "otra consulta")

        self.assertEqual(
            llamadas,
            [
                "https://uno.example/api/interpreter",
                "https://uno.example/api/interpreter",
                "https://dos.example/api/interpreter",
                "https://dos.example/api/interpreter",
            ],
        )

    def test_usa_la_cache(self):
        with (
            mock.patch.dict("os.environ", {"UMBRAL_OVERPASS": "https://dos.example/api"}),
            mock.patch("requests.Session.post", return_value=Respuesta(200, OSM.encode())) as post,
        ):
            descarga_osm.consultar_overpass("prueba", "misma consulta")
            descarga_osm.consultar_overpass("prueba", "misma consulta")
        self.assertEqual(post.call_count, 1)


if __name__ == "__main__":
    unittest.main()
