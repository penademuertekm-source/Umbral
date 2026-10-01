"""Compara la posición del sol de SunCalc (app) con el SPA del NREL (pvlib) para Valledupar."""

from __future__ import annotations

import json
import subprocess
from datetime import datetime

import numpy as np
import pandas as pd
import pvlib

from . import config

MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]


def _vector(azimut_g: np.ndarray, elevacion_g: np.ndarray) -> np.ndarray:
    az, el = np.radians(azimut_g), np.radians(elevacion_g)
    return np.stack([np.cos(el) * np.sin(az), np.cos(el) * np.cos(az), np.sin(el)], axis=-1)


def comparar(lat: float, lon: float, anio: int) -> pd.DataFrame:
    salida = subprocess.run(
        ["node", str(config.RAIZ / "scripts" / "posicion_sol.mjs"), str(lat), str(lon), str(anio)],
        check=True,
        capture_output=True,
        text=True,
        cwd=config.RAIZ,
    )
    suncalc = pd.DataFrame(json.loads(salida.stdout))
    tiempos = pd.DatetimeIndex(pd.to_datetime(suncalc["utc"], utc=True))
    spa = pvlib.solarposition.get_solarposition(tiempos, lat, lon, method="nrel_numpy")

    tabla = pd.DataFrame(
        {
            "hora_local": tiempos.tz_convert("America/Bogota"),
            "az_suncalc": suncalc["azimut"].to_numpy(),
            "el_suncalc": suncalc["elevacion"].to_numpy(),
            "az_spa": spa["azimuth"].to_numpy(),
            # SunCalc 2.x da la elevación aparente (con refracción): se compara con la aparente del SPA.
            "el_spa": spa["apparent_elevation"].to_numpy(),
            "el_spa_geometrica": spa["elevation"].to_numpy(),
        }
    )
    tabla["d_az"] = ((tabla["az_suncalc"] - tabla["az_spa"] + 180) % 360) - 180
    tabla["d_el"] = tabla["el_suncalc"] - tabla["el_spa"]
    tabla["d_el_geometrica"] = tabla["el_suncalc"] - tabla["el_spa_geometrica"]
    producto = np.clip(
        np.sum(_vector(tabla["az_suncalc"], tabla["el_suncalc"]) * _vector(tabla["az_spa"], tabla["el_spa"]), axis=1),
        -1,
        1,
    )
    tabla["separacion"] = np.degrees(np.arccos(producto))
    return tabla


def escribir_reporte(lat: float, lon: float, anio: int, lugar: str = "centro del área de estudio") -> pd.DataFrame:
    tabla = comparar(lat, lon, anio)
    de_dia = tabla[tabla["el_spa"] > 0]
    filas = []
    for mes in range(1, 13):
        datos = de_dia[de_dia["hora_local"].dt.month == mes]
        filas.append(
            f"| {MESES[mes - 1]} | {datos['d_az'].abs().max():.3f} | {datos['d_el'].abs().max():.3f} | "
            f"{datos['d_el_geometrica'].abs().max():.3f} | {datos['separacion'].max():.3f} |"
        )
    peor = de_dia.loc[de_dia["separacion"].idxmax()]
    peor_az = de_dia.loc[de_dia["d_az"].abs().idxmax()]
    texto = f"""# Validación de la posición del sol · SunCalc vs SPA del NREL

Generado por `npm run datos` el {datetime.now().strftime("%Y-%m-%d %H:%M")}.

- **Lugar**: Valledupar, {lugar} ({lat:.5f}, {lon:.5f}).
- **Fechas**: día 15 de cada mes de {anio}, cada hora de 6:00 a 18:00 (hora de Bogotá, UTC−5).
  Se comparan solo las horas con el sol sobre el horizonte ({len(de_dia)} de {len(tabla)}).
- **Referencia**: `pvlib.solarposition.get_solarposition(method="nrel_numpy")` (SPA del NREL, error < 0,0003°).
- **Prueba**: `suncalc` 2.x (la librería que usa la app), con `scripts/posicion_sol.mjs`. Esta versión
  da el azimut en grados desde el norte y la elevación **aparente** (con refracción), así que se compara
  con la elevación aparente del SPA.

## Diferencias máximas por mes (grados)

| Mes | Azimut | Elevación aparente | Elevación vs geométrica (sin refracción) | Separación angular |
|---|---|---|---|---|
{chr(10).join(filas)}

## Resumen

- **Separación angular máxima**: {de_dia['separacion'].max():.3f}° ({peor['hora_local']:%d/%m %H:%M}).
  Es la distancia en el cielo entre los dos soles: la medida que importa para la sombra.
- **Elevación**: diferencia máxima de {de_dia['d_el'].abs().max():.3f}° frente a la elevación aparente del SPA.
- **Azimut**: diferencia máxima de {de_dia['d_az'].abs().max():.3f}° ({peor_az['hora_local']:%d/%m %H:%M},
  elevación {peor_az['el_spa']:.1f}°). Cerca del cenit el azimut cambia muy rápido y una diferencia pequeña
  en el cielo se ve grande en azimut; por eso se reporta también la separación angular.
- **Refracción**: SunCalc 2.x la incluye. Frente a la elevación geométrica (sin refracción) la diferencia
  llega a {de_dia['d_el_geometrica'].abs().max():.3f}°, sobre todo con el sol bajo. Para la sombra conviene
  la aparente: es la dirección desde la que llega la luz.
- **Conclusión**: con sectores de 5° y ángulos guardados en pasos de 0,5°, las diferencias medidas no
  cambian el resultado del modelo.
"""
    (config.DOCS / "validacion-sol.md").write_text(texto, encoding="utf-8")
    return tabla
