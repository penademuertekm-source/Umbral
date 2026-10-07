# Umbral · Registro del proyecto y observaciones

Documento para llevar a otra conversación con Claude (Claude normal o Claude Design) y volver después a la
sesión de código. Se entiende solo, sin leer la conversación original. Actualizado el **2026-10-07**, al
cierre de la Fase 10 (publicación), pendiente de la confirmación de la autora.

## 1. Cómo usar este documento

- **Para trabajar en Claude normal o Claude Design**: copia este archivo completo al iniciar la
  conversación y di qué quieres trabajar, por ejemplo: "la observación 2: textos y composición".
- Para el diseño, la fuente de verdad sigue siendo `design/tokens.css` y el Figma (sección 3). Si cambias
  algo allá (tokens, textos, composición), anota qué cambiaste y en qué nodo de Figma, para traerlo de
  vuelta.
- **Para volver a la sesión de código**, escribe algo como:

  > Lee CLAUDE.md, docs/BITACORA.md y docs/registro-y-observaciones.md. Trabajé fuera de la sesión en
  > [tema]. Estos son los cambios y decisiones: [lista]. Quiero que [lo que sigue]. Muéstrame un plan corto
  > antes de empezar.

## 2. Qué es Umbral (resumen)

- **Qué es:** una aplicación web (PWA) bilingüe, en español e inglés, que muestra qué andenes del Centro
  Histórico de Valledupar están en sombra a cada hora. Sugiere rutas con menos sol, recomienda a qué hora
  salir y advierte cuándo no conviene caminar.
- **Origen:** prototipo del proyecto de investigación-creación *"Diseño de un Mapa Isocrónico de Sombras
  para el Bienestar Térmico Peatonal en el Centro Histórico de Valledupar"* (Diseño Gráfico, Fundación
  Universitaria del Areandina).
- **Sin sensores:** la sombra se calcula en el teléfono con tres datos:
  - la hora;
  - la posición del sol;
  - un modelo 3D simplificado del centro (edificios, aleros y árboles).
- **Semáforo térmico:** usa el UTCI estimado con el pronóstico de Open-Meteo.
- **Área:** un círculo de 700 m alrededor de la Plaza Alfonso López.
- **Privacidad:** no hay servidor, ni analítica, ni recorrido guardado. Los ajustes quedan en el teléfono.

## 3. Enlaces y datos de referencia

| Qué | Dónde |
|---|---|
| App publicada | https://penademuertekm-source.github.io/Umbral/ |
| Repositorio | https://github.com/penademuertekm-source/Umbral (público; rama principal `claude/inspiring-cannon-6rmgzq`) |
| Figma | https://www.figma.com/design/AYqMU7Zqwegk1SGgZFJqTX (página "02 · Pantallas" y "03 · Iconografía y estilo gráfico") |
| Reglas del proyecto | `CLAUDE.md` |
| Bitácora por fase | `docs/BITACORA.md` |
| Observaciones de la autora | `docs/observaciones-autora.md` |
| Especificación de pantallas | `docs/especificacion-pantallas.md` |
| Accesibilidad | `docs/accesibilidad.md` |
| Publicación | `docs/publicacion.md` |
| Prueba de campo | `docs/guia-prueba-campo.md` y `docs/plantilla-prueba-campo.csv` |

**Reglas de diseño que no cambian:**

- Colores siempre desde los tokens (`var(--um-…)`), nunca un hex suelto.
- Texto de 15 px como mínimo, botones de 60 px y área táctil de 56 px.
- Nada se distingue solo por color: cada nivel del semáforo tiene su forma.
  - círculo: cómodo;
  - triángulo: precaución;
  - rombo: evitar;
  - cuadrado: no recomendado.
- Todo valor calculado dice "estimado" con su hora, y se ve "Datos provisionales" mientras los haya.
- Atribución visible: "© colaboradores de OpenStreetMap" y "Clima: Open-Meteo".
- El logotipo "umbral" va siempre en minúscula, con Archivo Black.

## 4. Estado de las fases

| Fase | Qué incluye | Estado |
|---|---|---|
| 0 | Kit de arranque (CLAUDE.md, docs, diseño, datos provisionales) | Hecha |
| 1 | Esqueleto Vite + React + TypeScript, componentes, i18n, `/guia`; revisión contra Figma | Hecha |
| 2 | Datos de OpenStreetMap, perfiles de horizonte, validación del sol (Python + GitHub Actions) | Hecha |
| 3 | Motor de sombra en el navegador (Web Worker) | Hecha |
| 4 | Mapa principal (04) y ficha de tramo (07) | Hecha |
| 5 | Clima Open-Meteo, UTCI, semáforo, nublado (20), El Niño (09), referencia (17) | Hecha |
| 6 | Rutas con sombra (05, 06), ¿cuándo salir? (15), sin ruta con sombra (16), isócronas | Hecha |
| 7 | Avisos antes de salir (19, 18), recorrido con GPS o simulación (13), llegada (22), refugios (10) | Hecha |
| 8 | Inicio (01), idioma (02), permiso de ubicación (03), fuera del centro (21) | Hecha · **placas QR (08, 12) en pausa** |
| 9 | Ajustes (11), perfil de calor (23), sin conexión (14), PWA instalable, revisión de accesibilidad | Hecha |
| 10 | Publicación en GitHub Pages, guía de prueba de campo, README | **Falta la confirmación de la autora** |
| 11 | Reemplazar los datos provisionales por datos de campo | No empezada |

### Pantallas

| # | Pantalla | Ruta | Nodo Figma | Estado |
|---|---|---|---|---|
| 01 | Splash (inicio) | `/` | 2:2 | Lista |
| 02 | Idioma | `/idioma` | 2:9 | Lista |
| 03 | Permiso de ubicación | `/ubicacion` | 2:19 | Lista |
| 04 | Mapa en tiempo real predictivo | `/mapa` | 3:2 | Lista |
| 05 | Buscar destino | `/buscar` | 4:2 | Lista |
| 06 | Comparación de rutas | `/rutas` | 4:42 | Lista |
| 07 | Ficha de tramo | `/tramo/:id` (abre `/mapa?tramo=`) | 5:2 | Lista |
| 08 | Vista tras escanear el QR | `/qr/:id` | 5:46 | **En pausa** |
| 09 | Alerta El Niño activo | `/el-nino` | 6:2 | Lista |
| 10 | Puntos de permanencia | `/refugios` | 6:21 | Lista |
| 11 | Ajustes y accesibilidad | `/ajustes` | 7:2 | Lista |
| 12 | Placa QR urbana (imprimible) | `/placa/:id` | 7:40 | **En pausa** |
| 13 | Ruta en curso | `/recorrido` | 13:35 | Lista |
| 14 | Sin conexión | `/sin-conexion` | 13:77 | Lista |
| 15 | ¿Cuándo salir? | `/cuando-salir` | 32:35 | Lista |
| 16 | Sin ruta con sombra | `/sin-ruta-con-sombra` | 32:105 | Lista |
| 17 | Semáforo térmico (referencia) | `/semaforo` | 32:154 | Lista |
| 18 | Antes de salir · protección solar | `/proteccion-solar` (y hoja sobre la 06) | 34:35 | Lista |
| 19 | Aviso antes de salir | `/aviso-calor` (y modal sobre la 06) | 34:111 | Lista |
| 20 | Mapa con cielo nublado | `/mapa/nublado` | 34:167 | Lista |
| 21 | Fuera del Centro Histórico | `/fuera-del-centro` | 35:35 | Lista |
| 22 | Llegada | `/llegada` | 35:84 | Lista |
| 23 | Ajustes · Perfil de calor | `/ajustes/perfil-calor` | 35:121 | Lista |

## 5. Observaciones

### 5.1 Observaciones de la autora (en espera hasta que ella lo pida)

1. **Tramos sin nombre.** 80 de las 502 aristas (5,1 km de 37,2 km) no tienen nombre en OpenStreetMap, y su
   ficha dice "Tramo sin nombre". Hay que decidir cómo entregar los nombres:
   - un CSV en `datos/provisional/`, con el id de la arista y el nombre;
   - o corregirlos directamente en OpenStreetMap y volver a generar los datos.
2. **Menos texto y más claridad visual.** Pide tres cosas:
   - analizar los tipos de texto y simplificarlos para un público no técnico;
   - proponer recursos visuales (íconos, color y forma, elementos que se despliegan);
   - recomponer las pantallas con menos elementos a la vez y una jerarquía clara.

   Límites: "estimado" con la hora, "Datos provisionales", atribuciones, 15 px como mínimo y nada solo por
   color. **Insumo:** los colores de Precaución y Evitar casi no se distinguen (ver 5.2).
3. **Permiso de ubicación.** Que la app explique, guíe o evite el enredo del permiso, y tener un enlace
   seguro (HTTPS).
   - **Hecho:** la pantalla 03 explica antes de pedir el permiso; la app avisa si la dirección no es segura
     (http) y ofrece "Elegir en el mapa" y el modo simulación. El enlace seguro ya existe: la app
     publicada.
   - **Falta:** pasos según el teléfono si el permiso quedó bloqueado, un botón "Ya lo activé, reintentar"
     y distinguir "ubicación apagada" de "permiso bloqueado".
4. **"Cómo llegar a la Plaza" abre Google Maps.**
   - **Es lo esperado:** Umbral solo conoce las calles y la sombra del centro.
   - **Mejoras posibles:**
     - un mapa de la ciudad dentro de la pantalla 21 (con OpenFreeMap) que muestre dónde estás, el centro
       y la distancia;
     - un botón "Ya llegué al centro";
     - las rutas completas dentro de la app, que no se recomiendan: necesitan un servicio con clave y la
       sombra fuera del centro no está modelada.

### 5.2 Observaciones técnicas (hechas durante el desarrollo)

**Diseño y Figma**

- **Precaución y Evitar se confunden**: `--um-semaforo-precaucion-forma` (#d69e00) y
  `--um-semaforo-evitar-forma` (#ef9f27) tienen una diferencia de color ΔE ≈ 4,5 con visión normal. Se
  recomienda al menos 15. Hoy se distinguen por la forma (triángulo y rombo) y el nombre. Cambiarlos toca
  `design/tokens.css` y Figma.
- **Texto Micro**: en el código subió de 13 a 15 px (decisión del 2026-10-01). Falta actualizar el estilo
  "Micro / 13 Medium" en Figma.
- **Perfil de calor (23)**: Figma tiene descripciones distintas para las cuatro opciones sensibles, pero
  la app las trata igual. En la app las cuatro dicen "El semáforo sube un nivel y las rutas buscan más
  sombra". Conviene igualar Figma o decidir reglas distintas por opción.
- **"Cómo se calcula la sombra" (11)**: Figma dice "algoritmo solar del NREL". La app usa SunCalc,
  comprobado contra el algoritmo SPA del NREL con una diferencia máxima de 0,075°. La tarjeta de la app no
  nombra al NREL. Conviene ajustar el texto en Figma.
- **"Ancho del andén" (07)**: la especificación lo pide solo si hay dato, y no lo hay. No se muestra.
- **Marcador de usuario**: en Figma es una imagen; en la app es un punto azul hecho con CSS y el token
  `--um-mapa-usuario`.
- **El título de El Niño (09)** sobre ámbar tiene un contraste de 3,4:1. Cumple solo porque es texto
  grande (24 px).

**Datos (provisionales, para verificar en campo)**

- **1.550 árboles provisionales** (946 mango, 377 cañaguate y 485 de otras especies), más 258 de
  OpenStreetMap. Por eso muchas calles salen "parcial" al mediodía.
- **Alturas de edificios**: 1.457 edificios tienen `height=3` en OpenStreetMap (probablemente un piso, sin
  verificar) y 148 tienen una altura provisional de 3,5 m.
- **Coordenadas aproximadas de los destinos**:
  - Casa Beto Murgas: 1,6 km, fuera del área (se muestra sin ruta).
  - Mercado público: 2,3 km, fuera del área.
  - Callejón de la Purrututú: dentro del área; no está en OpenStreetMap.
- **Parque de la Leyenda**: refugio a 3,1 km, fuera del área. Hay que decidir si sigue en la lista.
- **Lugares cubiertos**: solo el Atrio de la Concepción tiene coordenadas. Faltan el Mercado y otros.
- **"Sombra hasta" de un refugio**: se estima con la acera más cercana. Por ejemplo, el Callejón de la
  Purrututú sale "al sol" a las 2 p. m. aunque su descripción dice "sombra continua".
- **El Niño**: el indicador se actualiza a mano en `datos/provisional/clima_config.json` según los
  boletines del IDEAM.

**Parámetros provisionales (fáciles de editar, se calibran en campo)**

- **Umbrales de sombra:** sombra ≥ 70 %, parcial 30–70 % y expuesto < 30 % (`src/config/umbrales.ts`).
- **Semáforo y UTCI** (`src/config/reglas-semaforo.ts` y `docs/metodo-utci.md`):
  - categorías UTCI: 26, 32, 38 y 46 °C;
  - El Niño y el perfil vulnerable endurecen un nivel;
  - el albedo del suelo es 0,2 en SolarCal.
- **Rutas** (`src/config/rutas.ts`):
  - velocidad: 1,2 m/s el estándar y 1,0 m/s el vulnerable;
  - peso del sol: k = 2 y k = 3;
  - ancho de los cruces según el tipo de vía;
  - con menos de 15 % de mejora en minutos al sol, se muestra una sola ruta.
- **Recorrido** (`src/config/recorrido.ts`):
  - aviso de calor de 11 a 15;
  - protección solar con 5 min al sol o más y UV de 8 o más;
  - margen del GPS de 20 m;
  - aviso ámbar a 150 m;
  - llegada a 25 m;
  - simulación 8 veces más rápida.

### 5.3 Decisiones tomadas por la autora

- **El plan de cada fase se aprueba antes de empezar.** Cuando algo depende de ella, se para y se espera
  su confirmación; después se revisa y se corrige lo que salga.
- **Destinos fuera del área**: se muestran sin ruta (Fase 6).
- **Hora del recorrido**: con GPS usa la hora real; la simulación usa la hora del deslizador (Fase 7).
- **Placas QR (08, 12 y `/placas`)**: en pausa hasta nuevo aviso (Fase 8).
- **Pantalla 03**: solo lo que pide la especificación; el resto de la observación 3 sigue en espera
  (Fase 8).
- **Créditos del README**: "[por completar]". **Licencia del código**: por definir (Fase 10).
- **Texto Micro**: 15 px (Fase 1).

## 6. Registro de lo que pidió la autora (en orden)

1. Arrancar el proyecto por fases según `docs/PROMPTS.md` (fases 0 a 4, el 2026-10-01).
2. Capturas de la conversación como evidencia del proceso, y luego en una carpeta comprimida y ordenada.
3. Fase 5 (clima, UTCI y semáforo).
4. El enlace de GitHub.
5. Cómo probar la app: ¿en VS Code o en GitHub? Se respondió que en VS Code (`npm run dev`) o en GitHub
   Codespaces.
6. Cómo emular un teléfono con GitHub: se configuró GitHub Codespaces (`.devcontainer`) para abrir la app
   en el navegador o en el celular.
7. Error de PowerShell al correr `npm` (ExecutionPolicy). Se dieron alternativas:
   - `npm.cmd`;
   - la terminal Command Prompt;
   - `Set-ExecutionPolicy` solo para la ventana o para el usuario.
8. Qué hacer después de `npm run dev`.
9. Guardar sus observaciones 1 y 2 sin trabajarlas.
10. Fase 6 (rutas).
11. Cómo conseguir las coordenadas de tres destinos, y luego "¿no podrías encargarte?": se buscaron con
    Nominatim y fuentes públicas.
12. Dónde se escriben los comandos (en la terminal de VS Code), y si los cambios se reflejan en el mismo
    enlace o hace falta otra terminal.
13. Si el enlace de localhost sirve en el teléfono: no; se explicaron `--host` y Codespaces.
14. Cómo activar el permiso de ubicación: se explicó por qué falla en http y cómo desbloquearlo.
15. Guardar la observación 3 y seguir con la Fase 7.
16. Fase 7 (recorrido completo).
17. Siguiente fase. Luego aclaró que había escrito pensando que hablaba con "Claude normal"; se continuó
    con la Fase 8.
18. Fase 8, con las placas QR en pausa.
19. Fase 9.
20. Otra vez el error de PowerShell al correr `npm install`.
21. Guardar los pendientes y seguir con la Fase 10, parando cuando le toque hacer algo.
22. Por qué "Cómo llegar a la Plaza" abre Google Maps (observación 4).
23. Este archivo: todas las observaciones y un registro de lo hecho, lo pedido, lo que falta, los
    contratiempos y las preguntas.

## 7. Lo que se necesita de la autora

**Para cerrar la Fase 10:**

- Abrir https://penademuertekm-source.github.io/Umbral/ en el computador y en el celular, y confirmar que
  todo abre. Si algo falla, enviar la captura y decir en qué pantalla.

**Datos:**

- Nombres de los tramos sin nombre (observación 1), o permiso para dejarlos así.
- ¿Qué calle actual es la "Calle Grande"? Y la ubicación exacta de las dos placas QR, cuando se retomen.
- Si el Parque de la Leyenda sigue en la lista de refugios.
- Coordenadas verificadas en campo: Casa Beto Murgas, Mercado público, Callejón de la Purrututú y los
  lugares cubiertos.
- Los datos de campo de la Fase 11: alturas, aleros y árboles reales.

**Decisiones:**

- Créditos del README (autoras o autores y docente) y licencia del código.
- Qué hacer con las observaciones 2, 3 y 4, y con los colores de Precaución y Evitar.
- Si las cuatro opciones sensibles del perfil de calor deben tener reglas distintas.

**Pruebas:**

- Prueba de campo con `docs/guia-prueba-campo.md`: 10 puntos y 4 horas, en un día de sol.
- En el celular:
  - instalar la app;
  - GPS en la calle;
  - modo avión;
  - lector de pantalla (TalkBack o VoiceOver);
  - comprobar que la barra muestra el clima real de hoy (desde la sesión de código solo se probó con datos
    simulados).

**En Figma:**

- Actualizar Micro a 15 px.
- Igualar los textos de la 23 y la 11.
- Revisar los colores de Precaución y Evitar si se decide cambiarlos.

## 8. Contratiempos y cómo se resolvieron

| Contratiempo | Qué se hizo |
|---|---|
| La sesión en la nube no llegaba a OpenStreetMap (Overpass) | Los datos se generan en GitHub Actions (flujo "Datos de sombra") |
| Overpass respondía 429/504 y osmnx reintentaba sin fin (corridas de 21 y 10 min) | Cliente propio con 3 intentos por servidor y cambio automático entre cuatro servidores |
| Los perfiles de horizonte pesaban 3,1 MB (meta < 2 MB) | Se comprimen con gzip: 946 KB, sin perder datos |
| La sesión no llega a Open-Meteo | El clima se probó con respuestas simuladas; falta verlo en el celular con internet |
| La sesión no puede abrir github.io ni descargar imágenes de Figma | Las capturas de Figma se pidieron incrustadas; la publicación la confirma la autora |
| PowerShell bloquea `npm` en Windows | `npm.cmd`, Command Prompt o `Set-ExecutionPolicy` (README y `docs/publicacion.md`) |
| `localhost` no abre en el teléfono y el GPS exige HTTPS | `npm run dev -- --host` en la misma wifi, Codespaces y, ahora, la app publicada |
| Fricción con el permiso de ubicación | Pantalla 03, aviso de dirección no segura, "Elegir en el mapa" y simulación (observación 3) |
| Tres destinos sin coordenadas; dos quedaron fuera del área | Coordenadas con Nominatim y fuentes públicas; se muestran sin ruta |
| La "Calle Grande" no se pudo identificar | Placas QR en pausa (decisión de la autora) |
| Rutas absurdas: en OSMnx, la geometría de algunas calles va al revés | El grafo reconoce los nodos por sus coordenadas, con una prueba que lo cubre |
| El mapa de la pantalla 06 no cargaba (worker de MapLibre) | Configuración compartida del worker para todos los mapas |
| La simulación del recorrido saturaba la página (la cámara se movía 4 veces por segundo) | El mapa solo se recentra cuando el punto se acerca al borde |
| Algunos giros salían al revés | Se miden entre aceras y cruces, sin las esquinas |
| Contrastes que no cumplían (El Niño, pantalla 16) y regiones faltantes para lectores de pantalla | Corregidos; axe-core sin hallazgos en 22 pantallas |
| Los íconos entraban dos veces en la precarga (podía romper la instalación) | Corregido; además se quitaron fuentes de alfabetos que no se usan |
| La conversación de la sesión de código se hizo muy larga | Se resumió automáticamente; la bitácora y este archivo guardan el contexto |

## 9. Preguntas abiertas

1. ¿Confirmas que la app publicada abre bien en el computador y en el celular?
2. ¿Qué calle es la "Calle Grande", y cuándo se retoman las placas QR?
3. ¿Cómo vas a entregar los nombres de los tramos sin nombre (CSV u OpenStreetMap)?
4. ¿Cambiamos los colores de Precaución y Evitar? ¿Lo decides en Figma con la observación 2?
5. ¿El Parque de la Leyenda sigue en la lista de refugios?
6. ¿Las cuatro opciones sensibles del perfil de calor deben tener reglas distintas?
7. Nombres para los créditos y licencia del código.
8. ¿Cuándo se hace la prueba de campo, y quién clasifica las fotos?
9. Para la observación 4: ¿mapa de la ciudad dentro de la 21, botón "Ya llegué al centro", o se deja como
   está?

## 10. Comandos útiles (en Windows, `npm.cmd` en vez de `npm` si PowerShell lo bloquea)

```
git pull                 trae los últimos cambios
npm install              instala o actualiza las librerías
npm run dev              servidor de desarrollo (http://localhost:5173/)
npm run build            versión de producción
npm run preview          sirve la versión de producción (con el modo sin conexión)
npm test                 pruebas
npm run contraste        revisión de contraste de los colores
```

La publicación se actualiza sola cada vez que se suben cambios a la rama principal. Se puede volver a
correr a mano en GitHub: **Actions → Publicar en GitHub Pages → Run workflow**.
