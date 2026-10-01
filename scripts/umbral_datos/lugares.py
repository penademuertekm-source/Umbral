"""Destinos, refugios y placas QR: coordenadas desde el CSV o geocodificadas (sin inventar nada)."""

from __future__ import annotations

from dataclasses import dataclass, field

from . import config
from .red_externa import Geocodificador
from .tablas import escribir_csv, leer_csv, numero, si_no


@dataclass
class ResultadoLugares:
    datos: list[dict]
    geocodificados: list[str] = field(default_factory=list)
    no_encontrados: list[str] = field(default_factory=list)
    sin_coordenadas: list[str] = field(default_factory=list)


def _completar_coordenadas(nombre_csv: str, geocodificador: Geocodificador | None) -> tuple[list[dict], ResultadoLugares]:
    """
    Usa lat/lon del CSV; si faltan y hay `consulta_geocodificacion`, consulta Nominatim y guarda el
    resultado en el mismo CSV (así la próxima vez no se consulta). Si no se encuentra, queda vacío.
    """
    ruta = config.DATOS_PROVISIONALES / nombre_csv
    columnas, filas = leer_csv(ruta)
    resultado = ResultadoLugares(datos=[])
    cambio = False
    for fila in filas:
        lat, lon = numero(fila.get("lat")), numero(fila.get("lon"))
        consulta = fila.get("consulta_geocodificacion", "")
        if (lat is None or lon is None) and consulta and geocodificador is not None:
            encontrado = geocodificador.buscar(consulta)
            if encontrado:
                lat, lon = encontrado
                fila["lat"], fila["lon"] = f"{lat:.6f}", f"{lon:.6f}"
                resultado.geocodificados.append(fila["id"])
                cambio = True
            else:
                resultado.no_encontrados.append(fila["id"])
        if lat is None or lon is None:
            resultado.sin_coordenadas.append(fila["id"])
        fila["_lat"], fila["_lon"] = lat, lon
    if cambio:
        escribir_csv(ruta, columnas, filas)
    return filas, resultado


def _coord(valor: float | None) -> float | None:
    return None if valor is None else round(valor, config.DECIMALES_COORD)


def destinos(geocodificador: Geocodificador | None) -> ResultadoLugares:
    filas, resultado = _completar_coordenadas("destinos.csv", geocodificador)
    resultado.datos = [
        {
            "id": f["id"],
            "nombre": {"es": f["nombre_es"], "en": f["nombre_en"]},
            "tipo": f["tipo"],
            "lat": _coord(f["_lat"]),
            "lon": _coord(f["_lon"]),
            "fuente": f.get("fuente", ""),
            "provisional": si_no(f.get("provisional")),
        }
        for f in filas
    ]
    return resultado


def refugios(geocodificador: Geocodificador | None) -> ResultadoLugares:
    filas, resultado = _completar_coordenadas("refugios.csv", geocodificador)
    resultado.datos = [
        {
            "id": f["id"],
            "nombre": f["nombre"],
            "tipo": f["tipo"],
            "descripcion": {"es": f["descripcion_es"], "en": f["descripcion_en"]},
            "asientos": f["asientos"],
            "agua_potable": f["agua_potable"],
            "cubierto": f["cubierto"],
            "lat": _coord(f["_lat"]),
            "lon": _coord(f["_lon"]),
            "fuente": f.get("fuente", ""),
            "provisional": si_no(f.get("provisional")),
        }
        for f in filas
    ]
    return resultado


def placas() -> ResultadoLugares:
    """Las placas no se geocodifican: su ubicación sale del levantamiento en campo."""
    filas, resultado = _completar_coordenadas("placas_qr.csv", None)
    resultado.datos = [
        {
            "id": f["id"],
            "nombre": f["nombre"],
            "lat": _coord(f["_lat"]),
            "lon": _coord(f["_lon"]),
            "fuente": f.get("fuente", ""),
            "provisional": si_no(f.get("provisional")),
        }
        for f in filas
    ]
    return resultado
