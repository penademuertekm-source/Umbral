# Prompts por fases para Claude Code · Umbral

**Cómo usar este archivo**

1. Abre Claude Code dentro de la carpeta del proyecto.
2. Al empezar cada fase, escribe `/clear`. Así arrancas con contexto limpio y gastas menos uso.
3. Copia el bloque **Prompt** de la fase y pégalo. Si el prompt es largo, también puedes escribir
   solo: `Ejecuta la Fase N de docs/PROMPTS.md`.
4. Lee el plan que te muestre Claude antes de aprobarlo. Al final, sigue los pasos de **Cómo verificar**.
5. No pases a la siguiente fase hasta que la actual funcione. Si llegas al límite de uso del plan
   Pro, espera a que se renueve y continúa con el prompt de **Retomar** (al final).

Cada fase debería caber en una o dos ventanas de uso del plan Pro.

---

## Fase 0 · Preparación (manual, sin prompt)

1. Instala Node.js LTS, Python 3.11 o superior, Git y Claude Code. Inicia sesión en Claude Code con tu cuenta Pro.
   - Verifica que **no** tengas configurada la variable `ANTHROPIC_API_KEY`, porque si existe se cobra por API.
2. Crea una carpeta `umbral`, descomprime ahí este kit y entra a la carpeta desde la terminal.
3. Ejecuta `git init`.
4. (Opcional) Conecta Figma: `claude mcp add --transport http figma https://mcp.figma.com/mcp`.
   Luego abre Claude Code, escribe `/mcp` y autoriza con tu cuenta de Figma (plan Educación).
5. Crea un repositorio vacío en GitHub llamado `umbral`. Lo usarás en la Fase 10.

---

## Fase 1 · Esqueleto y sistema visual en código

**Prompt**
```
Lee CLAUDE.md, docs/especificacion-pantallas.md y design/tokens.css. Vamos con la Fase 1.

Objetivo: crear el esqueleto del proyecto y el sistema visual en código, sin mapa ni datos todavía.

1. Inicializa Vite + React + TypeScript estricto en esta carpeta, sin borrar design/, datos/, docs/ ni CLAUDE.md.
2. Agrega @fontsource/inter (pesos 400, 500, 600) e importa design/tokens.css de forma global. Fondo: --um-base-fondo.
3. Crea src/componentes con:
   - Icono: carga los SVG de design/iconos por nombre y usa currentColor.
   - Boton: primario, secundario y advertencia; 60 px de alto.
   - Semaforo: niveles comodo, precaucion, evitar, no_recomendado y nublado, cada uno con su forma (círculo, triángulo, rombo, cuadrado, círculo gris).
   - MuestraTramo: sombra, parcial, expuesto.
   - Marcador: usuario, destino, refugio, agua, placa, arbol, grupo.
   - BarraSuperior, Encabezado, TarjetaOpcion, HojaInferior y Modal.
   Todo debe usar solo var(--um-…).
4. Crea src/i18n con es.json y en.json y un hook useT(). Detecta el idioma, permite cambiarlo y guárdalo en localStorage.
5. Monta un enrutador simple (hash o react-router) con rutas vacías para cada pantalla de la especificación.
6. Crea la ruta /guia: una página que muestre todos los componentes y estados, para compararla con la guía de estilo de Figma (nodo 44:41).
7. Configura vitest y escribe una prueba mínima.
8. Crea docs/BITACORA.md.

No instales librerías de mapa todavía. Al terminar sigue la sección "Forma de trabajo" de CLAUDE.md.
```
**Cómo verificar:** ejecuta `npm run dev`, abre `/guia` y compárala con la página 03 de Figma. Los colores, las formas del semáforo, los patrones de tramo y los botones deben coincidir.

---

## Fase 2 · Datos provisionales y modelo de sombra (Python)

**Prompt**
```
Lee CLAUDE.md (sección "Modelo de sombra") y datos/LEEME-datos.md. Vamos con la Fase 2. Primero muéstrame un plan corto.

Objetivo: un pipeline en scripts/ que genere public/datos/ a partir de OpenStreetMap y de datos/provisional/.

1. scripts/requirements.txt y un entorno virtual en scripts/.venv (agrégalo a .gitignore). Añade "npm run datos".
2. Área de estudio: geocodifica "Plaza Alfonso López, Valledupar, Colombia" con Nominatim (User-Agent propio, máximo 1 consulta por segundo). Toma un radio de 700 m.
   - Guarda el polígono en datos/provisional/area_estudio.geojson para que yo pueda ajustarlo a mano después.
   - Si el archivo ya existe, úsalo y no vuelvas a geocodificar.
3. Con osmnx descarga calles peatonales y vehiculares (no autopistas), edificios y natural=tree dentro del área.
4. Alturas: si existe edificios_pisos.csv, úsalo; si no, building:levels; si no, 1 piso = 3,5 m. Marca el origen de cada altura.
5. Árboles: usa arboles.csv si tiene filas; si no, los de OSM; si no hay suficientes, genera árboles provisionales.
   - Ubicación: a lo largo de andenes cada 12–25 m, en el 40 % de los tramos, y más densos en plazas.
   - Mezcla: 60 % mango (altura 8–12 m, copa 8–12 m, fuste 2,5 m, perenne), 25 % cañaguate (altura 8–12 m, copa 6–9 m, fuste 3 m, caducifolio, sin hojas en los meses 1, 2 y 3), 15 % otro.
   - Escribe el resultado en datos/provisional/arboles.csv con fuente=provisional, para que se pueda revisar.
6. Aceras: desplaza cada eje de calle ±4 m (ajustable por tipo de vía) para formar dos lados. Guarda el lado como orientación cardinal (norte/sur/oriental/occidental) según el rumbo.
7. Puntos de muestreo cada 5 m sobre cada acera, a 1,5 m de altura (peatón). Para cada punto calcula el perfil de horizonte: 72 sectores de 5°, radio de búsqueda de 60 m, tres canales (edificios+aleros, árboles perennes, árboles caducifolios), codificado en Uint8 con pasos de 0,5°. Calcula también el SVF de cada punto.
8. Geocodifica destinos.csv y refugios.csv. Si un lugar no aparece, déjalo vacío y repórtalo, sin inventar coordenadas.
9. Exporta a public/datos/:
   - red.geojson: aristas con id, nombre de calle, longitud, lados y ids de muestras.
   - muestras.bin + muestras.json (índice, coordenadas y SVF).
   - edificios.geojson y manzanas.geojson simplificados para el mapa base.
   - arboles.geojson, destinos.json, refugios.json y placas.json.
   - meta.json: fecha, fuentes, cuántos datos son provisionales.
10. Validación solar: compara la posición del sol de SunCalc (con un pequeño script de Node) contra pvlib (SPA del NREL) para Valledupar, cada hora de 6 a 18, el día 15 de cada mes. Guarda docs/validacion-sol.md con las diferencias máximas de azimut y elevación.
11. Reporte docs/reporte-datos.md: número de calles, edificios, árboles (por fuente) y muestras, más el tamaño de los archivos. Meta: muestras.bin de menos de 2 MB.

Cuida que todo sea reproducible con "npm run datos".
```
**Cómo verificar:** ejecuta `npm run datos`, abre `docs/reporte-datos.md` y `docs/validacion-sol.md`. La diferencia entre SunCalc y el SPA debería ser de décimas de grado. Si el área no cubre bien el centro, edita `area_estudio.geojson` en geojson.io y vuelve a correr el script.

---

## Fase 3 · Motor de sombra en el navegador

**Prompt**
```
Lee CLAUDE.md y docs/BITACORA.md. Vamos con la Fase 3.

Objetivo: calcular la sombra en el navegador a partir de public/datos.

1. src/sombra/worker.ts (Web Worker) carga muestras.bin y muestras.json una sola vez.
2. API: calcular(fechaHora, opciones) devuelve, por arista y lado:
   - % de sombra,
   - estado (sombra/parcial/expuesto según src/config/umbrales.ts),
   - qué canal da la sombra (edificio / árbol).
   Opciones: incluir caducifolios según el mes y forzar temporada seca o de lluvias.
3. Posición del sol con suncalc. Si la elevación es ≤ 0, el estado es "sin sol".
4. Funciones auxiliares:
   - sombraHasta(arista, lado, desde): hasta qué hora sigue en sombra (cada 5 min), para "Sombra plena hasta la 1:20 p. m.".
   - perfilDelDia(arista, lado): % de sombra cada 15 min de 6:00 a 18:00.
5. Caché por cuarto de hora. Meta: menos de 150 ms por cálculo en un celular medio. Mide el tiempo y regístralo.
6. Pruebas con vitest:
   - un punto sin obstáculos siempre al sol de día,
   - un punto junto a un muro alto al oriente queda en sombra en la mañana y al sol en la tarde,
   - un cañaguate no da sombra en febrero y sí en agosto.
7. Hook React useSombra(fechaHora).

No hagas interfaz todavía, salvo un panel en /guia que muestre el resultado para una hora.
```
**Cómo verificar:** ejecuta `npm test` (todo en verde). En `/guia`, cambia la hora y mira cómo cambian los porcentajes.

---

## Fase 4 · Mapa principal y ficha de tramo (pantallas 04 y 07)

**Prompt**
```
Lee CLAUDE.md, docs/BITACORA.md y en docs/especificacion-pantallas.md las pantallas 04 y 07. Vamos con la Fase 4.

1. Instala maplibre-gl. Mapa con estilo propio y vacío: fondo --um-mapa-fondo, manzanas/edificios --um-mapa-manzana, calles --um-mapa-via-neutra. Sin teselas externas, para que funcione sin conexión. Atribución de OSM visible.
2. Capa de tramos por lado de acera usando useSombra:
   - sombra: línea continua --um-termico-sombra-plena,
   - parcial: discontinua --um-termico-sombra-parcial [18,8],
   - expuesto: --um-termico-exposicion con una línea central punteada --um-mapa-marca-expuesto [6,6].
   Grosor según el zoom.
3. Pantalla 04 completa:
   - BarraSuperior: la hora y, por ahora, el semáforo con un valor fijo; el clima llega en la Fase 5.
   - Leyenda con MuestraTramo.
   - Deslizador de 6:00 a. m. a 6:00 p. m. en pasos de 15 min, que arranca en la hora actual.
   - Botón "Buscar una ruta con sombra".
   - Marcador de usuario con navigator.geolocation (si hay permiso).
   - Capa de árboles con Marcador árbol o grupo según el zoom.
4. Pantalla 07: al tocar un tramo se abre la HojaInferior con nombre, sombraHasta, acera protegida, arbolado (conteo por especie), SVF en "Detalles técnicos" y la nota de fenología si hay cañaguates. Por ahora el UTCI muestra "—".
5. Aviso discreto "Datos provisionales" si meta.json indica datos provisionales.
6. Rendimiento: mover el deslizador debe sentirse fluido (usa debounce y evita recrear capas).

Si el servidor de Figma está conectado, puedes pedir get_screenshot del nodo 3:2 y del 5:2 una sola vez para comparar.
```
**Cómo verificar:** en `npm run dev`, mueve el deslizador. Al mediodía casi todo debería verse expuesto salvo bajo los árboles, y a las 4 p. m. aparece la sombra de las fachadas. Toca un tramo y revisa la ficha.

---

## Fase 5 · Clima, UTCI y semáforo (pantallas 17, 20 y 09)

**Prompt**
```
Lee CLAUDE.md (sección "Semáforo térmico") y docs/BITACORA.md. Vamos con la Fase 5.

1. src/clima/openMeteo.ts: pronóstico horario para el centro del área (zona horaria America/Bogota) con temperature_2m, relative_humidity_2m, wind_speed_10m, shortwave_radiation, direct_radiation, diffuse_radiation, cloud_cover, uv_index y precipitation_probability.
   - Guarda en caché (IndexedDB o localStorage) con su marca de hora y úsalo sin conexión indicando "dato de las {hora}".
   - Verifica en la documentación oficial de Open-Meteo los nombres de las variables y sus condiciones de uso, y anótalos en la bitácora.
2. src/clima/utci.ts: UTCI estimado a la sombra y al sol.
   - A la sombra: temperatura radiante media ≈ temperatura del aire.
   - Al sol: suma la ganancia solar con un método documentado (SolarCal / ASHRAE 55, o el de jsthermalcomfort si existe).
   - Pon pruebas con valores de referencia de la librería o del artículo de Bröde et al. (2012). Explica las simplificaciones en docs/metodo-utci.md.
3. src/config/reglas-semaforo.ts: implementa el nivel general (mapa) y el nivel de ruta, según CLAUDE.md. El perfil de calor endurece un nivel. Lee el_nino_activo de datos/provisional/clima_config.json (cópialo a public/datos al construir).
4. Conecta la BarraSuperior: hora, Semaforo y la línea "UTCI estimado · al sol X° · a la sombra Y°".
5. Estado nublado (pantalla 20): con nubosidad ≥ 80 %, las vías van en gris, el chip dice "Nublado · riesgo bajo" y un aviso muestra la probabilidad de lluvia y los refugios cubiertos.
6. Pantalla 09: si el_nino_activo es verdadero, se muestra una vez por día.
7. En /guia, un simulador que permita forzar la temperatura, la nubosidad y El Niño, para probar los 5 estados.
```
**Cómo verificar:** en `/guia`, fuerza cada estado y compáralo con la pantalla 17 de Figma. En el mapa real, la barra debe mostrar el clima de hoy.

---

## Fase 6 · Rutas, "¿cuándo salir?" e isócronas (05, 06, 15, 16)

**Prompt**
```
Lee CLAUDE.md, docs/BITACORA.md y las pantallas 05, 06, 15 y 16 de la especificación. Vamos con la Fase 6.

1. src/rutas/grafo.ts construye el grafo con red.geojson: cada lado de acera es una arista y se permite cruzar de lado en las esquinas (con un costo pequeño).
2. Dijkstra con dos costos:
   - corta: distancia.
   - sombra: tiempo × (1 + k × fracción_al_sol), con k = 2 en el perfil General y k = 3 en los perfiles sensibles.
   Velocidad: 1,2 m/s (General) y 1,0 m/s (sensibles), configurables.
3. Resultado de cada ruta: minutos, metros, % en sombra, minutos al sol directo, tramos expuestos (con su posición) y árboles cercanos por especie.
4. Pantalla 05: la búsqueda filtra destinos.json; cada destino muestra la píldora "Sombra NN%" de su ruta con sombra a la hora seleccionada.
5. Pantalla 06: dos rutas en el mapa con los estilos de MuestraTramo. Aplica la regla de "solo una ruta" de la especificación.
6. Pantalla 15 "¿Cuándo salir?": calcula la ruta cada 15 min de 6:00 a 18:00, dibuja el gráfico de barras (con color y forma por nivel), marca "Ahora" y las mejores ventanas de mañana y tarde. El botón mueve el deslizador a esa hora.
7. Pantalla 16: si el nivel de la ruta es evitar o no_recomendado, muestra las tres alternativas. Para la opción de transporte, usa el punto de la ruta más cercano al destino desde el que el resto del camino quede en sombra (o el refugio más cercano).
8. Isócronas: una capa opcional en el mapa (botón de capas) con bandas de 5, 10 y 15 minutos desde tu ubicación o desde un punto tocado, usando el costo con sombra. Este es el "mapa isocrónico" del proyecto: que se vea claro.
9. Pruebas de las rutas en un grafo pequeño de ejemplo.
```
**Cómo verificar:** busca la Plaza Alfonso López a las 12 m. y a las 4 p. m. Las rutas y los porcentajes deben cambiar. Activa las isócronas.

---

## Fase 7 · Recorrido completo (19, 18, 13, 22, 10)

**Prompt**
```
Lee CLAUDE.md, docs/BITACORA.md y las pantallas 10, 13, 18, 19 y 22 de la especificación. Vamos con la Fase 7.

1. Al pulsar "Iniciar recorrido":
   - Primero la 19 (modal) si son entre las 11 y las 15 y el aviso está activo. "No volver a avisarme hoy" se guarda por fecha.
   - Luego la 18 (hoja inferior) si hay ≥ 5 min al sol y el UV es ≥ 8.
2. Pantalla 13:
   - Sigue la ubicación con watchPosition (alta precisión, tolera un error de 20 m).
   - Muestra la instrucción del tramo actual con la acera recomendada, la distancia a la próxima esquina y el aviso ámbar 150 m antes de un tramo expuesto.
   - Muestra el progreso.
   - Sin GPS o sin permiso, ofrece un "modo simulación" que avanza por la ruta (útil para mostrar el prototipo en clase).
   - No guardes el trazado.
3. Pantalla 22 (llegada a menos de 25 m del destino): resumen, un lugar para quedarse cerca y "¿Te sirvió esta ruta?". La respuesta se guarda solo en localStorage, con fecha, hora, destino y nivel.
4. Pantalla 10: refugios en el mapa y en una lista, con su "sombra hasta" calculada y la distancia.
```
**Cómo verificar:** usa el modo simulación para hacer un recorrido completo, de la 06 a la 22.

---

## Fase 8 · Entrada, contexto y QR (01, 02, 03, 21, 08, 12)

**Prompt**
```
Lee CLAUDE.md, docs/BITACORA.md y las pantallas 01, 02, 03, 08, 12 y 21 de la especificación. Vamos con la Fase 8.

1. Flujo de primer uso: 01 → 02 → 03 → 04. En los usos siguientes: 01 → 04.
2. Pantalla 21: si la ubicación está fuera de area_estudio.geojson, muestra la distancia y el consejo, más un botón que abre Google Maps con destino a la Plaza Alfonso López (enlace universal, sin API) y otro para "Explorar el centro sin ubicación".
3. Enlaces de placa: con ?placa=<id> se abre la 08, con la instrucción calculada para ese cruce y esa hora: la acera con más sombra continua, cuántos metros dura y el refugio más cercano. Si el id no existe, muestra un mensaje amable y lleva al mapa.
4. Ruta /placa/<id>: la página imprimible de la pantalla 12, con el QR generado en el navegador (librería qrcode) hacia la URL pública con ?placa=<id>. Agrega /placas, que lista todas las placas para imprimir. Usa la URL base de una variable de entorno VITE_URL_PUBLICA.
```
**Cómo verificar:** abre `/placas`, escanea un QR con el celular (en `npm run dev -- --host`, misma red wifi) y confirma que se abre la 08.

---

## Fase 9 · Ajustes, sin conexión y accesibilidad (11, 23, 14)

**Prompt**
```
Lee CLAUDE.md, docs/BITACORA.md y las pantallas 11, 14 y 23 de la especificación. Vamos con la Fase 9.

1. Pantalla 11:
   - Texto grande y Alto contraste: atributos data-* en <html>, ya definidos en tokens.css.
   - Aviso de calor extremo (se usa en la 19).
   - Ahorro de datos: no consulta el clima y usa la caché.
   - Idioma.
   - Exportar respuestas de "¿Te sirvió?" como CSV.
   - La tarjeta "Cómo se calcula".
2. Pantalla 23: perfil de calor, conectado a las reglas del semáforo y al costo de la ruta.
3. PWA con vite-plugin-pwa:
   - Precarga la app, las fuentes, los íconos y public/datos.
   - Caché de red con respaldo para Open-Meteo.
   - Manifiesto con nombre "Umbral", colores de tokens e íconos generados desde design/marca/isotipo-negativo.svg (192 y 512, con versión adaptable).
4. Pantalla 14: se detecta con navigator.onLine y eventos; muestra la fecha del modelo descargado (meta.json).
5. Revisión de accesibilidad: contraste de todos los pares de tokens usados en texto, foco visible, etiquetas ARIA, tamaños táctiles, prefers-reduced-motion y lang. Corrige lo que falle y deja el informe en docs/accesibilidad.md.
```
**Cómo verificar:** en Chrome, en DevTools > Application, revisa el manifiesto y el service worker. Pon el modo avión y recarga: el mapa y las rutas deben seguir funcionando.

---

## Fase 10 · Publicación y prueba en la calle

**Antes:** crea el repositorio `umbral` en GitHub (Fase 0) y ten a mano su URL.

**Prompt**
```
Lee CLAUDE.md y docs/BITACORA.md. Vamos con la Fase 10.

1. Configura la publicación en GitHub Pages con GitHub Actions: base path correcto, VITE_URL_PUBLICA y un respaldo 404 para las rutas de la app.
2. Guíame paso a paso para conectar el repositorio remoto y hacer el primer push. Dime qué debo activar en Settings > Pages.
3. Ejecuta npm run build y npm run preview, y revisa que no haya rutas rotas ni recursos con rutas absolutas incorrectas.
4. Crea docs/guia-prueba-campo.md: un protocolo para validar la sombra predicha contra fotos en 10 puntos y 4 horas (10 a. m., 12 m., 2 p. m. y 4 p. m.), con una tabla para anotar "predicho vs observado" y cómo calcular el % de acierto.
5. Crea un README.md para el repositorio: qué es, cómo correrlo, fuentes de datos, licencias y créditos (autores del proyecto, docente, institución).
```
**Cómo verificar:** abre la URL de GitHub Pages en tu celular, permite la ubicación y camina un tramo.

---

## Fase 11 (posterior) · Reemplazar datos provisionales por datos de campo

**Antes:** llena `datos/provisional/arboles.csv`, `edificios_pisos.csv`, `aleros.csv`, `refugios.csv` y `placas_qr.csv` con el levantamiento (`fuente=campo`). Si lo hiciste en QField o KoboToolbox, exporta a CSV con esas mismas columnas.

**Prompt**
```
Lee CLAUDE.md y datos/LEEME-datos.md. Ya cargué datos de campo en datos/provisional/.
1. Valida los CSV: columnas, rangos razonables, coordenadas dentro del área y duplicados. Dame un reporte de errores antes de tocar nada.
2. Cuando los corrija, corre npm run datos y compara el reporte nuevo con el anterior.
3. Si ya no quedan datos provisionales en uso, el aviso "Datos provisionales" debe desaparecer solo.
4. Actualiza docs/BITACORA.md y haz el commit.
```

---

## Prompts de apoyo

**Retomar después de una pausa o del límite de uso**
```
Lee CLAUDE.md y docs/BITACORA.md. Estábamos en la Fase N. Revisa git status y el último commit, dime qué quedó hecho y qué falta de esta fase, y continúa solo con lo que falta.
```

**Algo se rompió**
```
Al hacer <acción> pasa <lo que ves> en lugar de <lo esperado>. Este es el error de la consola: <pégalo>. Busca la causa antes de cambiar código, explícamela en dos líneas y corrígela con el cambio mínimo. Agrega una prueba que lo cubra si aplica.
```

**Ajuste visual puntual**
```
En la pantalla NN, <elemento> no coincide con Figma (nodo X:Y): <diferencia>. Corrígelo usando solo tokens de design/tokens.css. No toques otras pantallas.
```
