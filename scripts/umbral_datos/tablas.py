"""Lectura y escritura de los CSV de datos/provisional/ (se editan a mano: se respeta su forma)."""

from __future__ import annotations

import csv
from pathlib import Path


def leer_csv(ruta: Path) -> tuple[list[str], list[dict[str, str]]]:
    """Devuelve (columnas, filas). Las celdas vacías quedan como ''."""
    with ruta.open(encoding="utf-8", newline="") as archivo:
        lector = csv.DictReader(archivo)
        filas = [{k: (v or "").strip() for k, v in fila.items()} for fila in lector]
        return list(lector.fieldnames or []), filas


def escribir_csv(ruta: Path, columnas: list[str], filas: list[dict[str, object]]) -> None:
    with ruta.open("w", encoding="utf-8", newline="") as archivo:
        escritor = csv.DictWriter(archivo, fieldnames=columnas, extrasaction="ignore", lineterminator="\n")
        escritor.writeheader()
        for fila in filas:
            escritor.writerow({k: "" if fila.get(k) is None else fila.get(k) for k in columnas})


def numero(valor: object) -> float | None:
    """Convierte '3,5', '3.5', '12 m' o 7 en float. Devuelve None si no hay número."""
    if valor is None:
        return None
    if isinstance(valor, (int, float)):
        return float(valor) if valor == valor else None  # descarta NaN
    texto = str(valor).strip().lower().replace(",", ".").removesuffix("m").strip()
    if not texto or texto == "nan":
        return None
    try:
        return float(texto.split(";")[0])
    except ValueError:
        return None


def si_no(valor: object) -> bool:
    return str(valor).strip().lower() in {"si", "sí", "yes", "true", "1"}
