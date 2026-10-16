# Especificación de pantallas · Umbral

Formato móvil de referencia: 390 × 844 px. Debe adaptarse de 360 a 430 px de ancho; en
escritorio, la app se centra con un ancho máximo de 430 px. La fuente de verdad visual son los
nodos de Figma. Los textos de ejemplo (horas, porcentajes) son **datos de muestra**: en la app
salen del cálculo.

Enlace base: `https://www.figma.com/design/AYqMU7Zqwegk1SGgZFJqTX/?node-id=<nodo>`
(en la URL, el nodo usa guion en lugar de dos puntos: `3:2` → `3-2`).

## Componentes base (página 03 de Figma)

| Componente | Nodo | Variantes / reglas |
|---|---|---|
| Semáforo | 43:42 | Cómodo (círculo) · Precaución (triángulo) · Evitar a pie (rombo) · No recomendado (cuadrado) · Nublado (círculo gris). Chip con radio 20, padding 10/14, gap 8 y texto Etiqueta semibold. |
| Tramo | 43:55 | **Actualizado 2026-10-16 (04-1):** Sombra = línea continua verde oscuro (`--um-termico-sombra-plena`, punta redonda) · Parcial = rayas de 10 px con hueco de 5 px (`--um-termico-sombra-parcial`, punta recta) · Al sol = puntos redondos cada 7 px (`--um-termico-exposicion`, raya 0,1 y punta redonda). Grosor 4 px en el mapa. Se distinguen sin color. En la leyenda: "Sombra · Parcial · Al sol". |
| Marcador | 43:86 | Usuario (punto azul con halo) · Destino · Refugio · Agua · Placa QR · Árbol · Grupo de árboles (número). 40 px, elevación flotante. |
| Botón | 43:93 | Primario · Secundario · Advertencia. 60 px de alto y radio 12. |
| Guía de estilo | 44:41 | Principios, color, tipografía, iconografía, mapa, espaciado y PWA. |
| Íconos | 42:27 | 43 íconos (también en `design/iconos/`). Nuevo 2026-10-16: **Ícono/Interfaz/Mapa** (106:339), plano plegado, para la pestaña Mapa. SVG para `design/iconos/interfaz/mapa.svg`: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14"/><path d="M15 6v14"/></svg>` |

**Componentes nuevos del rediseño (2026-10-08, ver `docs/cambios-interfaz.md`).** Revisión con todos los estados: nodo 105:329.

| Componente | Nodo | Variantes / reglas |
|---|---|---|
| Chip estimado (G1) | 104:137 | Datos = Provisionales · Definitivos. Propiedad de texto "Hora" ("Estimado · 12:00"). Superficie, borde, radio 20 (`--um-radio-chip`), padding 6/8, Etiqueta 15, ícono Información de 20 px. En Provisionales agrega "· provisional" en color texto de Precaución. Visual de 32 px de alto, pero área táctil de 56 px con relleno invisible. Al tocarlo abre una hoja con "Datos provisionales", fuentes y atribuciones. |
| Aviso (G6) | 105:161 | Nivel = Alerta · Aviso · Recogido · Nublado (106:364, gris: fondo y texto del estado Nublado, ícono Nublado fijo). Propiedades: Título, Detalle, Mostrar detalle, Contador ("+1"), Hay más avisos, Ícono (cambio de instancia). Alerta: fondo y texto No recomendado, borde de 2 px y triángulo de Alerta. Aviso: fondo y texto Precaución. Ambos de 358 px de ancho, radio 16, padding 8/16, título Cuerpo fuerte 17 y detalle Etiqueta 15, botón Recoger de 56 × 56. Recogido: chip con radio 20, ícono de 20 px, título Etiqueta y contador. Se ve un aviso a la vez; al leerlo pasa a Recogido. |
| Barra inferior (04-8) | 105:315 | Activa = Mapa · Ir a · Descansar · Ajustes. 390 px de ancho, fondo superficie, borde superior, padding 8/4, más el área segura del celular. Usa la pestaña 105:174 (Estado = Activa · Inactiva, 97 × 64): indicador de 56 × 32 con radio 20, ícono de 24 y Etiqueta 15. Activa: indicador fondo Cómodo y color `--um-termico-sombra-plena`; inactiva: `--um-base-texto-secundario`. Íconos: Mapa (nuevo), Caminar, Banca y Ajustes. |
| Hoja inferior (04-5) | 105:328 | Altura = Asomada (≈ 200) · Media (≈ 420) · Completa (≈ 720). Superficie, radio superior 24 (`--um-radio-hoja`), elevación de hoja, asa de 40 × 5 en una zona de 28 px, slot "Contenido" con padding 0/16/16 y separación 8. En código la altura va en % del alto de pantalla. |

Patrones comunes:
- **Barra superior**: fondo blanco de 112 px con borde inferior. Muestra la hora (Dato 28), el chip del semáforo a la derecha y, debajo, la línea "UTCI estimado · al sol X° · a la sombra Y°" (Micro).
- **Encabezado de sección**: "‹ Volver" (Etiqueta, secundario) y título (Título 24).
- **Tarjeta de opción**: fondo superficie, borde, radio 16, contenedor de ícono de 44 px con tinte, título (Cuerpo fuerte semibold) y texto (Etiqueta regular).
- **Hoja inferior**: radio superior 24, asa centrada y elevación de hoja. **Modal**: radio 24, velo `--um-base-velo` y elevación modal.

## Pantallas

### 04 · Mapa — rediseño 2026 (reemplaza a 04 y 20) — nodos 110:78 (soleado) y 110:282 (nublado)

Mapa base con la geometría real (manzanas, plazas, calles y sombra por andén a las 9:30 a. m.): nodo 108:78. Los valores de la pantalla son de muestra.

De arriba abajo:
1. **Encabezado** (64 px, superficie, borde inferior). A la izquierda la hora en Título 24 con un chevron hacia abajo: tocarla abre el deslizador de hora (04-6). A la derecha el chip del semáforo con el nivel de calor. El cielo no va aquí (G2).
2. **Mapa** a pantalla completa entre el encabezado y la barra inferior.
   - Andenes con los tres trazos del componente Tramo (04-1).
   - Nombres de calles en pastillas blancas al 85 % (Micro 15, girados con la calle).
   - Lugares de referencia en pastillas con ícono: Plaza Alfonso López e Iglesia La Concepción (04-7).
   - Grupos de árboles con el marcador Árbol de 28 px, sin número (04-9).
   - Marcador "Tú". Vista inicial que encuadra a la persona y la plaza.
3. **Chip estimado** flotando arriba a la izquierda del mapa (G1). Su hora coincide siempre con la del encabezado.
4. **Botones flotantes** sobre la hoja: "Mi ubicación" (56 px, derecha) y "Créditos y datos" ⓘ (40 px visibles, área táctil de 56, izquierda), que abre Ajustes › Créditos (G10). No hay atribución dentro del mapa.
5. **Hoja inferior asomada** (04-5):
   - aviso (si hay);
   - "Sensación térmica: X° al sol · Y° a la sombra" (Etiqueta, secundario), en lugar del UTCI;
   - leyenda en una o dos filas: Sombra · Parcial · Al sol · Árboles;
   - buscador "¿A dónde vas?" de 56 px que lleva a la pantalla 05.
   - Altura: unos 200 px sin aviso y unos 288 px con aviso.
6. **Barra inferior** con Mapa activa (04-8).

**Estado nublado** (04-10): la capa de sombra al 35 % y los árboles al 60 %. En la hoja va el aviso Nublado (gris): "Está nublado: la sombra cambia poco" / "El mapa la muestra más tenue". El semáforo sigue mostrando el nivel de calor.

Quedan para estados siguientes: el aviso de lluvia que encuadra el lugar cubierto (04-2) y el estado sin clima (04-3).

**Estado · ficha de la cuadra (reemplaza a la pantalla 07)** — nodo 113:329. Se abre al tocar un andén.
- En el mapa, la cuadra elegida queda resaltada con un halo oscuro al 28 % (22 px) y el mapa se desplaza para que se vea encima de la hoja. Los botones flotantes se ocultan mientras la hoja está en altura media.
- **Hoja media** (≈ 420 px):
  1. Nombre de la cuadra en Subtítulo 20 ("Calle 16") con una línea de referencia en Etiqueta ("entre Cra. 6 y Cra. 5 · frente a la plaza"), y Cerrar de 56 × 56.
  2. Estado general con su trazo: "Sombra parcial a las 9:30".
  3. Tarjeta con los dos andenes, nombrados por referencia y no por punto cardinal ("Andén del lado de la plaza", "Andén de enfrente"; G4, 13-1). Cada uno lleva su trazo, el estado y el %; el de más sombra lleva la pastilla "Mejor" (fondo Cómodo).
  4. "Sensación térmica: X° a la sombra · Y° al sol" (07-2).
  5. Árboles con ícono: "5 mangos y 5 cañaguates en la cuadra".
  6. Fila plegada "Detalles técnicos" de 56 px con chevron: ahí van el Sky View Factor y los valores técnicos (G5).
- Para las cuadras sin nombre, el título usa las esquinas (07-1).

**Estado · elegir hora** — nodo 113:836. Se abre al tocar la hora del encabezado (04-6); el chevron del encabezado apunta hacia arriba.
- **Hoja media** (≈ 340 px):
  1. "Ver la sombra a otra hora" con Cerrar.
  2. Selector Hoy · Mañana (segmentos de 52 px dentro de un contenedor de 60). "Mañana" usa el pronóstico de dos días (E3).
  3. La hora elegida en Dato 28 con la pastilla "ahora" cuando coincide con la hora actual.
  4. Deslizador de 6 a. m. a 6 p. m. con control de 36 px visibles (área táctil de 56) y las marcas 6 a. m. · 12 m. · 6 p. m.
  5. "El mapa muestra la sombra estimada para esa hora."
- Cuando la hora elegida no es la actual aparece el botón secundario "Volver a ahora". El encabezado y el chip estimado muestran siempre la hora elegida.


### 01 · Splash — nodo 2:2
Isotipo, logotipo "umbral" y el lema "Sombra en tiempo real · Centro Histórico de Valledupar". Texto inferior: "Cargando modelo solar del centro…". Aparece mientras cargan los datos y el worker; si ya están en caché, menos de 1 s.

### 02 · Idioma — nodo 2:9
"Elige tu idioma / Choose your language", con botones Español y English. Se muestra solo en el primer uso; después se cambia en Ajustes. Idioma por defecto según `navigator.language`.

### 03 · Permiso de ubicación — nodo 2:19
Explica para qué se usa la ubicación ("No guardamos tu recorrido"). Botones "Permitir ubicación" y "Ver el centro sin ubicación". Si el usuario rechaza el permiso, la app sigue funcionando sin la ubicación.

### 04 · Mapa en tiempo real predictivo — nodo 3:2 (pantalla principal)
- Barra superior con el semáforo.
- Mapa con los tramos coloreados según la hora seleccionada, con patrones por estado y el usuario (si hay permiso).
- Leyenda: Sombra / Parcial / Expuesto, con muestras de patrón.
- Deslizador "Ver la sombra a otra hora" de 6:00 a. m. a 6:00 p. m. Arranca en la hora actual, ajustada al cuarto de hora.
- Botón "Buscar una ruta con sombra".
- Tocar un tramo abre la ficha (07). Si hay datos provisionales, se ve un aviso discreto.

### 05 · Buscar destino — rediseño 2026 — nodo 116:534

Se abre desde la pestaña "Ir a" de la barra inferior o desde "¿A dónde vas?" en el mapa. Valores de muestra a la 1:00 p. m., calculados con el modelo de la app desde el mismo origen que la pantalla 06.
1. Título "¿A dónde vas?" (Título 24) y buscador de 56 px: "Busca un lugar del centro".
2. Origen: ícono Mi ubicación + "Desde tu ubicación" + enlace "Cambiar" (abre elegir en el mapa).
3. Chip estimado con la hora de cálculo.
4. **"En el centro · ruta con más sombra a la 1:00 p. m."**: lista en tarjeta, filas de 72 px como mínimo.
   - Cada fila: ícono del lugar en un cuadro de 44 px con fondo Cómodo, nombre en Cuerpo fuerte (envuelve a dos líneas si hace falta) y "453 m · 7 min" en Etiqueta.
   - A la derecha, una pastilla con la forma y el color del nivel de la ruta más el % de sombra ("● 76 %"). La forma sigue al semáforo (círculo, triángulo, rombo o cuadrado).
   - Las cifras son las mismas de la ruta con más sombra en la pantalla 06 (G3).
5. **"Fuera del mapa de sombra"** (05-1): Casa Beto Murgas y Mercado público con ícono gris, "1,5 km · sin datos de sombra" y "Cómo llegar ›" a la derecha. Toda la fila es tocable. "Cómo llegar" lleva a la pantalla 21 (mapa de la ciudad y salida a Google Maps), no a un mensaje sin salida.
6. Barra inferior con "Ir a" activa.

### 06 · Rutas — rediseño 2026 — nodo 117:613

1. Encabezado de 64 px: Volver (56 × 56), destino en Subtítulo 20 y "desde tu ubicación" en Etiqueta.
2. Mapa sin la capa de sombra por andén (solo rutas), encuadrado para que se vean el origen y el destino completos encima de la hoja. El chip estimado flota arriba a la izquierda.
   - Ruta con más sombra: línea continua `--um-termico-sombra-plena` de 7 px con borde blanco.
   - Ruta más corta: rayas grises (`--um-base-texto-secundario`) de 4 px, 8/7.
   - Marcadores Tú y Destino; solo el lugar de destino como referencia.
3. **Hoja media** (≈ 370 px):
   1. Tarjeta seleccionada "Ruta con más sombra": muestra de su línea, "453 m · 76 % en sombra" y "7 min" en Dato 28, con borde de 2 px verde.
   2. Tarjeta "Ruta más corta": "438 m · 3 min al sol" y "6 min" (06-1).
   3. Botón primario "Iniciar recorrido con sombra".
   4. Enlace "¿Cuándo conviene salir?" de 56 px de alto, con ícono de reloj.
   - La tarjeta ya no muestra el conteo de árboles (06-2). Cada tarjeta lleva la muestra de su línea del mapa (06-3).
4. Barra inferior con "Ir a" activa.

### 05 · Buscar destino — nodo 4:2
Campo "¿A dónde vas?" (filtra destinos locales; sin buscador externo en el prototipo). Encabezado "Destinos frecuentes · sombra a las {hora}". Cada destino muestra distancia, minutos por la ruta con sombra y una píldora "Sombra NN%" con el color de su nivel.

### 06 · Comparación de rutas — nodo 4:42
Mapa con dos rutas: con sombra (verde continua) y más corta (ámbar con marca punteada). Tarjetas con minutos, % protegido y minutos al sol directo. Si hay árboles a lo largo de la ruta, se mencionan ("6 mangos"). Botón "Iniciar recorrido con sombra". Si la ruta con sombra no mejora en al menos 15 % de exposición frente a la corta, se muestra solo una ruta. Si el nivel es Evitar o No recomendado, se pasa a la 16.

### 07 · Ficha de tramo — nodo 5:2
Hoja inferior sobre el mapa con:
- nombre del tramo (calle entre carreras),
- píldora "Sombra plena hasta la {hora}",
- acera protegida,
- UTCI estimado (sombra · sol),
- arbolado del tramo,
- ancho del andén (si existe el dato),
- detalles técnicos (SVF),
- nota de fenología cuando el tramo tiene cañaguate.

### 08 · Vista tras escanear el QR — nodo 5:46
Se abre con `?placa=<id>`. Muestra el banner "Placa escaneada · Scanned", el nombre del cruce, la hora y una instrucción bilingüe grande ("Camina por la acera occidental / Walk on the west sidewalk"), la sombra continua en metros y el punto de descanso más cercano. Botón "Abrir el mapa completo".

### 09 · Alerta El Niño activo — nodo 6:2
Se muestra una vez por día cuando `el_nino_activo` es verdadero. Explica qué cambia: rutas más protegidas, puntos de hidratación visibles y aviso entre 11 y 3. Botón "Entendido".

### 10 · Puntos de permanencia — nodo 6:21
Mapa de refugios y una lista con nombre, descripción, horario de sombra calculado y distancia.

### 11 · Ajustes y accesibilidad — nodo 7:2
- Interruptores: Texto grande, Alto contraste, Aviso de calor extremo y Ahorro de datos.
- Filas con flecha: Perfil de calor (→ 23) e Idioma.
- Tarjeta "Cómo se calcula la sombra", que dice que los valores son estimados.

### 12 · Placa QR urbana — nodo 7:40
No es una pantalla de la app: es una **página imprimible** (`/placa/<id>`) en formato de 340 × 480 px. Lleva el logotipo, la pregunta bilingüe, el código QR hacia `?placa=<id>`, el texto "No necesitas instalar nada", el nombre del cruce y "Centro Histórico de Valledupar".

### 13 · Ruta en curso — nodo 13:35
- Banda verde con la instrucción actual ("Ahora · Sigue por la acera occidental · 180 m hasta…") y una flecha.
- Mapa del recorrido.
- Aviso ámbar antes de un tramo expuesto ("En 180 m cruzas un tramo expuesto · 40 m sin sombra").
- Progreso: minutos restantes, metros y % en sombra.
- Botón "Salir del recorrido".

La ubicación se sigue con `watchPosition`. **No** se avisa "te desviaste de la acera".

### 14 · Sin conexión — nodo 13:77
Ícono "sin conexión" y la lista de lo que sigue funcionando (mapa, deslizador, rutas a destinos guardados, placas QR si ya se abrió la app antes) y lo que no está disponible (buscar lugares nuevos, aviso de El Niño actualizado). Muestra la fecha del modelo descargado.

### 15 · ¿Cuándo salir? — nodo 32:35
- Resumen de la ruta.
- Gráfico de barras de los minutos al sol por hora de salida, de 6 a. m. a 6 p. m. Cada barra lleva el color y la forma de su nivel.
- Marcador de "Ahora" y ventanas recomendadas sombreadas.
- Tarjetas con las mejores ventanas de la mañana y la tarde, y un aviso "Si sales ahora…".
- Botón "Ver la ruta a las {hora}", que mueve el deslizador a esa hora.

### 16 · Sin ruta con sombra — nodo 32:105
- Banda del nivel con el título "A esta hora no hay una ruta con sombra".
- Datos: % en sombra, minutos al sol e índice UV.
- Tres alternativas: esperar (la mejor hora calculada), ir en transporte hasta el punto con sombra más cercano a la ruta, o caminar con protección.
- Botones "Ver la mejor hora" y "Caminar de todos modos".

### 17 · Semáforo térmico — nodo 32:154
Es una referencia de los 4 estados de la barra superior, no una pantalla de usuario. Úsala para probar el componente.

### 18 · Antes de salir · protección solar — nodo 34:35
Hoja inferior que aparece al iniciar un recorrido con ≥ 5 min al sol y UV alto. Muestra el chip "UV {n} · {categoría}" y las recomendaciones (protector, agua, gorra o sombrilla), más la nota "Recomendación general; no reemplaza el consejo de un profesional de salud".

### 19 · Aviso antes de salir — nodo 34:111
Modal entre 11 a. m. y 3 p. m. si "Aviso de calor extremo" está activo. Muestra el % de sombra de la ruta, la casilla "No volver a avisarme hoy" y los botones "Iniciar recorrido" y "Ver la mejor hora para salir".

### 20 · Mapa con cielo nublado — nodo 34:167
Estado de la 04 cuando la nubosidad es ≥ 80 % (umbral provisional). Las vías van en gris, el chip dice "Nublado · riesgo bajo" y un aviso muestra la probabilidad de lluvia y los lugares cubiertos.

### 21 · Fuera del Centro Histórico — nodo 35:35
Aparece si la ubicación está fuera del polígono de estudio. Muestra un mapa esquemático con la distancia, el consejo de llegar en taxi entre 11 y 3, y los botones "Cómo llegar a la Plaza Alfonso López" (abre Google Maps con destino) y "Explorar el centro sin ubicación".

### 22 · Llegada — nodo 35:84
Resumen del recorrido (minutos, % en sombra y minutos de sol evitados frente a la ruta corta), un lugar para quedarse cerca y la pregunta "¿Te sirvió esta ruta?" (Sí / Más o menos / No). Las respuestas se guardan **solo en el dispositivo** y se pueden exportar como CSV desde Ajustes para la validación.

### 23 · Ajustes · Perfil de calor — nodo 35:121
Opciones excluyentes: General, Adulto mayor, Con niños pequeños, Embarazo y Sensibilidad al calor por salud. Los cuatro últimos endurecen un nivel del semáforo y priorizan la sombra (k más alto en el costo de la ruta). Se guarda solo en el teléfono y no se piden datos de salud.

## Navegación

```
01 → (primer uso) 02 → 03 → 04
04 ⇄ 07 (tocar tramo) · 04 → 05 → 06 → [19 si 11–15] → [18 si UV alto] → 13 → 22
06 → 15 (¿cuándo salir?) · 06 → 16 (si nivel ≥ evitar)
04 → 10 (refugios) · 04 → 11 → 23
QR: ?placa=id → 08 → 04
Sin conexión: banner + 14 · Fuera del centro: 21 · El Niño: 09 (una vez al día)
```
