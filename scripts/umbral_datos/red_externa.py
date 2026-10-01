"""Consultas a servicios externos sin clave: Nominatim (geocodificación)."""

from __future__ import annotations

import time

import requests

from . import config


class ErrorRed(RuntimeError):
    """No se pudo llegar a un servicio externo."""


def explicar_error_red(servicio: str, host: str, error: Exception) -> ErrorRed:
    return ErrorRed(
        f"No se pudo consultar {servicio} ({host}): {error}.\n"
        f"Revisa la conexión. En Claude Code en la web, agrega {host} a los dominios permitidos "
        "del entorno (Network access)."
    )


class Geocodificador:
    """Nominatim con User-Agent propio y como máximo 1 consulta por segundo."""

    def __init__(self) -> None:
        self._sesion = requests.Session()
        self._sesion.headers["User-Agent"] = config.USER_AGENT
        self._ultima = 0.0
        self.consultas = 0

    def buscar(self, consulta: str) -> tuple[float, float] | None:
        """Devuelve (lat, lon) del primer resultado, o None si no hay resultados."""
        espera = config.NOMINATIM_PAUSA_S - (time.monotonic() - self._ultima)
        if espera > 0:
            time.sleep(espera)
        try:
            respuesta = self._sesion.get(
                config.NOMINATIM_URL,
                params={"q": consulta, "format": "jsonv2", "limit": 1, "countrycodes": "co"},
                timeout=30,
            )
            respuesta.raise_for_status()
        except requests.RequestException as error:
            raise explicar_error_red("Nominatim", "nominatim.openstreetmap.org", error) from error
        finally:
            self._ultima = time.monotonic()
            self.consultas += 1
        resultados = respuesta.json()
        if not resultados:
            return None
        return float(resultados[0]["lat"]), float(resultados[0]["lon"])
