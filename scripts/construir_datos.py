"""
Construye public/datos/ a partir de OpenStreetMap y de datos/provisional/ (Fase 2).

Uso: npm run datos   (o: scripts/.venv/bin/python scripts/construir_datos.py)
Opciones:
  --sin-validacion-sol   no compara SunCalc con pvlib (más rápido)
  --solo-validacion-sol  solo compara SunCalc con pvlib (no necesita internet)
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from collections import Counter
from datetime import datetime, timezone

import geopandas as gpd
import numpy as np

from umbral_datos import config, descarga_osm, exportar, lugares, reporte, validacion_sol
from umbral_datos.aceras import construir_red
from umbral_datos.arboles import preparar_arboles
from umbral_datos.area import cargar_o_crear_area
from umbral_datos.edificios import asignar_alturas, cargar_aleros
from umbral_datos.horizonte import calcular_perfiles, preparar_obstaculos
from umbral_datos.red_externa import ErrorRed, Geocodificador


_INICIO = time.monotonic()


def paso(texto: str) -> None:
    """Muestra el paso con el tiempo transcurrido, para ver en el registro dónde se va el tiempo."""
    print(f"· [{time.monotonic() - _INICIO:6.0f} s] {texto}…", flush=True)


def a_metrico(capa: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    if capa is None or capa.empty:
        return gpd.GeoDataFrame(geometry=[], crs=config.CRS_METRICO)
    return capa.to_crs(config.CRS_METRICO)


def construir(validar_sol: bool = True) -> None:
    inicio = time.monotonic()
    config.SALIDA.mkdir(parents=True, exist_ok=True)
    config.CACHE.mkdir(parents=True, exist_ok=True)
    descarga_osm.configurar()
    geocodificador = Geocodificador()
    avisos: list[str] = []

    paso("Área de estudio")
    area, area_creada = cargar_o_crear_area(geocodificador)
    area_m = gpd.GeoSeries([area], crs=config.CRS_GEOGRAFICO).to_crs(config.CRS_METRICO).iloc[0]
    # Los obstáculos se descargan con un margen igual al radio del horizonte: un edificio justo afuera
    # del área también da sombra a las aceras del borde.
    area_obstaculos = (
        gpd.GeoSeries([area_m.buffer(config.RADIO_HORIZONTE_M)], crs=config.CRS_METRICO)
        .to_crs(config.CRS_GEOGRAFICO)
        .iloc[0]
    )
    centro = gpd.GeoSeries([area_m.centroid], crs=config.CRS_METRICO).to_crs(config.CRS_GEOGRAFICO).iloc[0]

    paso("Calles de OpenStreetMap")
    _, aristas_osm = descarga_osm.descargar_calles(area)
    paso("Edificios, árboles y plazas de OpenStreetMap")
    edificios_osm = descarga_osm.descargar_edificios(area_obstaculos)
    arboles_osm = descarga_osm.descargar_arboles(area_obstaculos)
    plazas_osm = descarga_osm.descargar_plazas(area)

    paso("Alturas de edificios")
    edificios = asignar_alturas(a_metrico(edificios_osm))
    aleros = cargar_aleros()

    paso("Aceras y puntos de muestreo")
    red = construir_red(a_metrico(aristas_osm), edificios)

    paso("Árboles")
    # osmnx devuelve los polígonos completos aunque salgan del área: se recortan para no sembrar
    # árboles provisionales en parques lejanos.
    plazas = a_metrico(plazas_osm)
    if len(plazas):
        plazas = plazas.assign(geometry=plazas.geometry.intersection(area_m))
        plazas = plazas[~plazas.geometry.is_empty]
    resultado_arboles = preparar_arboles(a_metrico(arboles_osm), red.aristas, plazas, edificios)
    arboles = resultado_arboles.arboles
    if resultado_arboles.escrito_csv:
        avisos.append(
            "Se escribió `datos/provisional/arboles.csv`. Las próximas ejecuciones lo usan tal cual; "
            "bórralo para volver a generar los árboles."
        )

    paso(
        f"Perfiles de horizonte: {len(red.muestras)} puntos, {len(edificios)} edificios, {len(arboles)} árboles"
    )
    t0 = time.monotonic()
    obstaculos = preparar_obstaculos(edificios, aleros, arboles)
    perfiles, svf = calcular_perfiles(
        obstaculos,
        red.muestras[["x", "y"]].to_numpy(float),
        progreso=lambda i, n: print(f"  {i}/{n}", flush=True),
    )
    segundos_horizonte = time.monotonic() - t0

    paso("Destinos, refugios y placas")
    destinos = lugares.destinos(geocodificador)
    refugios = lugares.refugios(geocodificador)
    placas = lugares.placas()
    for nombre, resultado in (("destinos", destinos), ("refugios", refugios), ("placas", placas)):
        if resultado.no_encontrados:
            avisos.append(f"Nominatim no encontró estos {nombre}: {', '.join(resultado.no_encontrados)}.")
        if resultado.sin_coordenadas:
            avisos.append(f"{nombre.capitalize()} sin coordenadas (no aparecen en el mapa): {', '.join(resultado.sin_coordenadas)}.")

    paso("Escribiendo public/datos")
    salida = config.SALIDA
    exportar.escribir_muestras(salida, red.muestras, perfiles, svf)
    exportar.escribir_geojson(
        salida / "red.geojson",
        _aristas_con_lados(red),
        ["id", "u", "v", "nombre", "tipo", "longitud_m", "lados"],
    )
    exportar.escribir_geojson(
        salida / "aceras.geojson",
        red.lados.assign(id=[f"{a}{l}" for a, l in zip(red.lados["arista"], red.lados["lado"])]),
        ["id", "arista", "lado", "orientacion", "muestra_inicio", "muestra_cantidad"],
    )
    edificios_mapa = edificios.copy()
    edificios_mapa["geometry"] = edificios_mapa.geometry.simplify(config.TOLERANCIA_SIMPLIFICAR_M)
    edificios_mapa["altura_m"] = edificios_mapa["altura_m"].round(1)
    exportar.escribir_geojson(salida / "edificios.geojson", edificios_mapa, ["altura_m", "origen_altura"])
    exportar.escribir_geojson(
        salida / "manzanas.geojson", exportar.manzanas_desde_red(red.aristas, area_m), ["id"]
    )
    plazas_mapa = plazas.copy()
    plazas_mapa["nombre"] = plazas_mapa["name"].fillna("") if "name" in plazas_mapa else ""
    exportar.escribir_geojson(salida / "plazas.geojson", plazas_mapa, ["nombre"])
    exportar.escribir_geojson(
        salida / "arboles.geojson",
        arboles,
        ["id", "especie", "altura_m", "diametro_copa_m", "altura_fuste_m", "caducifolio", "meses_sin_hojas", "fuente"],
    )
    exportar.escribir_json(salida / "destinos.json", destinos.datos)
    exportar.escribir_json(salida / "refugios.json", refugios.datos)
    exportar.escribir_json(salida / "placas.json", placas.datos)
    exportar.copiar_clima_config(salida)

    alturas = Counter(edificios["origen_altura"])
    fuentes_arboles = Counter(arboles["fuente"])
    provisionales = {
        "edificios_con_altura_supuesta": int(alturas.get("provisional", 0)),
        "arboles_provisionales": int(fuentes_arboles.get("provisional", 0)),
        "destinos_provisionales": sum(d["provisional"] for d in destinos.datos),
        "refugios_provisionales": sum(r["provisional"] for r in refugios.datos),
        "placas_provisionales": sum(p["provisional"] for p in placas.datos),
    }
    exportar.escribir_json(
        salida / "meta.json",
        {
            "version": 1,
            "generado": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "datos_provisionales": any(v > 0 for v in provisionales.values()),
            "provisionales": provisionales,
            "fuentes": [
                {"nombre": "OpenStreetMap", "atribucion": "© colaboradores de OpenStreetMap", "licencia": "ODbL"},
                {"nombre": "Nominatim", "uso": "geocodificación del área, destinos y refugios"},
                {"nombre": "datos/provisional/*.csv", "uso": "alturas, árboles, aleros, lugares y placas"},
            ],
            "area": {
                "centro": [round(centro.x, 6), round(centro.y, 6)],
                "bbox": [round(v, 6) for v in area.bounds],
                "radio_m": config.RADIO_AREA_M,
            },
            "conteos": {
                "aristas": int(len(red.aristas)),
                "lados": int(len(red.lados)),
                "muestras": int(len(red.muestras)),
                "edificios": int(len(edificios)),
                "arboles": int(len(arboles)),
                "arboles_por_fuente": dict(fuentes_arboles),
                "arboles_por_especie": dict(Counter(arboles["especie"])),
                "alturas_por_origen": dict(alturas),
            },
        },
    )

    if validar_sol:
        paso("Validación del sol: SunCalc vs SPA del NREL")
        validacion_sol.escribir_reporte(centro.y, centro.x, datetime.now().year)

    paso("Reporte")
    archivos = sorted(p for p in salida.iterdir() if p.is_file())
    km = red.aristas["longitud_m"].sum() / 1000
    reporte.escribir(
        {
            "duracion_s": time.monotonic() - inicio,
            "centro_lat": centro.y,
            "centro_lon": centro.x,
            "area_km2": area_m.area / 1e6,
            "area_origen": "creada en esta ejecución" if area_creada else "existente, sin geocodificar",
            "aristas": len(red.aristas),
            "km_ejes": km,
            "lados": len(red.lados),
            "muestras": len(red.muestras),
            "muestras_ajustadas": int((red.muestras["desplazamiento_m"] < _desplazamientos_base(red)).sum()),
            "muestras_dentro": int(red.muestras["dentro_edificio"].sum()),
            "tipos_via": dict(Counter(red.aristas["tipo"])),
            "edificios": len(edificios),
            "alturas": dict(alturas),
            "alturas_frecuentes": Counter(edificios["altura_m"].round(1)).most_common(3),
            "aleros": len(aleros),
            "arboles_origen": resultado_arboles.origen,
            "arboles_fuente": dict(fuentes_arboles),
            "arboles_especie": dict(Counter(arboles["especie"])),
            "lugares": [
                (n, len(r.datos), sum(d["lat"] is not None for d in r.datos), len(r.geocodificados), len(r.no_encontrados))
                for n, r in (("Destinos", destinos), ("Refugios", refugios), ("Placas QR", placas))
            ],
            "svf_medio": float(np.mean(svf)) if len(svf) else 0.0,
            "svf_min": float(np.min(svf)) if len(svf) else 0.0,
            "svf_max": float(np.max(svf)) if len(svf) else 0.0,
            "segundos_horizonte": segundos_horizonte,
            "avisos": avisos,
        },
        archivos,
    )
    print(f"Listo en {time.monotonic() - inicio:.0f} s. Revisa docs/reporte-datos.md y docs/validacion-sol.md.")


def _aristas_con_lados(red) -> gpd.GeoDataFrame:
    lados = {
        (fila.arista, fila.lado): {
            "lado": fila.lado,
            "orientacion": fila.orientacion,
            "muestra_inicio": int(fila.muestra_inicio),
            "muestra_cantidad": int(fila.muestra_cantidad),
        }
        for fila in red.lados.itertuples()
    }
    aristas = red.aristas.copy()
    aristas["lados"] = [[lados[(i, "a")], lados[(i, "b")]] for i in aristas["id"]]
    return aristas


def _desplazamientos_base(red) -> np.ndarray:
    from umbral_datos.aceras import desplazamiento

    tipos = dict(zip(red.aristas["id"], red.aristas["tipo"]))
    return np.array([desplazamiento(tipos[a]) for a in red.muestras["arista"]]) - 1e-9


def solo_validacion_sol() -> None:
    if config.ARCHIVO_AREA.exists():
        from shapely.geometry import shape

        datos = json.loads(config.ARCHIVO_AREA.read_text(encoding="utf-8"))
        centro = shape(datos["features"][0]["geometry"]).centroid
        lat, lon, lugar = centro.y, centro.x, "centro del área de estudio"
    else:
        lat, lon = config.CENTRO_APROXIMADO_VALLEDUPAR
        lugar = "centro aproximado (todavía no existe area_estudio.geojson)"
    paso("Validación del sol: SunCalc vs SPA del NREL")
    validacion_sol.escribir_reporte(lat, lon, datetime.now().year, lugar)
    print("Listo. Revisa docs/validacion-sol.md.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--sin-validacion-sol", action="store_true")
    parser.add_argument("--solo-validacion-sol", action="store_true")
    args = parser.parse_args()
    if args.solo_validacion_sol:
        solo_validacion_sol()
        return 0
    try:
        construir(validar_sol=not args.sin_validacion_sol)
    except ErrorRed as error:
        print(f"\nError de red: {error}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
