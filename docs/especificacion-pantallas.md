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
| Tramo | 43:55 | Sombra = línea continua verde · Parcial = discontinua menta (18 px / 8 px) · Expuesto = ámbar con marca central punteada `--um-mapa-marca-expuesto` (6 px / 6 px). |
| Marcador | 43:86 | Usuario (punto azul con halo) · Destino · Refugio · Agua · Placa QR · Árbol · Grupo de árboles (número). 40 px, elevación flotante. |
| Botón | 43:93 | Primario · Secundario · Advertencia. 60 px de alto y radio 12. |
| Guía de estilo | 44:41 | Principios, color, tipografía, iconografía, mapa, espaciado y PWA. |
| Íconos | 42:27 | 42 íconos (también en `design/iconos/`). |

Patrones comunes:
- **Barra superior**: fondo blanco de 112 px con borde inferior. Muestra la hora (Dato 28), el chip del semáforo a la derecha y, debajo, la línea "UTCI estimado · al sol X° · a la sombra Y°" (Micro).
- **Encabezado de sección**: "‹ Volver" (Etiqueta, secundario) y título (Título 24).
- **Tarjeta de opción**: fondo superficie, borde, radio 16, contenedor de ícono de 44 px con tinte, título (Cuerpo fuerte semibold) y texto (Etiqueta regular).
- **Hoja inferior**: radio superior 24, asa centrada y elevación de hoja. **Modal**: radio 24, velo `--um-base-velo` y elevación modal.

## Pantallas

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
