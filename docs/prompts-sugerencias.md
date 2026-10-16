# Prompts de las sugerencias del docente para Claude Code · Umbral

Prompts para construir S0 a S3 de `docs/cambios-interfaz.md` (sección "3b. Sugerencias del docente"). Van
antes que los pasos R2 a R6 de `docs/prompts-rediseno.md`, que siguen en pausa. Las reglas de trabajo conjunto
están en CLAUDE.md, sección "Trabajo con Claude (chat)".

**Cómo usar este archivo**

1. Abre Claude Code en la carpeta del proyecto y escribe `/clear` (solo, y Enter).
2. En un mensaje nuevo escribe `Haz git pull y ejecuta el paso P1 de docs/prompts-sugerencias.md`, o pega el
   bloque **Prompt** del paso.
3. Lee el plan que te muestre antes de aprobarlo.
4. Al terminar, sigue **Cómo verificar** en el enlace de prueba
   (https://penademuertekm-source.github.io/Umbral/prueba/) y avísale a Claude (chat).

Orden: P1 → P2 → P3a → P3b. Cada paso debería caber en una ventana de uso del plan Pro. Si se corta, usa
**Retomar** al final.

**Nota para todos los pasos.** Las pantallas 05, 06, 15 y 22 todavía están en su versión anterior en el
código (su rediseño completo es R2 a R4, en pausa). Agrega lo de estos pasos sobre la versión actual, sin
rehacerlas; la 22 sí se reemplaza en P3a.

---

## Paso P1 · Perfil y Mis lugares

Puntos: **S0, S1**.

**Prompt**
```
Lee CLAUDE.md (reglas 1 y 2 y "Trabajo con Claude (chat)"), docs/cambios-interfaz.md (sección 3b) y, en
docs/especificacion-pantallas.md, "Sugerencias del docente": el principio, "S0 · Barra inferior con Perfil" y
"S1 · Perfil y Mis lugares". Haz git pull antes de empezar.

Vamos con el paso P1 de docs/prompts-sugerencias.md.

1. S0 · Íconos Perfil, Guardar y Guardado: crea los SVG de la especificación en design/iconos/interfaz/ y
   agrégalos a design/iconos/indice.json.
2. S0 · BarraInferior: la cuarta pestaña pasa a "Perfil" (ícono Perfil) y lleva a /perfil. Queda activa en
   /perfil y en todo /ajustes. Ajustes (11) deja de ser pestaña: encabezado con Volver y "Ajustes"; las filas
   "Cómo leer el mapa", "Cómo se calcula la sombra" y "Acerca de y créditos" pasan a Perfil; Ajustes gana la
   sección "Tus datos" con "Borrar mis datos".
3. S1 · Módulo de guardado local en src/perfil/ (lugares, nombre opcional y, desde ya, el espacio para
   salidas y logros de P2 y P3). Todo en localStorage con una sola clave versionada, con try/catch, y una
   función borrarMisDatos() que borra lugares, salidas, llegadas, sellos, láminas, logros y nombre, pero no
   los ajustes. Pruebas con vitest.
4. S1 · Pantalla Perfil (/perfil, nodo 143:1977) y Mis lugares (/perfil/lugares, 143:2425; vacío 143:2666).
   Las cifras de cada lugar (% en sombra, minutos) se calculan al abrir, con la hora actual, desde la fuente
   única de rutas; no se guardan.
5. S1 · Guardar en 06 (144:2095) con la hoja "Guardar este lugar" (144:2213), chips Casa, Trabajo, Estudio y
   el aviso recogido "Guardado en Mis lugares". Editar lugar (144:2679) con "Deshacer" al borrar.
6. S1 · "Tus lugares" en 05 (144:2565): fila de chips que se desplaza de lado; si no hay lugares, no aparece.
7. Modal "Borrar mis datos" (145:2335).

Reglas: todo texto sale de src/i18n (es y en), solo tokens de design/tokens.css, texto mínimo 15 px, área
táctil de 56 px (también "Editar" y "Guardar"), nada distinguido solo por color. Un commit por punto con el
formato "<número>: <resumen>" y su estado en "hecho" en docs/cambios-interfaz.md en el mismo commit. Antes de
cada commit: npm run build, npm test y npm run contraste. Si algo contradice la especificación, detente y
anótalo en "Notas de Claude Code".
```

**Cómo verificar** (en el enlace de prueba)
1. La barra dice Mapa · Ir a · Descansar · Perfil, y Perfil abre la pantalla con "Hola".
2. Busca la Plaza Alfonso López, toca "Guardar", ponle "Trabajo" y vuelve a "¿A dónde vas?": aparece el chip "Trabajo".
3. En Perfil › Ajustes › Borrar mis datos, confirma: Mis lugares queda vacío y el idioma sigue igual.

---

## Paso P2 · Agenda de salidas

Punto: **S2**. Necesita P1.

**Prompt**
```
Lee CLAUDE.md, docs/cambios-interfaz.md (sección 3b) y, en docs/especificacion-pantallas.md,
"S2 · Agenda de salidas". Haz git pull antes de empezar.

Vamos con el paso P2 de docs/prompts-sugerencias.md.

1. Cálculo de la hora de salida en src/rutas/ (junto a salidas.ts, usando la misma lógica que "¿Cuándo
   salir?"): entre la llegada − 60 min y la llegada − duración de la ruta, cada 5 min, la salida con menos
   minutos al sol; entre dos iguales, la más tarde; llegar 5 min antes de la hora pedida. Pruebas con vitest.
2. Pantallas: Planear una salida (/perfil/salidas/nueva, 146:2554, con el selector de hora de la 04),
   Tu salida (146:2724), Mis salidas (/perfil/salidas, 148:2516) y su estado vacío (148:2615).
3. Franja Precaución en "Tu salida" si la llegada cae entre 11 a. m. y 3 p. m.
4. "Añadir a mi calendario": genera y descarga un archivo .ics (evento con la hora de salida, título
   "Salir hacia {nombre} · Umbral", alarma 10 min antes y el enlace estable a la ruta). Pruebas del .ics.
5. Guardado de salidas en el módulo de src/perfil/; las pasadas se borran al abrir la app.
6. Aviso "Es hora de salir" (148:2664) en la hoja del mapa si la app se abre entre 15 min antes y 10 min
   después de una salida guardada. Respeta "un aviso a la vez" del componente Aviso.
7. Entradas: Perfil › Mis salidas, y en "¿Cuándo salir?" (15) un botón secundario "Guardar en mi agenda".
8. La app no promete avisar con la pantalla apagada: usa los textos de la especificación.

Mismas reglas del paso P1.
```

**Cómo verificar**
1. Perfil › Mis salidas › Planear una salida: elige Trabajo y llegar a las 3:00 p. m.; sale "Sal a las …" con la franja de calor.
2. "Añadir a mi calendario" abre el calendario del celular con el evento.
3. Guarda una salida para dentro de 5 minutos, cierra y abre la app: en el mapa sale "Es hora de salir".

---

## Paso P3a · Progreso, logros y llegada

Puntos: **S3** (primera parte). Necesita P1 y P2.

**Prompt**
```
Lee CLAUDE.md, docs/cambios-interfaz.md (sección 3b) y, en docs/especificacion-pantallas.md,
"S3 · Metas de sol evitado" completo, sobre todo "Reglas para el código". Haz git pull antes de empezar.

Vamos con el paso P3a de docs/prompts-sugerencias.md.

1. src/config/logros.ts: niveles, retos y logros con los valores de la especificación, fáciles de editar
   (provisionales). Nada de distancia ni de salir entre 11 a. m. y 3 p. m.
2. Registro de llegadas en src/perfil/: sol evitado = minutos al sol de la ruta más corta − los de la ruta
   hecha, a la hora de salida, mínimo 0; solo al terminar el recorrido. Nunca el camino. Semana de lunes a
   domingo, hora de Colombia. Pruebas con vitest de niveles, retos y logros.
3. Pantalla Logros (/perfil/logros, 150:2601), sin la parte de colecciones y premios todavía (eso es P3b; deja
   las tarjetas con "Próximamente" si hace falta).
4. Nueva 22 · Llegada con premios (152:2798): sol evitado, reto que avanzó, sello nuevo (cuando exista en
   P3b), "¿Te sirvió esta ruta?" y "Listo". Las respuestas se siguen guardando como hoy para el CSV.
5. Interruptor "Logros y retos" en Ajustes (124:1034): apagado oculta Logros en Perfil y los premios de la 22.
6. Perfil muestra en la fila Logros "Esta semana: {n} min de sol evitado".

En este paso el estado de S3 queda "hecho en parte (P3a)"; pasa a "hecho" al final de P3b.

Mismas reglas del paso P1.
```

**Cómo verificar**
1. Haz un recorrido hasta la llegada: la 22 muestra "+n min de sol evitado" y el reto que avanzó.
2. Perfil › Logros: el número de la semana y la barra del nivel coinciden con lo que viste en la llegada.
3. Apaga "Logros y retos" en Ajustes: la fila Logros desaparece de Perfil.

---

## Paso P3b · Colecciones y premios de ejemplo

Puntos: **S3** (segunda parte). Necesita P3a.

**Prompt**
```
Lee CLAUDE.md (regla 1: lo simulado dice "Ejemplo · simulación"), docs/cambios-interfaz.md (sección 3b) y,
en docs/especificacion-pantallas.md, "S3 · Metas de sol evitado". Haz git pull antes de empezar.

Vamos con el paso P3b de docs/prompts-sugerencias.md.

1. Pasaporte del centro (/perfil/pasaporte, 151:2661) y detalle del sello (151:2764): un sello por destino
   de destinos.csv y por el Parque de la Leyenda de refugios.csv; se gana al llegar (22). El dato "¿Sabías
   que…?" va en i18n; solo existe el de la Plaza; sin dato, la hoja no muestra el recuadro.
2. Álbum de la sombra (/perfil/album, 151:2844), con la regla aproximada de la especificación (dilo así en un
   comentario). Mango, Cañaguate, Alero, Otros árboles y Muro alto.
3. Sellos y láminas provisionales hechos con los íconos (como en Figma); deja el lugar para los SVG finales en
   design/ilustraciones/sellos/ y design/ilustraciones/laminas/.
4. Premios de ejemplo (/perfil/premios, 152:2838) con public/datos/simulados/premios.json
   ("simulado": true): franja de simulación, meta de la comunidad (total de ejemplo fijo + lo que aportó esta
   persona) y beneficios por nivel. "Ver código" abre una hoja con UMB-EJEMPLO-#### y "Código de ejemplo: no
   sirve en comercios reales."
5. Completa Logros (colecciones y premios) y la tarjeta "¡Nuevo sello!" de la 22.
6. "Borrar mis datos" también borra sellos, láminas y logros.

Mismas reglas del paso P1.
```

**Cómo verificar**
1. Llega a la Plaza Alfonso López con un recorrido: la 22 muestra "¡Nuevo sello!" y el pasaporte lo tiene.
2. Perfil › Logros › Premios de ejemplo: se ve la franja gris de simulación y el código dice que es de ejemplo.
3. El Álbum muestra al menos una lámina ganada después de un recorrido bajo mangos.

---

## Retomar (si se cortó el uso)

```
Lee CLAUDE.md y docs/cambios-interfaz.md, haz git pull y revisa git log. Continúa el paso que estaba en curso
de docs/prompts-sugerencias.md desde el primer punto que no esté en "hecho".
```
