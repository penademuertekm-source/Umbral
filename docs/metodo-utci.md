# Método del UTCI estimado

Este documento explica cómo Umbral estima el UTCI (*Universal Thermal Climate Index*) que se ve en la barra
superior ("UTCI estimado · al sol X° · a la sombra Y°") y que alimenta el semáforo térmico. Todo valor es
una **estimación** a partir del pronóstico de Open-Meteo: no hay sensores.

Código: `src/clima/utci.ts` (cálculo), `src/clima/estado.ts` (clima de la hora elegida) y
`src/config/reglas-semaforo.ts` (niveles). Pruebas: `src/clima/utci.test.ts` y
`src/config/reglas-semaforo.test.ts`.

## 1. Datos de entrada (Open-Meteo)

Se pide el pronóstico horario de hoy y mañana para el centro del área de estudio (nunca la ubicación de la
persona), con `timezone=America/Bogota` y el viento en m/s.

| Variable | Uso | Validez según Open-Meteo |
|---|---|---|
| `temperature_2m` | temperatura del aire (Ta) | instantánea |
| `relative_humidity_2m` | humedad relativa | instantánea |
| `wind_speed_10m` | viento a 10 m (el UTCI se define con el viento a 10 m) | instantánea |
| `direct_normal_irradiance` | radiación directa normal para la ganancia solar | promedio de la hora anterior |
| `shortwave_radiation`, `direct_radiation`, `diffuse_radiation` | se guardan para fases siguientes | promedio de la hora anterior |
| `cloud_cover` | estado "nublado" | instantánea |
| `uv_index` | protección solar (Fase 7) | — |
| `precipitation_probability` | aviso de lluvia del estado nublado | probabilidad de la hora anterior |

Para una hora `t` (por ejemplo 10:15):

- las variables instantáneas se interpolan entre las 10:00 y las 11:00;
- las de "hora anterior" se toman del registro de las 11:00, que cubre de 10:00 a 11:00.

## 2. UTCI a la sombra

Se usa la aproximación polinómica del UTCI de Bröde et al. (2012), tal como la implementa la librería
`jsthermalcomfort` (MIT, Center for the Built Environment, UC Berkeley).

- **Simplificación:** a la sombra, la temperatura radiante media (Trm) es igual a la del aire.
  En la realidad, las fachadas y el suelo calientes suben la Trm también a la sombra, así que el valor de
  sombra tiende a quedarse corto en la tarde.
- El modelo solo es válido con viento entre 0,5 y 17 m/s. En las calles del centro el viento suele ser
  menor que el de 10 m; si el pronóstico da menos de 0,5 m/s, se usa 0,5 m/s.
- Fuera del rango del modelo (por ejemplo, Ta > 50 °C) no se muestra ningún valor ("—").

## 3. UTCI al sol

Al sol se suma la ganancia solar a la Trm con **SolarCal** (ASHRAE 55, apéndice C), también de
`jsthermalcomfort`:

```
Trm(sol) = Ta + ΔTrm
ΔTrm = ERF / (hr · feff)        (hr = 6 W/m²K)
```

Supuestos (constante `SUN_EXPOSURE` en `src/clima/utci.ts`), todos **provisionales**:

| Parámetro | Valor | Por qué |
|---|---|---|
| Postura | de pie | la persona camina |
| SHARP (ángulo del sol respecto al frente) | 90° | sol de costado: la dirección de la marcha cambia en cada calle |
| Fracción de cielo visible (`f_svv`) | 1 | persona al sol en un espacio abierto (caso desfavorable) |
| Fracción del cuerpo al sol (`f_bes`) | 1 | sin nada que la cubra |
| Transmitancia | 1 | sin vidrio ni toldo |
| Absortividad de onda corta | 0,7 | valor de ASHRAE 55 cuando no hay más datos |
| Albedo del suelo | 0,2 | asfalto (0,05–0,20) y concreto (0,10–0,35) según Oke (1987), *Boundary Layer Climates*, tabla 1.1 |

**Por qué 0,2 y no 0,6.** ASHRAE 55 usa 0,6 por defecto porque está pensado para interiores. Con 0,6, un
mediodía típico de Valledupar (34 °C, 50 %, 2,5 m/s, sol a 75°, 850 W/m²) daría ΔTrm ≈ 58 °C y un UTCI
al sol de ≈ 48 °C. Con 0,2 da ΔTrm ≈ 34 °C y UTCI ≈ 42 °C, del orden de los ejemplos de la pantalla 17.

Otras simplificaciones:

- SolarCal estima la radiación difusa como el 20 % de la directa (supuesto de interiores de ASHRAE). Con
  cielo despejado se parece a la difusa real; con nubes la subestima. Por eso, con nubosidad alta, el valor
  "al sol" se acerca al de sombra y la app pasa al estado "nublado".
- La aproximación del UTCI acepta Trm − Ta entre −30 y +70 °C; si SolarCal diera más de 70 °C, se usa 70 °C.
  (La documentación de la librería dice "+30", pero su código y Bröde et al. usan +70.)
- La elevación del sol se calcula con SunCalc para la hora exacta; la radiación es el promedio de la hora.

## 4. Del UTCI al semáforo

Categorías del UTCI: sin estrés < 26 · moderado 26–32 · fuerte 32–38 · muy fuerte 38–46 · extremo > 46 (°C).

| Categoría (UTCI al sol) | Nivel |
|---|---|
| sin estrés o moderado | Cómodo |
| fuerte | Precaución |
| muy fuerte | Evitar a pie |
| extremo | No recomendado |

- **El Niño activo** (`el_nino_activo` en `clima_config.json`) endurece un nivel cuando ya hay estrés
  fuerte o más.
- **Perfil vulnerable** (pantalla 23, Fase 9) endurece un nivel siempre.
- **Nublado**: con nubosidad ≥ 80 % el chip dice "Nublado · riesgo bajo", salvo que el nivel, ya
  endurecido, pase de "Precaución" (en ese caso se muestra el nivel de calor).
- **Nivel de ruta** (Fase 6): UTCI = sombra + (sol − sombra) × min(1, minutos al sol / 10).

Todos estos umbrales viven en `src/config/reglas-semaforo.ts` y se calibran con las mediciones de campo.

## 5. Validación

`src/clima/utci.test.ts` compara con las tablas de validación de pythermalcomfort y jsthermalcomfort
(repositorio `validation-data-comfort-models`, licencia MIT):

- `ts_utci.json`: 9 casos de la aproximación de Bröde et al. (2012), tolerancia 0,1 °C.
- `ts_solar_gain.json`: 3 ejemplos de ASHRAE 55-2017 (de pie y sentado), tolerancia 0,1 °C.

## Referencias

- Bröde, P., Fiala, D., Błażejczyk, K., et al. (2012). Deriving the operational procedure for the Universal
  Thermal Climate Index (UTCI). *International Journal of Biometeorology*, 56(3), 481–494.
- ANSI/ASHRAE Standard 55-2020. *Thermal Environmental Conditions for Human Occupancy*, apéndice C (SolarCal).
- Arens, E., Hoyt, T., Zhou, X., et al. (2015). Modeling the comfort effects of short-wave solar radiation
  indoors. *Building and Environment*, 88, 3–9.
- Oke, T. R. (1987). *Boundary Layer Climates* (2.ª ed.). Routledge.
- Tartarini, F., Schiavon, S. (2020). pythermalcomfort: A Python package for thermal comfort research.
  *SoftwareX*, 12, 100578. (jsthermalcomfort es su versión en JavaScript.)
