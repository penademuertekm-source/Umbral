"""docs/reporte-datos.md: qué se generó, de dónde salió y cuánto pesa."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path

from . import config


def _kb(bytes_: int) -> str:
    return f"{bytes_ / 1024:,.0f} KB".replace(",", ".")


def _tabla(filas: list[tuple]) -> str:
    return "\n".join(f"| {' | '.join(str(c) for c in fila)} |" for fila in filas)


def escribir(resumen: dict, archivos: list[Path]) -> None:
    c = resumen
    tam_bin = next((a.stat().st_size for a in archivos if a.name.startswith("muestras.bin")), 0)
    meta_ok = "cumple" if tam_bin < config.META_MUESTRAS_BIN_BYTES else "**no cumple**"
    avisos = "\n".join(f"- {a}" for a in c["avisos"]) or "- Ninguno."
    texto = f"""# Reporte de datos · Umbral

Generado por `npm run datos` el {datetime.now().strftime("%Y-%m-%d %H:%M")} en {c['duracion_s']:.0f} s.

## Área de estudio

- Centro: {c['centro_lat']:.5f}, {c['centro_lon']:.5f} · {c['area_km2']:.2f} km²
- Polígono: `datos/provisional/area_estudio.geojson` ({c['area_origen']}).

## Red peatonal

| Dato | Valor |
|---|---|
| Aristas (tramos de calle entre esquinas) | {c['aristas']} |
| Longitud total de ejes | {c['km_ejes']:.1f} km |
| Lados de acera | {c['lados']} |
| Puntos de muestreo (cada {config.SEPARACION_MUESTRAS_M:g} m) | {c['muestras']} |
| Muestras acercadas al eje porque caían en un edificio | {c['muestras_ajustadas']} |
| Muestras que siguen dentro de un edificio | {c['muestras_dentro']} |

Tramos por tipo de vía:

| Tipo | Aristas |
|---|---|
{_tabla(sorted(c['tipos_via'].items(), key=lambda x: -x[1]))}

## Edificios

| Origen de la altura | Edificios |
|---|---|
{_tabla(sorted(c['alturas'].items(), key=lambda x: -x[1]))}
| **Total** | **{c['edificios']}** |

Alturas más frecuentes: {", ".join(f"{h:g} m ({n})" for h, n in c['alturas_frecuentes'])}.

Aleros cargados: {c['aleros']}.

## Árboles

Origen del inventario: **{c['arboles_origen']}**.

| Fuente | Árboles |
|---|---|
{_tabla(sorted(c['arboles_fuente'].items(), key=lambda x: -x[1]))}

| Especie | Árboles |
|---|---|
{_tabla(sorted(c['arboles_especie'].items(), key=lambda x: -x[1]))}

## Lugares

| Capa | Total | Con coordenadas | Geocodificados ahora | No encontrados |
|---|---|---|---|---|
{_tabla(c['lugares'])}

## Perfil de horizonte

- {config.SECTORES} sectores de {360 / config.SECTORES:g}°, radio de {config.RADIO_HORIZONTE_M:g} m, ojo a {config.ALTURA_OJO_M:g} m.
- Canales: {", ".join(config.CANALES)}. Codificación Uint8 en pasos de {config.PASO_CODIFICACION_GRADOS:g}°.
- SVF medio: {c['svf_medio']:.2f} (mín. {c['svf_min']:.2f}, máx. {c['svf_max']:.2f}).
- Tiempo de cálculo: {c['segundos_horizonte']:.0f} s.

## Archivos en `public/datos/`

| Archivo | Tamaño |
|---|---|
{_tabla([(f"`{a.name}`", _kb(a.stat().st_size)) for a in archivos])}

Meta: perfiles de horizonte (`muestras.bin.gz`, comprimido con gzip) de menos de 2 MB → {_kb(tam_bin)}, {meta_ok}.
Sin comprimir ocupan {_kb(c['muestras'] * len(config.CANALES) * config.SECTORES)}.

## Avisos

{avisos}

## Simplificaciones del modelo

- Terreno plano y edificios como prismas de una sola altura.
- Copas de árbol como cilindros; se guarda el borde superior de la copa. El sol bajo que pasa por debajo
  de una copa lejana no se modela.
- Un punto bajo una copa o un alero queda en sombra de ese objeto a cualquier hora.
- La acera está a una distancia fija del eje según el tipo de vía; si cae dentro de un edificio, se acerca
  al eje. El GPS no detecta la acera: la app la recomienda, pero no la verifica.
"""
    (config.DOCS / "reporte-datos.md").write_text(texto, encoding="utf-8")
