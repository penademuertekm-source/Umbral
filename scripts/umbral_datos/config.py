"""Parámetros del pipeline. Todo lo ajustable vive aquí."""

from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
DATOS_PROVISIONALES = RAIZ / "datos" / "provisional"
SALIDA = RAIZ / "public" / "datos"
DOCS = RAIZ / "docs"
CACHE = RAIZ / "scripts" / ".cache"

# --- Área de estudio ---
CONSULTA_CENTRO = "Plaza Alfonso López, Valledupar, Colombia"
RADIO_AREA_M = 700
# Solo para validar el sol cuando todavía no existe area_estudio.geojson (a esta escala, 1 km no cambia nada).
CENTRO_APROXIMADO_VALLEDUPAR = (10.4775, -73.2437)
ARCHIVO_AREA = DATOS_PROVISIONALES / "area_estudio.geojson"

# Sistema de coordenadas métrico: UTM zona 18 N (Valledupar está en -73,25°).
CRS_METRICO = "EPSG:32618"
CRS_GEOGRAFICO = "EPSG:4326"

# --- Servicios externos (sin claves) ---
USER_AGENT = "Umbral/0.1 (prototipo academico, Areandina; mapa de sombras de Valledupar)"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_PAUSA_S = 1.1  # política de uso: máximo 1 consulta por segundo

# --- Calles ---
# Se descartan autopistas y vías que no son para caminar.
HIGHWAY_EXCLUIDOS = (
    "motorway|motorway_link|trunk|trunk_link|construction|proposed|abandoned|platform|"
    "raceway|bus_guideway|escape|corridor|elevator|bridleway|cycleway|busway"
)
FILTRO_CALLES = (
    f'["highway"]["area"!~"yes"]["highway"!~"{HIGHWAY_EXCLUIDOS}"]'
    '["footway"!~"sidewalk|crossing"]["service"!~"parking_aisle|driveway"]["access"!~"private"]'
)

# Distancia del eje de la calle a cada acera, por tipo de vía (m). Provisional.
DESPLAZAMIENTO_ACERA_M = {
    "primary": 6.0,
    "secondary": 5.5,
    "tertiary": 4.5,
    "residential": 4.0,
    "unclassified": 4.0,
    "living_street": 3.5,
    "service": 3.0,
    "pedestrian": 3.0,
    "footway": 1.5,
    "path": 1.5,
    "steps": 1.5,
}
DESPLAZAMIENTO_ACERA_DEFECTO_M = 4.0
DESPLAZAMIENTO_MINIMO_M = 0.5  # si la acera cae dentro de un edificio, se acerca al eje hasta aquí
PASO_AJUSTE_ACERA_M = 0.5

# --- Muestreo ---
SEPARACION_MUESTRAS_M = 5.0
ALTURA_OJO_M = 1.5  # altura del peatón

# --- Perfil de horizonte ---
SECTORES = 72  # 5° cada uno
RADIO_HORIZONTE_M = 60.0
PASO_CODIFICACION_GRADOS = 0.5  # Uint8: 0–180 → 0°–90°
CANALES = ("edificios", "arboles_perennes", "arboles_caducifolios")

# --- Alturas ---
ALTURA_PISO_M = 3.5

# --- Árboles provisionales ---
SEMILLA = 20261001  # semilla fija: el resultado es reproducible
FRACCION_LADOS_CON_ARBOLES = 0.40
SEPARACION_ARBOLES_M = (12.0, 25.0)
SEPARACION_ARBOLES_PLAZA_M = 10.0
PROBABILIDAD_ARBOL_PLAZA = 0.6
DISTANCIA_MINIMA_ENTRE_ARBOLES_M = 6.0
RETIRO_ARBOL_HACIA_CALZADA_M = 1.0
# Densidad mínima de árboles de OSM para no generar provisionales (árboles por km de eje de calle).
DENSIDAD_MINIMA_OSM_POR_KM = 10.0
# Mezcla y medidas (CLAUDE.md / PROMPTS.md). "otro" es una suposición del prototipo.
ESPECIES = {
    "mango": {"proporcion": 0.60, "altura": (8.0, 12.0), "copa": (8.0, 12.0), "fuste": 2.5,
              "caducifolio": False, "meses_sin_hojas": ""},
    "canaguate": {"proporcion": 0.25, "altura": (8.0, 12.0), "copa": (6.0, 9.0), "fuste": 3.0,
                  "caducifolio": True, "meses_sin_hojas": "1,2,3"},
    "otro": {"proporcion": 0.15, "altura": (6.0, 10.0), "copa": (5.0, 8.0), "fuste": 2.5,
             "caducifolio": False, "meses_sin_hojas": ""},
}

# Medidas plausibles de un árbol de OSM; fuera de este rango se usa el valor típico de la especie.
RANGO_ALTURA_ARBOL_M = (2.0, 40.0)
RANGO_COPA_ARBOL_M = (1.0, 25.0)

# --- Exportación ---
DECIMALES_COORD = 6  # ~0,1 m
TOLERANCIA_SIMPLIFICAR_M = 0.5
META_MUESTRAS_BIN_BYTES = 2 * 1024 * 1024
