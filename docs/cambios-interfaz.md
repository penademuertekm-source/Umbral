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
| G3 | Las mismas cifras en todo el viaje: la ruta se calcula una vez y la leen 05, 06, 13, 15 y 16 | P1 | C | listo para código |
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
| 04-5 | Mapa | Hoja inferior de tres alturas que recoge leyenda, aviso y ficha | P2 | F C | listo para código |
| 04-6 | Mapa | Encabezado de una línea; al tocar la hora se abre el deslizador | P2 | F C | listo para código |
| 04-7 | Mapa | Nombres de calles, 5 o 6 lugares de referencia y vista inicial con la persona y la plaza | P2 | F C | listo para código |
| 04-8 | Mapa | Solo "Mi ubicación" flotante; lo demás a la barra inferior | P2 | F C | listo para código |
| 04-9 | Mapa | Los grupos de árboles se identifican como tales (ícono o leyenda) | P2 | F C | hecho |
| 04-10 | Mapa (20) | El nublado pasa a ser un estado de la 04, con la sombra atenuada y el aviso Nublado en gris (decisión de la autora, 2026-10-16) | P2 | F C | listo para código |
| 05-1 | Buscar | Destinos fuera del mapa (Mercado, Casa Beto Murgas) ofrecen "Cómo llegar"; hoy terminan en un mensaje sin salida | P1 | C | listo para código |
| 06-1 | Rutas | "Ruta con más sombra" en lugar de "Ruta con sombra" | P1 | C | listo para código |
| 06-2 | Rutas | El conteo de árboles pasa a los detalles | P2 | C | listo para código |
| 06-3 | Rutas | Cada tarjeta muestra la muestra de su línea del mapa | P2 | F C | listo para código |
| 07-1 | Ficha | Cuadras sin nombre nombradas por sus esquinas (observación 1) | P1 | C D | listo para código |
| 07-2 | Ficha | "Sensación térmica" en lugar de UTCI; Sky View Factor plegado | P1 | C | listo para código |
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
| S3 | Metas de sol evitado: progreso (sol evitado, nivel, retos), colecciones (Pasaporte del centro, Álbum de la sombra) y premios (logros; beneficios y meta de la comunidad simulados) | Logros · Pasaporte · detalle del sello · Álbum · 22 con premios · Premios de ejemplo · interruptor en Ajustes | Suma del sol evitado en cada llegada, reglas de logros en `src/config/`, beneficios simulados en archivo aparte | hecho en parte (P3a) |

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
