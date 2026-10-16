# Prompts del rediseño para Claude Code · Umbral

Prompts para aplicar en código los puntos de `docs/cambios-interfaz.md` que Claude (chat) deja en
`listo para código`. Las reglas de trabajo conjunto están en CLAUDE.md, sección "Trabajo con Claude (chat)".

**Cómo usar este archivo**

1. Abre Claude Code en la carpeta del proyecto y escribe `/clear`.
2. Copia el bloque **Prompt** del paso que toca y pégalo. También puedes escribir solo
   `Ejecuta el paso R1a de docs/prompts-rediseno.md`.
3. Lee el plan que te muestre antes de aprobarlo.
4. Al terminar, sigue **Cómo verificar** y avísale a Claude (chat) para que revise el enlace publicado.

Cada paso debería caber en una ventana de uso del plan Pro. Si se corta, usa el prompt **Retomar** del final.

---

## Paso R1a · Piezas de la pantalla del mapa

Puntos: **04-1, 04-9, G1, G10** y los componentes de **N1** (chip estimado, aviso, barra inferior y hoja
inferior), más el ícono Mapa.

**Prompt**
```
Lee CLAUDE.md (sobre todo "Trabajo con Claude (chat)"), docs/cambios-interfaz.md y, en
docs/especificacion-pantallas.md, la tabla "Componentes base" y la sección
"04 · Mapa — rediseño 2026". Haz git pull antes de empezar.

Vamos con el paso R1a de docs/prompts-rediseno.md: las piezas que necesita la nueva pantalla 04.
Todavía no recompongas la pantalla; eso es el paso R1b.

1. Ícono Mapa: crea design/iconos/interfaz/mapa.svg con el SVG que trae la especificación
   (fila "Íconos") y agrégalo a design/iconos/indice.json.
2. 04-1 · Trazos del mapa en src/mapa/capas.ts: sombra = línea continua; parcial = rayas de 10/5 px;
   al sol = puntos redondos cada 7 px (line-cap round). Grosor 4 px. Quita la marca central punteada
   del expuesto. Actualiza el componente MuestraTramo para que la leyenda use los mismos trazos.
   La leyenda dice "Sombra · Parcial · Al sol" (es) y "Shade · Partial · In the sun" (en).
3. 04-9 · Grupos de árboles: el marcador muestra el ícono de árbol, sin número.
4. G1 · Componente ChipEstimado: "Estimado · {hora}" y, mientras haya datos provisionales,
   "· provisional" en el color de texto de Precaución, más el ícono Información. Área táctil de
   56 px. Al tocarlo abre una hoja con "Datos provisionales", las fuentes y las atribuciones.
5. Componente Aviso con los niveles Alerta, Aviso, Recogido y Nublado (medidas y colores en la
   especificación). Se ve un aviso a la vez; si hay más, el contador "+N" los abre. Al leerlo
   pasa a Recogido; no desaparece.
6. Componente BarraInferior: Mapa · Ir a · Descansar · Ajustes, con ícono y palabra, la pestaña
   activa con indicador. Rutas: Mapa = /mapa, Ir a = /buscar, Descansar = /refugios,
   Ajustes = /ajustes. Respeta el área segura inferior del celular.
7. Ajusta HojaInferior a tres alturas (asomada, media y completa) en % del alto de pantalla.
8. G10 · Atribución: quítala de encima del mapa. Va en Ajustes › Créditos (crea la sección si no
   existe) y se muestra también en la pantalla de inicio. En el mapa queda un botón ⓘ que abre
   Créditos.

Reglas: todo texto sale de src/i18n (es y en), solo tokens de design/tokens.css, texto mínimo
15 px, nada distinguido solo por color. Un commit por punto con el formato "<número>: <resumen>",
y en el mismo commit cambia su estado a "hecho" en docs/cambios-interfaz.md. Antes de cada
commit corre npm run build y npm test. Si algo contradice la especificación, detente y anótalo
en "Notas de Claude Code" al final de docs/cambios-interfaz.md.
```

**Cómo verificar**
1. `npm run dev` y abre `/mapa`: los tres trazos se distinguen en blanco y negro (captura en gris).
2. Toca el chip "Estimado": se abre la hoja con datos provisionales y atribuciones.
3. Abre `/ajustes`: está la sección Créditos con OpenStreetMap y Open-Meteo.

---

## Paso R1b · Composición de la pantalla 04

Puntos: **04-5, 04-6, 04-7, 04-8, 04-10**. Necesita el paso R1a terminado.

**Prompt**
```
Lee CLAUDE.md, docs/cambios-interfaz.md y la sección "04 · Mapa — rediseño 2026" de
docs/especificacion-pantallas.md. Si la especificación no alcanza, mira solo los nodos 110:78
(soleado) y 110:282 (nublado) de Figma con get_screenshot. Haz git pull antes de empezar.

Vamos con el paso R1b de docs/prompts-rediseno.md: recomponer src/app/mapa/MapaPrincipal.tsx
con las piezas del paso R1a.

1. 04-6 · Encabezado de una línea (64 px): la hora con un chevron (al tocarla abre el deslizador
   de hora) y, a la derecha, el semáforo con el nivel de calor. La línea del UTCI sale del
   encabezado.
2. Mapa entre el encabezado y la barra inferior; el chip estimado flota arriba a la izquierda
   con la misma hora del encabezado.
3. 04-7 · Nombres de calles (de la propiedad "nombre" de public/datos/red.geojson, en pastillas
   blancas de 15 px giradas con la calle, sin repetir el mismo nombre cerca) y lugares de
   referencia con ícono: Plaza Alfonso López e Iglesia La Concepción. La vista inicial
   encuadra a la persona y la plaza.
4. 04-8 · Sobre el mapa solo quedan "Mi ubicación" (56 px) y el botón ⓘ de créditos. Los demás
   botones redondos salen; su función pasa a la barra inferior.
5. 04-5 · Hoja inferior asomada con: el aviso (si hay), "Sensación térmica: X° al sol · Y° a la
   sombra" (antes UTCI estimado), la leyenda (Sombra · Parcial · Al sol · Árboles) y el buscador
   "¿A dónde vas?" de 56 px que lleva a /buscar. Lo que hoy flota sobre el mapa (aviso de
   nublado, leyenda) entra en la hoja.
6. 04-10 · Nublado: la capa de sombra se ve al 35 % y los árboles al 60 % (ya no se ocultan). En
   la hoja va el aviso Nublado (gris): "Está nublado: la sombra cambia poco" / "El mapa la
   muestra más tenue". El semáforo sigue mostrando el nivel de calor.
7. Barra inferior con Mapa activa.

Mismas reglas que el paso R1a: i18n, tokens, 15 px, nada solo por color, un commit por punto
con su estado en "hecho", build y pruebas antes de cada commit, y anotar contradicciones en
"Notas de Claude Code".
```

**Cómo verificar**
1. Abre `/mapa` en un celular de 360 × 640 (herramientas de desarrollo): el usuario, la hoja y la
   barra se ven sin montarse.
2. Con `?hora=` en una hora nublada (o forzando el estado), la sombra se ve tenue y el aviso gris
   está en la hoja.
3. Toca la hora del encabezado: se abre el deslizador.

---

## Retomar (si se cortó el uso)

```
Lee CLAUDE.md y docs/cambios-interfaz.md, haz git pull y revisa git log. Continúa el paso que
estaba en curso de docs/prompts-rediseno.md desde el primer punto que no esté en "hecho".
```
