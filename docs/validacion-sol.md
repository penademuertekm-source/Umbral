# Validación de la posición del sol · SunCalc vs SPA del NREL

Generado por `npm run datos` el 2026-10-01 08:59.

- **Lugar**: Valledupar, centro del área de estudio (10.47775, -73.24463).
- **Fechas**: día 15 de cada mes de 2026, cada hora de 6:00 a 18:00 (hora de Bogotá, UTC−5).
  Se comparan solo las horas con el sol sobre el horizonte (147 de 156).
- **Referencia**: `pvlib.solarposition.get_solarposition(method="nrel_numpy")` (SPA del NREL, error < 0,0003°).
- **Prueba**: `suncalc` 2.x (la librería que usa la app), con `scripts/posicion_sol.mjs`. Esta versión
  da el azimut en grados desde el norte y la elevación **aparente** (con refracción), así que se compara
  con la elevación aparente del SPA.

## Diferencias máximas por mes (grados)

| Mes | Azimut | Elevación aparente | Elevación vs geométrica (sin refracción) | Separación angular |
|---|---|---|---|---|
| ene | 0.012 | 0.009 | 0.095 | 0.009 |
| feb | 0.019 | 0.075 | 0.494 | 0.075 |
| mar | 0.043 | 0.013 | 0.482 | 0.013 |
| abr | 0.016 | 0.013 | 0.482 | 0.013 |
| may | 0.061 | 0.013 | 0.382 | 0.013 |
| jun | 0.032 | 0.010 | 0.252 | 0.010 |
| jul | 0.024 | 0.007 | 0.210 | 0.007 |
| ago | 0.028 | 0.005 | 0.295 | 0.005 |
| sep | 0.004 | 0.003 | 0.212 | 0.003 |
| oct | 0.002 | 0.003 | 0.206 | 0.003 |
| nov | 0.003 | 0.004 | 0.290 | 0.004 |
| dic | 0.005 | 0.006 | 0.133 | 0.006 |

## Resumen

- **Separación angular máxima**: 0.075° (15/02 18:00).
  Es la distancia en el cielo entre los dos soles: la medida que importa para la sombra.
- **Elevación**: diferencia máxima de 0.075° frente a la elevación aparente del SPA.
- **Azimut**: diferencia máxima de 0.061° (15/05 12:00,
  elevación 81.1°). Cerca del cenit el azimut cambia muy rápido y una diferencia pequeña
  en el cielo se ve grande en azimut; por eso se reporta también la separación angular.
- **Refracción**: SunCalc 2.x la incluye. Frente a la elevación geométrica (sin refracción) la diferencia
  llega a 0.494°, sobre todo con el sol bajo. Para la sombra conviene
  la aparente: es la dirección desde la que llega la luz.
- **Conclusión**: con sectores de 5° y ángulos guardados en pasos de 0,5°, las diferencias medidas no
  cambian el resultado del modelo.
