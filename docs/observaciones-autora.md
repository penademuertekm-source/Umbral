# Observaciones de la autora (en espera)

Observaciones de las pruebas de la autora. **No se trabajan hasta que ella lo pida.** Cuando dé la orden,
cada una se convierte en un plan corto para aprobar (CLAUDE.md, "Forma de trabajo"). Probablemente se
trabajen en Claude (chat) o Claude Design, así que cada punto debe entenderse sin el resto de la conversación.

---

## 1. Información faltante: tramos sin nombre

**Recibida:** 2026-10-06 · **Estado:** en espera

> Hay información faltante, como tramos sin nombre. Solo necesito saber qué información necesitas aquí para
> poder proporcionártela y cómo lo hago.

Contexto ya conocido (sin trabajo nuevo):

- Los nombres salen de la etiqueta `name` de las calles en OpenStreetMap (pipeline de la Fase 2,
  `public/datos/red.geojson`).
- Con los datos actuales, 80 de las 502 aristas (5,1 km de 37,2 km) no tienen nombre. La ficha de esos tramos
  (pantalla 07) dice "Tramo sin nombre".
- Por responder cuando se pida: qué datos hacen falta, en qué formato y cómo entregarlos (por ejemplo, un
  CSV en `datos/provisional/` o una corrección directa en OpenStreetMap).

---

## 2. Reestructurar la composición y la cantidad de información en pantalla

**Recibida:** 2026-10-06 · **Estado:** en espera

> Se necesitará una reestructuración de la composición del diseño y de cómo se muestra la información en
> pantalla, ya que de por sí es mucho texto que puede abrumar. También toca hacer un análisis de los tipos de
> textos que debe haber, para que sean digeribles para el usuario, evitar ser muy técnicos y no abrumarlo.
> Además de los textos que se deben usar, toca generar qué se puede hacer para ser más visuales e intuitivos,
> para que el usuario no se pierda, y evitar sobresaturar la pantalla con elementos.

Alcance, según la observación:

1. **Análisis de los textos:** qué tipos de texto hay (títulos, avisos, valores, explicaciones técnicas,
   atribuciones) y cuáles sobran o deben simplificarse para un público no técnico.
2. **Propuesta visual:** qué se puede comunicar con íconos, color y forma, jerarquía o elementos que se
   despliegan, en lugar de texto.
3. **Recomposición de las pantallas:** menos elementos simultáneos y una jerarquía clara.

Límites que hay que respetar (CLAUDE.md): rotular "estimado" con la hora, aviso de "Datos provisionales",
atribuciones visibles (OpenStreetMap y Open-Meteo), texto de 15 px como mínimo y no distinguir nada solo por
color.

---

## 3. Permiso de ubicación: que la app guíe (o lo resuelva) sin enredos

**Recibida:** 2026-10-06 · **Estado:** en espera

> Esto toca añadirlo, ya que es una barrera que hace que los que no saben se pierdan. ¿Cómo podemos hacer
> para que la misma app lo sugiera o incluso lo haga, para evitar este tipo de fricciones? (O cómo hago para
> que el enlace se detecte como seguro y evitar enredos.)

Origen: al probar en el celular con `npm run dev -- --host` (dirección `http://192.168…`) el GPS no
funciona, porque los navegadores solo dan la ubicación en páginas HTTPS. Además, si alguien pulsa
"Bloquear" una vez, el navegador no vuelve a preguntar.

Lo que la app **no** puede hacer: activar el permiso por sí misma ni volver segura una dirección HTTP. El
navegador lo impide por seguridad.

Lo que **sí** puede hacer (propuesta para cuando se pida):

1. **Explicar antes de pedir.** Una pantalla previa (encaja en la pantalla 03, Fase 8) que diga para qué se
   usa la ubicación y que todo queda en el teléfono. Su botón dispara la pregunta del navegador, para que la
   persona no pulse "Bloquear" por desconfianza.
2. **Detectar el caso y decir qué hacer.**
   - Dirección no segura (`window.isSecureContext` es falso): "Esta dirección de prueba no permite el GPS",
     con el enlace a la versión segura y el botón "Elegir en el mapa".
   - Permiso bloqueado (API de permisos: `denied`): pasos según el teléfono (Android con Chrome o iPhone con
     Safari), con capturas, y un botón "Ya lo activé, volver a intentar".
   - Ubicación apagada en el teléfono o sin señal: mensaje propio, distinto del permiso bloqueado.
   - Fuera del centro histórico: ya existe un aviso; la pantalla 21 (Fase 8) lo completa.
3. **Que la app siga sirviendo sin GPS.** "Elegir en el mapa" ya existe (Fase 6) y el "modo simulación"
   del recorrido llega en la Fase 7. Ambos deben ofrecerse en el mismo lugar del aviso, no escondidos.

**Enlace seguro:** la solución definitiva es publicar la app en GitHub Pages (Fase 10). Así queda un enlace
fijo con HTTPS que cualquiera abre en el celular, sin VS Code ni terminal. Si se necesita antes (por
ejemplo, para pruebas con usuarios), se puede adelantar una publicación de prueba, pero solo si la autora lo
pide. Mientras tanto, Codespaces con el puerto 5173 en "Público" también da HTTPS.

---

## 4. "Cómo llegar a la Plaza Alfonso López" sale de la app hacia Google Maps

**Recibida:** 2026-10-07 · **Estado:** en espera

> Lo abrí en el móvil y cuando undí "Cómo llegar a la Plaza Alfonso López" me redirigió a Maps. ¿Por qué pasa
> eso? ¿No debería indicarme en la misma app web? Cuando uso mi ubicación, principalmente porque no estoy en
> el Centro Histórico.

Por qué pasa (es lo que pedían la pantalla 21 y la Fase 8): Umbral solo tiene las calles, las aceras y la
sombra de un círculo de 700 m alrededor de la plaza. Fuera de ahí no tiene red de calles para trazar un
camino, y Google Maps conoce toda la ciudad, el tráfico y los buses. El botón le pasa solo el destino (sin
clave y sin la ubicación de la persona) y avisa "Se abre Google Maps, fuera de Umbral".

Mejoras posibles (para decidir cuando se pida):

1. **Mapa de la ciudad dentro de la pantalla 21** (OpenFreeMap, que CLAUDE.md permite fuera del centro):
   dónde está la persona, dónde está el centro y la distancia, sin salir de la app. No da el camino calle
   por calle.
2. **"Ya llegué al centro"**: al volver de Google Maps, un botón que lleve directo a buscar la ruta con
   sombra.
3. **Rutas completas dentro de la app**: exige la red de calles de toda la ciudad y un servicio de rutas.
   Los confiables piden clave (CLAUDE.md: detenerse y preguntar) y la sombra fuera del centro no está
   modelada. No se recomienda para el prototipo.

---

## Resumen de pendientes en espera (2026-10-07)

La autora probó la Fase 9 y pidió guardar los pendientes hasta que los pida. Ninguno se trabaja sin su orden.

| Pendiente | De dónde viene | Estado |
|---|---|---|
| Tramos sin nombre (80 de 502) | Observación 1 | En espera: falta decidir cómo entregar los nombres |
| Menos texto y más claridad visual en las pantallas | Observación 2 | En espera |
| Colores de Precaución (#d69e00) y Evitar (#ef9f27) casi iguales (ΔE ≈ 4,5) | Validador de paleta (Fase 6) y revisión de accesibilidad (Fase 9) | En espera, como insumo de la observación 2. Hoy se distinguen por forma y nombre. Cambiarlos toca `design/` |
| Que la app guíe el permiso de ubicación | Observación 3 | Hecho en parte: aviso de dirección no segura (Fase 7) y pantalla 03 (Fase 8). Faltan los pasos según el teléfono y el botón de reintentar |
| "Cómo llegar" sale a Google Maps; mapa de la ciudad dentro de la 21 | Observación 4 | En espera |
| Placas QR (pantallas 08, 12 y `/placas`) | Decisión de la autora en la Fase 8 | En pausa. Al retomarlas hay que ubicar las dos placas; falta saber qué calle es la "Calle Grande" |
| Créditos del README (nombres de autores y docente) | Fase 10 | "[por completar]" hasta que la autora los dé |
| Licencia del código | Fase 10 | Por definir |
| Pruebas en un celular real: instalar la app, GPS en la calle, TalkBack y VoiceOver | Fases 7 y 9 | Para la prueba de campo de la Fase 10 |
