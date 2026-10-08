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

## 1. Cambios en todas las pantallas

| N.º | Cambio | Prior. | Dónde | Estado |
|---|---|---|---|---|
| G1 | Chip fijo "Estimado · 12:00 ⓘ" en lugar de la línea gris "Valores estimados… · Datos provisionales" repetida en 8 pantallas. La ⓘ abre una hoja con "Datos provisionales" y las fuentes | P1 | F C | pendiente |
| G2 | Calor y cielo por separado ("▲ Calor fuerte · Nublado"). Quita el "riesgo bajo" junto a 37° | P1 | C | pendiente |
| G3 | Las mismas cifras en todo el viaje: la ruta se calcula una vez y la leen 05, 06, 13, 15 y 16 | P1 | C | pendiente |
| G4 | Vocabulario: "andén" (no "acera"), "cuadra" (no "tramo"), "sensación térmica" (no "UTCI") y "Dónde descansar". "Puntos de permanencia" se mantiene en la documentación | P1 | C | pendiente |
| G5 | Sin jerga a la vista: el Sky View Factor va plegado en "Detalles técnicos"; "px" y "CSV" van a la sección del equipo | P1 | C | pendiente |
| G6 | Avisos en tres niveles: alerta (interrumpe, solo al iniciar un recorrido), aviso (franja en la hoja inferior) y dato (chip). Uno a la vez, con contador "+1"; después de leído se recoge en un chip, no desaparece | P2 | F C | pendiente |
| G7 | Un botón principal por pantalla y orden fijo: respuesta → acción → detalles plegados → letra pequeña | P2 | F C | pendiente |
| G8 | Frases de 12 palabras como máximo, botones que empiezan con verbo, el mismo texto para la misma acción | P2 | C | pendiente |
| G9 | Ningún ícono sin su palabra | P2 | F C | pendiente |
| G10 | Atribución fuera del mapa (ver decisiones): inicio + ⓘ en el mapa + Ajustes › Créditos | P2 | F C | pendiente |
| G11 | Medidas en rem y hoja inferior en porcentaje del alto de pantalla | P3 | C | pendiente |
| G12 | Computador: mapa grande con panel lateral | P3 | F C | pendiente |

## 2. Cambios por pantalla

| N.º | Pantalla | Cambio | Prior. | Dónde | Estado |
|---|---|---|---|---|---|
| 04-1 | Mapa | Leyenda: parcial y expuesto se distinguen también por el trazo, no solo por el color | P1 | F C | pendiente |
| 04-2 | Mapa | El aviso de lluvia encuadra el lugar cubierto que menciona | P1 | C | pendiente |
| 04-3 | Mapa | "Sin clima" con mensaje propio, no "al sol — · a la sombra —" | P1 | C | pendiente |
| 04-4 | Mapa | El botón principal siempre con el mismo texto | P1 | C | pendiente |
| 04-5 | Mapa | Hoja inferior de tres alturas que recoge leyenda, aviso y ficha | P2 | F C | pendiente |
| 04-6 | Mapa | Encabezado de una línea; al tocar la hora se abre el deslizador | P2 | F C | pendiente |
| 04-7 | Mapa | Nombres de calles, 5 o 6 lugares de referencia y vista inicial con la persona y la plaza | P2 | F C | pendiente |
| 04-8 | Mapa | Solo "Mi ubicación" flotante; lo demás a la barra inferior | P2 | F C | pendiente |
| 04-9 | Mapa | Los grupos de árboles se identifican como tales (ícono o leyenda) | P2 | F C | pendiente |
| 04-10 | Mapa (20) | El nublado pasa a ser un estado de la 04, con la sombra atenuada | P2 | F C | pendiente |
| 05-1 | Buscar | Destinos fuera del mapa (Mercado, Casa Beto Murgas) ofrecen "Cómo llegar"; hoy terminan en un mensaje sin salida | P1 | C | pendiente |
| 06-1 | Rutas | "Ruta con más sombra" en lugar de "Ruta con sombra" | P1 | C | pendiente |
| 06-2 | Rutas | El conteo de árboles pasa a los detalles | P2 | C | pendiente |
| 06-3 | Rutas | Cada tarjeta muestra la muestra de su línea del mapa | P2 | F C | pendiente |
| 07-1 | Ficha | Cuadras sin nombre nombradas por sus esquinas (observación 1) | P1 | C D | pendiente |
| 07-2 | Ficha | "Sensación térmica" en lugar de UTCI; Sky View Factor plegado | P1 | C | pendiente |
| 09-1 | El Niño | Revisar en la primera pasada (no revisada aún) | P2 | — | pendiente |
| 10-1 | Dónde descansar | El Callejón no dice "sombra continua" junto a "Al sol a esta hora"; se describe lo de ahora | P1 | C | pendiente |
| 10-2 | Dónde descansar | Los mismos íconos en el mapa y en la lista | P2 | F C | pendiente |
| 11-1 | Ajustes | "Letra más grande" sin "px"; CSV en "Para el equipo de investigación"; entradas a "Acerca de y créditos" y "Cómo leer el mapa" | P2 | F C | pendiente |
| 13-1 | Recorrido | Indicaciones con referencias, no con puntos cardinales | P1 | C | pendiente |
| 13-2 | Recorrido | Andén recomendado resaltado en el mapa; solo la próxima indicación; barra de progreso que avanza | P2 | F C | pendiente |
| 15-1 | Cuándo salir | "Mañana" → "En la mañana" | P1 | C | pendiente |
| 15-2 | Cuándo salir | Leyenda solo con los niveles presentes; explicar las franjas verdes | P2 | F C | pendiente |
| 16-1 | Sin ruta | "A esta hora la ruta va casi toda al sol"; cifra principal: minutos al sol | P1 | C | pendiente |
| 17-1 | Semáforo | Colores de Precaución y Evitar más distintos (ΔE hoy ≈ 4,5) | P2 | F C | pendiente |
| 18-19 | Antes de salir | Las pantallas 18 y 19 se unen en una sola hoja | P2 | F C | pendiente |
| 21-1 | Fuera del centro | Revisar la ubicación de nuevo: hoy dice "Estás fuera" a 290 m de la plaza | P1 | C | pendiente |
| 21-2 | Fuera del centro | Mapa real de la ciudad (OpenFreeMap) y botón "Ya llegué al centro" (observación 4) | P2 | F C | pendiente |
| 23-1 | Perfil de calor | Una descripción compartida en lugar de repetirla cuatro veces | P2 | F C | pendiente |

Sin cambios: 01, 02, 14 y 22. En pausa: 08 y 12.

## 3. Pantallas y componentes nuevos

| N.º | Qué | Prior. | Estado |
|---|---|---|---|
| N1 | Componentes: hoja inferior (3 alturas), avisos (alerta, aviso, dato recogido, contador), barra inferior, chip "Estimado" | P2 | pendiente |
| N2 | Cómo leer el mapa (primera vez; se puede saltar y volver a abrir) | P2 | pendiente |
| N3 | Noche: "Ya no hay sol" y ver el día siguiente | P2 | pendiente |
| N4 | Estados: calculando, sin clima, GPS perdido durante el recorrido | P2 | pendiente |
| N5 | Permiso bloqueado: pasos para Android y para iPhone, botón "Volver a intentar" (observación 3) | P2 | pendiente |
| N6 | Acerca de y créditos: autores, docente, Areandina, licencia, privacidad, fuentes y atribuciones | P2 | pendiente |
| N7 | Comprobaciones: 04, 06 y 13 en celular pequeño, letra grande e inglés; 04 en computador | P3 | pendiente |

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

(Vacío. Aquí Claude Code anota contradicciones o dudas que encuentre al aplicar un punto.)
