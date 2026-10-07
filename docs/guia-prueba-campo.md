# Guía de prueba de campo · Sombra predicha frente a sombra observada

Protocolo para validar en la calle lo que Umbral predice: en **10 puntos** y a **4 horas** (10:00 a. m.,
12:00 m., 2:00 p. m. y 4:00 p. m.) se compara el estado que muestra la app con lo que se ve en una foto.
Resultado: un **% de acierto** y la lista de errores que importan.

## Qué se necesita

- Un celular con Umbral abierto desde la dirección publicada (HTTPS):
  https://penademuertekm-source.github.io/Umbral/. Ábrela antes de salir para que quede guardada sin
  conexión.
- Otro celular o cámara con la hora correcta para las fotos (puede ser el mismo).
- La planilla: `docs/plantilla-prueba-campo.csv`, impresa o en el celular. Tiene una fila por punto y hora
  (40 filas).
- Un día de **sol** (cielo despejado o con pocas nubes). Con el cielo cubierto no hay sombras nítidas y la
  observación no sirve para validar.

## Los 10 puntos

Se eligieron con el modelo de la app para que haya de todo: sombra de árboles, sombra de edificios, tramos
siempre al sol, tramos que cambian durante el día y un par de aceras enfrentadas en la misma calle (para
comprobar la acera que recomienda la app). Están a menos de 250 m de la Plaza Alfonso López, así que se
recorren a pie en unos 15 minutos.

La columna "Predicción de referencia" es la del modelo para el **21 de octubre de 2026** a las 10, 12, 2 y 4.
La del día de la prueba puede cambiar un poco, porque el sol se mueve con las fechas. **En la planilla se
anota lo que diga la app ese día.**

| # | Tramo | Acera | Por qué se eligió | Predicción de referencia (10 · 12 · 2 · 4) | Coordenadas (lat, lon) | Arista y lado |
|---|---|---|---|---|---|---|
| 1 | Calle 13C entre Cra. 6 y Cra. 5 | norte | Sombra todo el día por árboles | sombra · sombra · sombra · sombra | 10.479534, -73.245825 | 69 b |
| 2 | Calle 16A entre Cra. 6 y Cra. 5 | norte | Sombra de edificios en la tarde | parcial · parcial · sombra · sombra | 10.476529, -73.243779 | 445 b |
| 3 | Carrera 5 entre Calle 16 y Calle 16A | occidental | Sombra de árboles y edificios juntos | sombra · sombra · sombra · sombra | 10.477039, -73.243692 | 407 a |
| 4 | Carrera 7 entre Calle 16 y Calle 16A | oriental | Al sol todo el día | expuesto · expuesto · expuesto · expuesto | 10.476052, -73.245122 | 91 b |
| 5 | Carrera 6 entre Calle 16 y Calle 16A | oriental | Pasa del sol a la sombra en la tarde | expuesto · expuesto · parcial · sombra | 10.476630, -73.244252 | 369 a |
| 6 | Calle 16A entre Cra. 5 y Cra. 4 | sur | Pasa de la sombra al sol en la tarde | parcial · expuesto · expuesto · expuesto | 10.477099, -73.243000 | 452 a |
| 7 | Calle 16 entre Cra. 7 y Cra. 6 | norte | Sombra parcial todo el día | parcial · parcial · parcial · parcial | 10.476671, -73.244945 | 89 a |
| 8 | Carrera 6 entre Calle 13C y Calle 14 | occidental | Sombra en la mañana y en la tarde, parcial al mediodía | sombra · parcial · parcial · sombra | 10.479042, -73.246007 | 72 b |
| 9 | Calle 16 entre Cra. 6 y Cra. 5 | norte | Par de aceras enfrentadas (1/2): la recomendada | parcial · sombra · sombra · sombra | 10.477175, -73.244187 | 371 a |
| 10 | Calle 16 entre Cra. 6 y Cra. 5 | sur | Par de aceras enfrentadas (2/2): la del frente | expuesto · expuesto · expuesto · sombra | 10.477114, -73.244148 | 371 b |

El punto es la **mitad de la cuadra**, sobre la acera indicada. Las coordenadas se pueden pegar en Google
Maps para ubicarlo. Las aristas sirven para buscar el tramo en los datos (`public/datos/red.geojson`).

## Paso a paso en cada punto y hora

Hazlo dentro de una ventana de **±10 minutos** alrededor de la hora objetivo.

1. **Ubícate** en la mitad de la cuadra, sobre la acera indicada.
2. **Lee la predicción en la app**:
   - Abre el mapa. Si no son exactamente las 10, 12, 2 o 4, mueve el deslizador a esa hora.
   - Toca el tramo. La ficha dice qué acera está protegida y el mapa colorea cada lado:
     - verde continuo: **sombra**;
     - menta discontinuo: **parcial**;
     - ámbar con marca punteada: **expuesto**.
   - Anota en `prediccion_app` el estado de **la acera indicada** (sombra, parcial o expuesto).
3. **Toma la foto**:
   - De pie en el borde de la acera, mirando a lo largo de ella hacia la esquina más cercana, con el
     celular horizontal.
   - Que se vea el piso de la acera unos 20 m hacia adelante.
   - Nombra la foto `P{punto}-{hora}.jpg`, por ejemplo `P4-1400.jpg`, y anota la hora exacta en
     `hora_foto`.
4. **Clasifica lo observado** en la foto. Mira qué parte del **ancho de la acera** está en sombra a lo
   largo de esos 20 m, con las mismas reglas de la app (`src/config/umbrales.ts`):
   - **sombra**: 70 % o más del ancho en sombra.
   - **parcial**: entre 30 % y 70 %.
   - **expuesto**: menos de 30 %.

   Si la sombra cambia mucho a lo largo del tramo, usa el promedio de lo que ves.
5. **Anota el cielo** en la columna `cielo`:
   - *despejado*;
   - *nubes* (pero el sol hace sombras nítidas);
   - *cubierto* (sin sombras nítidas).

   Las filas con cielo *cubierto* no cuentan para el acierto.
6. **Notas**: cualquier sombra que la app no modela, como toldos, carpas de vendedores, carros estacionados
   o un árbol nuevo o podado. También si la acera está en obra o no existe.

Para que la clasificación no dependa de una sola persona: si son dos observadores, cada uno clasifica la
foto por separado sin ver lo del otro. Al final se anota el acuerdo; si no coinciden, decide una tercera
persona.

## Cómo calcular el acierto

Usa solo las filas **válidas**: cielo despejado o con nubes, y con predicción y observación anotadas.

**% de acierto = (filas donde `prediccion_app` = `observado`) ÷ (filas válidas) × 100**

Ejemplo: 34 coincidencias en 38 filas válidas → 34 ÷ 38 × 100 = **89 %**.

Además, arma esta **matriz de confusión**, contando cuántas filas caen en cada casilla:

| Predicho \ Observado | sombra | parcial | expuesto |
|---|---|---|---|
| **sombra** | acierto | error leve | **error grave** |
| **parcial** | error leve | acierto | error leve |
| **expuesto** | **error grave** | error leve | acierto |

- **Errores graves**: la app dijo sombra y estaba al sol, o al revés. Son los que más importan, porque
  pueden mandar a alguien por la acera equivocada. Revisa cada uno con su foto y sus notas.
- **% sin errores graves** = (filas válidas − errores graves) ÷ filas válidas × 100.
- Calcula también el acierto **por hora** (¿falla más al mediodía?) y **por punto** (¿hay un árbol o un
  edificio mal modelado?).

En una hoja de cálculo, si la columna G es `prediccion_app`, la H es `observado` y la I es `cielo`, el
acierto sale con:

```
=CONTAR.SI.CONJUNTO(I2:I41;"<>cubierto";G2:G41;"<>")
=SUMAPRODUCTO((G2:G41=H2:H41)*(I2:I41<>"cubierto")*(G2:G41<>""))
```

La primera fórmula da las filas válidas y la segunda, las coincidencias. El acierto es la segunda dividida
por la primera.

## Qué hacer con los resultados

- Guarda la planilla llena y las fotos (por ejemplo, en `datos/campo/AAAA-MM-DD/`) y anota el resumen en
  `docs/BITACORA.md`.
- Los errores graves que se repiten en un punto suelen venir de un dato provisional. Por ejemplo, la altura
  de un edificio, un alero o la copa de un árbol. Se corrigen en `datos/provisional/` y se vuelve a correr
  `npm run datos` (Fase 11).
- Si el error es parejo en todos los puntos a una hora, revisa los umbrales (`src/config/umbrales.ts`):
  son provisionales.
- Las respuestas de "¿Te sirvió esta ruta?" se exportan en CSV desde **Ajustes** y complementan esta
  prueba con la opinión de quien camina.

## Pruebas del celular en la misma salida

Aprovecha la salida para lo que no se pudo probar en el computador:

- **Instalar la app**: en Chrome, menú ⋮ → *Agregar a la pantalla de inicio*; en Safari, *Compartir* →
  *Agregar a inicio*. Ábrela desde el ícono.
- **GPS en la calle**: haz un recorrido real de la pantalla 06 a la 22 y anota si la instrucción y el aviso
  ámbar llegan a tiempo.
- **Sin conexión**: activa el modo avión y comprueba que el mapa y una ruta siguen funcionando.
- **Lector de pantalla**: TalkBack (Android) o VoiceOver (iPhone) en el mapa, la ficha de un tramo y las
  rutas.
