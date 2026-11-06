# Cambios de interfaz (rediseño, octubre de 2026)

Lista única de cambios de la interfaz después de la prueba de la autora (observaciones 1 a 4 en
`docs/observaciones-autora.md`). La comparten Claude (chat), que hace Figma, la especificación y la revisión,
y Claude Code, que hace el código. Las reglas para trabajar juntos están en CLAUDE.md, sección
"Trabajo con Claude (chat)".

**Estados:** `pendiente` → `en Figma` → `listo para código` → `hecho` → `verificado`.

- Claude (chat) pasa un punto a `listo para código` cuando su pantalla está terminada en Figma y la
  especificación tiene el nodo.
- Claude Code lo pasa a `hecho` en el mismo commit del cambio.
- Claude (chat) lo pasa a `verificado` después de revisarlo en el enlace publicado.

**Prioridad:** P1 = contradicción o error que quita confianza · P2 = composición y claridad · P3 = puede esperar.
**Dónde:** F = Figma · C = código · D = datos.

Fuera de esta lista: la prueba de campo de la sombra (hoja en preparación) y las placas QR (pantallas 08,
12 y `/placas`), que siguen en pausa.

## Decisiones de la autora (2026-10-08)

| Tema | Decisión |
|---|---|
| Reparto del trabajo | Claude Code hace todo el código. Claude (chat) hace Figma, la especificación, los prompts y la revisión del enlace publicado |
| Barra inferior | Sí: barra con texto (Mapa · Ir a · Descansar · Ajustes). Sobre el mapa solo queda "Mi ubicación" |
| Mapa nublado | La sombra se muestra atenuada con el aviso de nublado; no se oculta |
| Atribución | Fuera del mapa, en Ajustes › Créditos. Para cumplir la guía de OpenStreetMap se muestra también al abrir la app (pantalla de inicio) y el mapa conserva un botón ⓘ pequeño que lleva a Créditos |
| `design/` | Autorizado tocarlo para separar los colores de Precaución y Evitar y para pasar las medidas a unidades relativas |
| Sugerencias del docente (2026-10-16) | Se construyen S1 (Mis lugares), S2 (Agenda de salidas) y S3 (Metas de sol evitado), en sus versiones sin servidor. Compartir y comunidad, y parquear a la sombra quedan fuera por ahora. Tienen prioridad: los pasos R2 a R6 quedan en pausa |
| Barra inferior (2026-10-16) | La cuarta pestaña pasa de "Ajustes" a "Perfil"; Ajustes queda dentro de Perfil |
| Reglas (2026-10-16) | Privacidad: se guardan en el teléfono los lugares, las salidas y los totales de sol evitado, nunca el camino hecho con el GPS. Honestidad: todo lo simulado dice "Ejemplo · simulación" |

## 1. Cambios en todas las pantallas

| N.º | Cambio | Prior. | Dónde | Estado |
|---|---|---|---|---|
| G1 | Chip fijo "Estimado · 12:00 ⓘ" en lugar de la línea gris "Valores estimados… · Datos provisionales" repetida en 8 pantallas. La ⓘ abre una hoja con "Datos provisionales" y las fuentes | P1 | F C | hecho en 04; el resto con su paso |
| G2 | Calor y cielo por separado ("▲ Calor fuerte · Nublado"). Quita el "riesgo bajo" junto a 37° | P1 | C | pendiente |
| G3 | Las mismas cifras en todo el viaje: la ruta se calcula una vez y la leen 05, 06, 13, 15 y 16 | P1 | C | hecho |
| G4 | Vocabulario: "andén" (no "acera"), "cuadra" (no "tramo"), "sensación térmica" (no "UTCI") y "Dónde descansar". "Puntos de permanencia" se mantiene en la documentación | P1 | C | pendiente |
| G5 | Sin jerga a la vista: el Sky View Factor va plegado en "Detalles técnicos"; "px" y "CSV" van a la sección del equipo | P1 | C | pendiente |
| G6 | Avisos en tres niveles: alerta (interrumpe, solo al iniciar un recorrido), aviso (franja en la hoja inferior) y dato (chip). Uno a la vez, con contador "+1"; después de leído se recoge en un chip, no desaparece | P2 | F C | pendiente |
| G7 | Un botón principal por pantalla y orden fijo: respuesta → acción → detalles plegados → letra pequeña | P2 | F C | pendiente |
| G8 | Frases de 12 palabras como máximo, botones que empiezan con verbo, el mismo texto para la misma acción | P2 | C | pendiente |
| G9 | Ningún ícono sin su palabra | P2 | F C | pendiente |
| G10 | Atribución fuera del mapa (ver decisiones): inicio + ⓘ en el mapa + Ajustes › Créditos | P2 | F C | hecho |
| G11 | Medidas en rem y hoja inferior en porcentaje del alto de pantalla | P3 | C | pendiente |
| G12 | Computador: mapa grande con panel lateral | P3 | F C | pendiente |

## 2. Cambios por pantalla

| N.º | Pantalla | Cambio | Prior. | Dónde | Estado |
|---|---|---|---|---|---|
| 04-1 | Mapa | Leyenda: parcial y expuesto se distinguen también por el trazo, no solo por el color | P1 | F C | hecho |
| 04-2 | Mapa | El aviso de lluvia encuadra el lugar cubierto que menciona | P1 | C | pendiente |
| 04-3 | Mapa | "Sin clima" con mensaje propio, no "al sol — · a la sombra —" | P1 | C | listo para código |
| 04-4 | Mapa | El botón principal siempre con el mismo texto | P1 | C | pendiente |
| 04-5 | Mapa | Hoja inferior de tres alturas que recoge leyenda, aviso y ficha | P2 | F C | hecho |
| 04-6 | Mapa | Encabezado de una línea; al tocar la hora se abre el deslizador | P2 | F C | hecho |
| 04-7 | Mapa | Nombres de calles, 5 o 6 lugares de referencia y vista inicial con la persona y la plaza | P2 | F C | hecho |
| 04-8 | Mapa | Solo "Mi ubicación" flotante; lo demás a la barra inferior | P2 | F C | hecho |
| 04-9 | Mapa | Los grupos de árboles se identifican como tales (ícono o leyenda) | P2 | F C | hecho |
| 04-10 | Mapa (20) | El nublado pasa a ser un estado de la 04, con la sombra atenuada y el aviso Nublado en gris (decisión de la autora, 2026-10-16) | P2 | F C | hecho |
| 05-1 | Buscar | Destinos fuera del mapa (Mercado, Casa Beto Murgas) ofrecen "Cómo llegar"; hoy terminan en un mensaje sin salida | P1 | C | listo para código |
| 06-1 | Rutas | "Ruta con más sombra" en lugar de "Ruta con sombra" | P1 | C | listo para código |
| 06-2 | Rutas | El conteo de árboles pasa a los detalles | P2 | C | listo para código |
| 06-3 | Rutas | Cada tarjeta muestra la muestra de su línea del mapa | P2 | F C | listo para código |
| 07-1 | Ficha | Cuadras sin nombre nombradas por sus esquinas (observación 1) | P1 | C D | hecho |
| 07-2 | Ficha | "Sensación térmica" en lugar de UTCI; Sky View Factor plegado | P1 | C | hecho |
| 09-1 | El Niño | Revisar en la primera pasada (no revisada aún) | P2 | — | pendiente |
| 10-1 | Dónde descansar | El Callejón no dice "sombra continua" junto a "Al sol a esta hora"; se describe lo de ahora | P1 | C | listo para código |
| 10-2 | Dónde descansar | Los mismos íconos en el mapa y en la lista | P2 | F C | listo para código |
| 11-1 | Ajustes | "Letra más grande" sin "px"; CSV en "Para el equipo de investigación"; entradas a "Acerca de y créditos" y "Cómo leer el mapa" | P2 | F C | listo para código |
| 13-1 | Recorrido | Indicaciones con referencias, no con puntos cardinales | P1 | C | listo para código |
| 13-2 | Recorrido | Andén recomendado resaltado en el mapa; solo la próxima indicación; barra de progreso que avanza | P2 | F C | listo para código |
| 15-1 | Cuándo salir | "Mañana" → "En la mañana" | P1 | C | listo para código |
| 15-2 | Cuándo salir | Leyenda solo con los niveles presentes; explicar las franjas verdes | P2 | F C | listo para código |
| 16-1 | Sin ruta | "A esta hora la ruta va casi toda al sol"; cifra principal: minutos al sol | P1 | C | listo para código |
| 17-1 | Semáforo | Colores de Precaución y Evitar más distintos: Precaución #a87c00 y Evitar #d4581a (ΔE2000 de 7,5 a ≈ 23; ambas formas ≥ 3:1). Evitar deja de ser alias de exposición, que sigue en #ef9f27 | P2 | F C | listo para código |
| 18-19 | Antes de salir | Las pantallas 18 y 19 se unen en una sola hoja | P2 | F C | listo para código |
| 21-1 | Fuera del centro | Revisar la ubicación de nuevo: hoy dice "Estás fuera" a 290 m de la plaza | P1 | C | listo para código |
| 21-2 | Fuera del centro | Mapa real de la ciudad (OpenFreeMap) y botón "Ya llegué al centro" (observación 4) | P2 | F C | listo para código |
| 23-1 | Perfil de calor | Una descripción compartida en lugar de repetirla cuatro veces | P2 | F C | listo para código |

Sin cambios: 01, 02, 14 y 22. En pausa: 08 y 12.

## 3. Pantallas y componentes nuevos

| N.º | Qué | Prior. | Estado |
|---|---|---|---|
| N1 | Componentes: hoja inferior (3 alturas), avisos (alerta, aviso, dato recogido, contador), barra inferior, chip "Estimado". En Figma, página 03: nodos 104:137, 105:161, 105:315 y 105:328; revisión en 105:329. Se aplican en código junto con la pantalla 04 | P2 | hecho |
| N2 | Cómo leer el mapa (primera vez; se puede saltar y volver a abrir) | P2 | listo para código |
| N3 | Noche: "Ya no hay sol" y ver el día siguiente | P2 | listo para código: selector Mañana (113:836) y noche (126:1299) |
| N4 | Estados: calculando, sin clima, GPS perdido durante el recorrido | P2 | listo para código |
| N5 | Permiso bloqueado: pasos para Android y para iPhone, botón "Volver a intentar" (observación 3) | P2 | listo para código |
| N6 | Acerca de y créditos: autores, docente, Areandina, licencia, privacidad, fuentes y atribuciones | P2 | listo para código |
| N7 | Comprobaciones: 04, 06 y 13 en celular pequeño, letra grande e inglés; 04 en computador | P3 | en Figma: celular pequeño, letra grande e inglés hechos (falta decidir la barra inferior con letra grande); falta 04 en computador |

## 3b. Sugerencias del docente (S1 a S3)

Principio para las tres ("menor resistencia": que la persona esté cómoda): sin registro ni contraseña, lo ya
hecho se repite con un toque, máximo tres toques para cualquier acción y un solo botón "Borrar mis datos".

| N.º | Qué | Figma | Código | Estado |
|---|---|---|---|---|
| S0 | Barra inferior: Mapa · Ir a · Descansar · **Perfil** | Barra y pestaña Perfil | Ruta /perfil; Ajustes pasa a /perfil/ajustes (o queda en /ajustes, enlazado desde Perfil) | hecho |
| S1 | Mis lugares: perfil en el teléfono, lugares guardados con su ruta con sombra, "Ir con sombra" de un toque | Perfil · Mis lugares (y vacío) · Guardar lugar en 06 · "Tus lugares" en 05 · cambiar nombre y borrar | Módulo de guardado local, CRUD de lugares, enlace con 05 y 06, "Borrar mis datos" | hecho |
| S2 | Agenda de salidas: "quiero llegar a las…", hora de salida con más sombra, calendario del teléfono | Planear salida · resultado · Mis salidas (y vacío) · aviso "Es hora de salir" | Cálculo hacia atrás con la lógica de 15, archivo .ics, aviso dentro de la app | hecho |
| S3 | Metas de sol evitado: progreso (sol evitado, nivel, retos), colecciones (Pasaporte del centro, Álbum de la sombra) y premios (logros; beneficios y meta de la comunidad simulados) | Logros · Pasaporte · detalle del sello · Álbum · 22 con premios · Premios de ejemplo · interruptor en Ajustes | Suma del sol evitado en cada llegada, reglas de logros en `src/config/`, beneficios simulados en archivo aparte | hecho |

Regla de S3: ninguna meta premia distancia ni salir entre 11 a. m. y 3 p. m.

## 4. Datos que la interfaz necesita

| N.º | Qué | Quién | Estado |
|---|---|---|---|
| D1 | Ubicación exacta y cómo llegar: Mercado público y Casa Beto Murgas | Autora | pendiente |
| D2 | Ubicación del Callejón de la Purrututú (destino y refugio) | Autora | pendiente |
| D3 | Nombres de las cuadras sin nombre: automáticos por esquinas; la autora completa las del núcleo | Claude Code + autora | pendiente |
| D4 | Créditos (¿Kevin Mueges?) y licencia | Autora | pendiente |

## 5. Arreglos en Figma

| N.º | Qué | Estado |
|---|---|---|
| F1 | Estilo Micro de 13 a 15 px. También se pasaron al estilo Micro los 53 textos sueltos de 13 px de la página "02 · Pantallas" | hecho (2026-10-08) |
| F2 | Revisar la organización de páginas: están las tres ("01 · Sistema e identidad", "02 · Pantallas", "03 · Iconografía y estilo gráfico"); no hace falta reorganizar | hecho (2026-10-08) |
| F3 | Pantallas al día con lo que ya tiene el código | pendiente |

## Notas de Claude Code

Aquí Claude Code anota contradicciones o dudas que encuentre al aplicar un punto.

**Paso R1a (2026-10-16): decisiones de la autora sobre el plan**

1. **G1 solo en el mapa por ahora.** El chip estimado reemplaza en la 04 al chip "Datos provisionales"; las
   otras pantallas conservan su línea "Valores estimados…" hasta su propio paso. Estado de G1: "hecho en 04;
   el resto con su paso".
2. **Créditos como sección de Ajustes** (`/ajustes#creditos`), no como la pantalla N6. Cuando llegue N6, el
   botón ⓘ del mapa apuntará a esa pantalla.
3. **Aviso recogido** con los colores del nivel de origen, en forma de chip (así está en Figma).
4. **Grosor de los andenes no fijo:** 4 px en el zoom con que abre el mapa (16,5), unos 2 px al alejar
   (zoom 14) y unos 6 px al acercar (zoom 19). Las rayas y los puntos escalan con el grosor (MapLibre mide
   los guiones en grosores de línea), así que conservan su forma. Al alejar, los dos andenes de una calle
   se separan un poco más con `line-offset` para que no queden pegados.
5. **06, 10 y 13 conservan el trazo viejo** (ámbar con marca punteada) hasta su propio paso (06-3): su mapa
   no comparte capas con la 04.

**Paso P1 (2026-10-16): decisiones de la autora y notas**

1. **Dónde va la barra inferior.** El mapa todavía no la tiene: eso es R1b, que está en pausa. Por ahora va
   en Perfil, en sus páginas, en Ajustes, en Buscar (05, "Ir a") y en Dónde descansar (10, "Descansar").
   El mapa conserva su diseño y su botón flotante de ajustes pasa a ser Perfil.
2. **Páginas provisionales desde Perfil.** "Cómo leer el mapa" (`/perfil/como-leer`), "Cómo se calcula la
   sombra" (`/perfil/como-se-calcula`) y "Acerca de y créditos" (`/perfil/acerca`) son páginas sencillas
   hechas con los textos que estaban en Ajustes, hasta que lleguen N2 y N6. El botón ⓘ del mapa ya lleva a
   `/perfil/acerca`.
3. **Ajustes conserva su lista actual** y suma "Tus datos" al final. El reordenamiento en grupos de la
   Figma 124:1034 es 11-1, que va en otro paso.
4. **Duda: las respuestas de "¿Te sirvió esta ruta?".** "Borrar mis datos" no las borra, porque la
   especificación nombra lugares, salidas, logros y nombre. Esas respuestas se exportan en CSV para la
   investigación. ¿Deben borrarse también?
5. En el código, `borrarMisDatos()` se llama `deleteMyData()` (`src/perfil/almacen.ts`), porque CLAUDE.md
   pide identificadores en inglés.

**Paso P2 (2026-10-16): decisiones de la autora y notas**

1. **Se guarda el punto de partida de cada salida.** Es el punto que había al planear, no el camino, y se
   borra con "Borrar mis datos". La especificación no lo guardaba: sin él, al abrir la app en otro lugar las
   cifras cambiarían.
2. **"Quiero llegar a las" usa el selector de hora del teléfono**, en pasos de 5 minutos. El deslizador de
   la 04 solo va de 6 a. m. a 6 p. m. en cuartos de hora.
3. **"Ver la ruta" (y el enlace del calendario) abren la 06 aproximada.** Usan la hora de salida redondeada
   al cuarto de hora y el día de hoy, porque la 06 solo trabaja con el día de hoy, de 6 a. m. a 6 p. m. Para
   otro día es una aproximación.
4. **El ícono Calendario (146:331) no está en `design/iconos/`.** El estado vacío de Mis salidas usa el
   ícono Reloj. Si se quiere el de Figma, hace falta su SVG.
5. **El aviso "Es hora de salir" va sobre la leyenda del mapa actual.** La hoja de tres alturas llega con
   R1b. Mientras tanto convive con los avisos de nublado y El Niño, que todavía no usan el componente Aviso.
6. **En la 15, "Guardar en mi agenda" guarda directo la salida sugerida.** Toma el inicio de la ventana
   desde el punto de partida de ese momento, calcula la llegada como la salida más la duración y abre Mis
   salidas.
7. **Las salidas siguen guardadas hasta 10 minutos después de su hora**, para que se vea el aviso. Las
   siguientes veces que se abre la app ya se borran.

**Paso P3a (2026-10-16): decisiones de la autora y notas**

1. **Los recorridos en modo simulación cuentan** para el sol evitado, los retos y los logros, pero cada
   llegada queda marcada `simulated`. Logros dice cuántas fueron simuladas, y "Borrar mis datos" las borra.
2. **La llegada se registra en la 13, al terminar el recorrido**, y la 22 la recibe con `?llegada=<id>`.
   Así recargar la 22 no la cuenta dos veces.
3. **Los logros no se guardan aparte**: se calculan con las llegadas, las fechas de las salidas planeadas y
   las respuestas. Así "Borrar mis datos" los deja en cero. El campo `achievements` queda sin uso por ahora.
4. **Íconos**: Figma usa un sol y un calendario que no están en `design/iconos/`. Se usan Al sol
   (`expuesto`), Reloj, Nublado (Tarde fresca) y Destino (Planear, Planificador). Si se quieren los de
   Figma, hacen falta sus SVG.
5. **La nueva 22 (152:2798) ya no trae** las tres cifras en cuadros ni el "Para quedarte" de la 35:84; el
   resumen va en una línea bajo el título. Si el destino está en Mis lugares, el título usa el nombre que
   le puso la persona.
6. **Con "Logros y retos" apagado**, la 22 oculta toda la tarjeta del sol evitado y del reto, y quedan el
   resumen y la pregunta. Las llegadas se siguen registrando: al volver a encender el interruptor, el
   progreso está completo.

**Paso P3b (2026-10-16): notas**

1. **Hoy no se pueden ganar 3 de los 6 sellos.** Casa Beto Murgas, Mercado público y Parque de la Leyenda
   están fuera del mapa de sombra, así que ningún recorrido llega a ellos, y se ven "Por descubrir". Se
   podrán ganar cuando haya cómo llegar a esos lugares (05-1, D1).
2. **La lámina Alero tampoco se puede ganar todavía.** `datos/provisional/aleros.csv` no tiene filas, y los
   aleros no se publican por cuadra en `public/datos/`. El código ya los espera: es `EAVES_EDGES` en
   `src/app/recorrido/laminas.ts`.
3. **El Álbum usa una regla aproximada.** El motor dice si la sombra de un andén es de edificios, de
   árboles o de ambos, pero no de qué árbol. La especie se deduce de los árboles a menos de 12 m de la
   cuadra. Va dicho en el código y en la pantalla.
4. **Sellos y láminas no se guardan aparte**: salen de las llegadas, que guardan sus láminas. Así "Borrar
   mis datos" los borra con las llegadas. Los campos `stamps` y `cards` del perfil quedan sin uso.
5. **`premios.json` solo trae números, niveles y códigos.** Los textos de los premios de ejemplo están en
   i18n (`premios.ejemplo`), porque la regla 4 pide que todo texto visible salga de ahí.
6. **"Ver en el mapa"** (detalle del sello) abre la ruta hacia ese lugar (06), que muestra el lugar en el
   mapa. La 04 todavía no centra un lugar elegido.

**Paso R1b (2026-11-06): notas**

1. **Datos de la autora en pausa.** Por decisión de la autora, D1 a D4 quedan en pausa; R1b a R6 siguen sin
   ellos.
2. **Las isócronas quedan sin entrada (04-8).** Su botón redondo salió del mapa y no tienen pestaña en la
   barra inferior. Por decisión de la autora no se ponen en otro lugar por ahora. La capa sigue funcionando
   con `/mapa?capa=isocronas`, para cuando se decida su sitio en Figma.
3. **04-5 y 04-6 van en un solo commit.** Comparten el mismo bloque de la pantalla: la sensación térmica sale
   del encabezado (04-6) y entra en la hoja (04-5). Separados, el enlace de prueba habría quedado un rato
   sin ese dato.
4. **La hoja asomada es una variante de `HojaInferior`** (`embedded`): va al pie del mapa, encima de la
   barra inferior, sin ✕ y sin comportarse como diálogo. Al abrir una cuadra, la ficha ocupa su lugar
   (la ficha nueva es del paso R1c).
5. **El deslizador de hora va en su hoja media**, con la hora grande y la nota de Figma 113:836. El
   selector Hoy · Mañana y "Volver a ahora" quedan para R1c, como dice el prompt.
6. **04-10: el pronóstico de lluvia sigue a la vista.** Va como segundo aviso (nivel Aviso, ícono Lluvia),
   detrás del contador "+1" del aviso Nublado, con "Te mostramos lugares cubiertos cerca." Los lugares
   cubiertos se encuadran encima de la hoja. Encuadrar el lugar que nombra el aviso es 04-2, que sigue
   pendiente.
7. **Celular pequeño (N7).** A 360 × 640, con el aviso Nublado abierto la hoja asomada deja unos 140 px de
   mapa. Sin aviso quedan unos 300. Conviene revisarlo en Figma junto con la letra grande.
8. **Un solo aviso en la hoja (G6).** "Es hora de salir" (`useAvisoSalida`), Nublado y la lluvia van en el
   mismo componente `Aviso`, en ese orden: se ve uno y el contador "+N" abre los demás.
9. **04-7: los nombres de calles son etiquetas HTML, no texto de MapLibre.** Escribir texto en el lienzo
   necesita archivos de letra (glyphs) que la app no tiene, porque funciona sin conexión. Con etiquetas HTML
   se usan Inter y los tokens, y crecen con "Letra más grande". `src/mapa/etiquetas.ts` elige una etiqueta
   por cuadra con nombre (de la más larga a la más corta), sin repetir el mismo nombre a menos de 250 m. Al
   mover el mapa se ocultan las que se montan sobre otra.
10. **Lugares de referencia: solo dos.** El prompt nombra la Plaza Alfonso López y la Iglesia. La lista
    (`LANDMARKS`) admite más cuando se decidan los 5 o 6 de la especificación. El nombre sale de
    `destinos.json`: "Iglesia de la Concepción", no "Iglesia La Concepción" como en Figma.
11. **Vista inicial.** Si el teléfono ya dio la ubicación, el mapa encuadra a la persona y la plaza una sola
    vez, dejando libre lo que tapa la hoja. Sin ubicación, abre centrado en la plaza, como antes.
12. **Revisión de consistencia (revisor aparte).** Se corrigieron: dos `Aviso` en la misma hoja, el margen
    doble bajo la hoja incrustada, el radio de la etiqueta de calle (token de radio, no de espaciado), las
    claves de i18n que quedaron sin uso y una regla de estilo repetida. Quedan anotadas, sin cambio:
    - **"Sensación térmica" no dice "estimada".** Sigue la especificación de la 04. El chip "Estimado ·
      hora" sigue sobre el mapa, que es lo que decidió G1. Si Claude (chat) prefiere repetir "estimada" en la
      hoja, es un cambio de texto.
    - **La barra inferior se oculta al elegir el punto de partida.** Ese modo viene de la 05 y tiene su
      propio "Cancelar".
    - **El buscador "¿A dónde vas?" repite el estilo del campo de la 05**, y el círculo de "Árboles" repite
      el del marcador Árbol, porque no hay un campo compartido ni un marcador pequeño. Conviene extraerlos
      cuando R2 rehaga la 05.
    - **El asa de la hoja asomada es solo dibujo.** Las tres alturas de 04-5 son: asomada (mapa), media
      (ficha y hora) y completa (sin uso aún en el mapa).

**Paso R1c (2026-11-06): notas**

1. **07-1.** De las 80 cuadras sin nombre de `red.geojson`, 32 quedan "Cuadra entre Cra. 18 y Cra. 1C", 43
   "Cuadra junto a la Cra. 18" (solo una esquina con nombre) y 5 siguen como "Cuadra sin nombre". Los
   nombres que complete la autora (D3, en pausa) reemplazan a estos.
2. **07-2: cómo se nombran los andenes** (decisión de la autora). Junto a una plaza o un parque: "Andén del
   lado de la plaza" (o "del parque") y "Andén de enfrente". Si no, la calle paralela más cercana de ese lado:
   "Andén hacia la Calle 15". Sin calle paralela a menos de 160 m queda el costado: "Andén del costado sur".
   En los datos de hoy: unos 900 andenes por calle, 20 por plaza o parque y 86 por costado. Algunos nombres
   de `red.geojson` se leen raros, como "Andén hacia la Escalera". La regla está en `src/mapa/andenes.ts`,
   con pruebas.
3. **Estado general.** Es el del andén con más sombra. Con sombra plena se conserva "Sombra plena hasta las
   10:35 a. m." (decisión de la autora); con parcial o al sol dice "Sombra parcial a las 9:30 a. m.", como
   en Figma. La pastilla "Mejor" va solo cuando un andén tiene claramente más sombra (10 puntos o más).
4. **La ficha ya no tapa la barra inferior.** Va en la misma hoja incrustada del mapa, en altura media, con
   ✕ y Escape. Si lleva la nota de los cañaguates crece hasta el 60 % de la pantalla y se desplaza. El
   título usa el estilo de todas las hojas (Título 24), no el Subtítulo 20 de Figma.
5. **El halo de la cuadra** es oscuro al 28 %, debajo de los dos andenes, y crece con el zoom (22 px a zoom
   16). Cerca de la plaza, las pastillas de referencia pueden tapar parte de la cuadra elegida.
6. **Textos que salieron de la ficha**: "Acera protegida", "UTCI estimado", "Arbolado del tramo" y la línea
   "Valores estimados para…" (el chip "Estimado" del mapa ya lo dice, G1). La nota de los cañaguates dice
   "cuadra" en lugar de "tramo" (G4).
7. **Selector de hora (04-6 y la parte "Mañana" de N3).** Hoy · Mañana, la hora en grande con la pastilla
   "ahora", el deslizador con 6 a. m. · 12 m. · 6 p. m. y "Volver a ahora". Va en la hoja incrustada del
   mapa, como la ficha. N3 sigue en "listo para código" porque falta la noche ("Ya no hay sol"), que es del
   paso R5.
8. **"Mañana" viaja a todas las pantallas** (decisión de la autora). Va en la dirección (`?dia=manana`),
   junto a `?hora=`, en los enlaces que arma `useEnlace`. Así rutas, "¿Cuándo salir?" y Descansar calculan
   el mismo día. El pronóstico de Open-Meteo ya trae los dos días.
9. **Encabezado con "Mañana".** "Mañana, 4:00 p. m." y el chip del semáforo no caben juntos en 390 px: el chip
   baja a una segunda línea solo en ese caso, como hacía la barra anterior.
10. **Revisión de consistencia de R1c (revisor aparte).** Se corrigieron:
    - **El resumen de llegada con "Mañana" elegido.** En un recorrido con GPS, la hora salía negativa,
      porque se restaba la medianoche de mañana. Ahora usa la hora local del recorrido, y el día solo
      viaja al simular.
    - **Pantallas que decían "hoy" con "Mañana" elegido.** La nota "Valores estimados…" de rutas, búsqueda,
      descansar y "¿Cuándo salir?", el chip de la llegada y el de Mis lugares ahora lo dicen
      (`horaConDia` y `laHoraConDia` en `src/i18n/hora.ts`, con pruebas).
    - **Salidas guardadas para mañana.** `routeLink` ahora abre la ruta de mañana. Más allá de mañana no
      se puede: la 06 solo ve hoy y mañana.
    - **El selector, contra 113:836.** El control del deslizador mide 36 px; las marcas cortas dicen
      "6 a. m. · 12 m. · 6 p. m."; "ahora" se oye en el lector de pantalla; las pastillas "ahora" y
      "Mejor" usan el radio de chip; el segmento elegido usa la clase tipográfica, no un peso escrito a
      mano. Hoy · Mañana reutilizan los textos de Planear salida.
    Quedan anotadas, sin cambio:
    - **El título de la ficha usa Título 24**, el estilo de todas las hojas, en lugar del Subtítulo 20 de
      113:329.
    - **La nota de los cañaguates sigue siendo su tarjeta propia**, porque es un dato de la cuadra y no un
      aviso de la pantalla.
    - **El círculo verde de "Árboles" ya está copiado dos veces** (leyenda y ficha), y Hoy · Mañana tiene una
      forma distinta al selector de día de Planear salida (lo pide Figma). Conviene extraer piezas
      compartidas cuando haya una tercera.
    - **El orden de la sensación térmica cambia** entre la hoja ("al sol · a la sombra") y la ficha ("a la
      sombra · al sol"). Así está en la especificación (04 y 07-2); conviene unificarlo en Figma.

**Paso R2 (2026-11-06): notas**

1. **G3.** `src/rutas/viaje.ts` (`tripRoute`) guarda cada ruta por hora de sombra, modo, perfil, origen y
   destino. Todas las pantallas la piden con `routeBetween`: 05, 06, 13, 15, 16, Mis lugares y la agenda de
   salidas. Por eso la distancia, los minutos y el % salen del mismo objeto. Comprobado: la plaza a la 1:00
   p. m. da "800 m · 12 min" y 64 % en la 05 y en la 06.
