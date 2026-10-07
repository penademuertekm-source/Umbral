# Accesibilidad · Revisión de la Fase 9 (WCAG 2.1 AA)

Revisión del 2026-10-07 sobre el build de producción, a 390 × 844 px, en Chromium. Meta de CLAUDE.md:
contraste AA, nada distinguido solo por color, texto de 15 px como mínimo, botones de 60 px, área táctil de
56 px, `prefers-reduced-motion`, etiquetas ARIA y `lang` correcto.

## Resultado

| Revisión | Cómo | Resultado |
|---|---|---|
| Contraste de los pares de tokens usados en texto | `npm run contraste` (scripts/contraste.mjs) | 17 pares, todos cumplen en modo normal y en alto contraste |
| Análisis automático (axe-core 4, reglas WCAG 2.0/2.1 A y AA más buenas prácticas) | 22 pantallas | Sin hallazgos (después de las correcciones) |
| Lo mismo con Texto grande y Alto contraste activos | 22 pantallas | Sin hallazgos y sin desbordes horizontales |
| Área táctil ≥ 56 × 56 px | Medición de todo lo interactivo visible en las 22 pantallas | Todo cumple |
| Foco visible | `:focus-visible` global: contorno de 3 px (`--um-mapa-usuario`) | Cumple |
| Movimiento reducido | Regla global que anula animaciones y transiciones; MapLibre anula las animaciones de cámara por su cuenta | Cumple |
| Idioma | `<html lang>` sigue al idioma elegido; los textos bilingües de la 02 llevan su propio `lang` | Cumple |
| Texto mínimo | Micro y Etiqueta en 15 px (20 px con Texto grande) | Cumple |

Pantallas revisadas: 01, 02, 03, 21, 04 (mapa, ficha 07 e isócronas), 05, 06, 15, 16, 13, 22, 10, 11, 23,
14, 09, 17, 19 y 18 de ejemplo, y la 08 en pausa.

## Correcciones de esta revisión

- **El Niño (09):** el signo "!" ámbar sobre blanco daba 2,2:1. Ahora usa el texto ámbar oscuro del mismo
  nivel (6,7:1).
- **Sin ruta con sombra (16):** el subtítulo gris sobre la banda ámbar daba 4,4:1. Ahora usa el color de
  texto del nivel (5,4:1 o más en los cinco niveles).
- **Regiones:** la 06, la 13, la 10 y la 09 como página no tenían `<main>`. Los marcadores del mapa quedaban
  fuera de toda región.
- **Mapa (04):** tiene un título principal para lectores de pantalla ("Mapa en tiempo real predictivo").
- **Sin conexión (14):** orden de los títulos (h1 → h2).

## Contraste de los tokens

Se calcula con la fórmula de WCAG 2.1. El texto grande (24 px, o 18,7 px en negrita) y los gráficos (íconos,
formas) necesitan 3:1; el resto, 4,5:1. Cuando el fondo real lo pone un contenedor, la regla CSS lo dice con
un comentario `/* contraste: fondo=… */`, que el script lee.

| Texto o gráfico | Fondo | Normal | Alto contraste | Mínimo AA | Resultado | Dónde |
|---|---|---|---|---|---|---|
| `um-semaforo-precaucion-texto` | `um-semaforo-evitar-forma` | 3.37 | 3.37 | 3:1 | cumple | src/app/elnino/ElNino.module.css .cabecera |
| `um-marca-canaguate` | `um-termico-sombra-plena` | 3.53 | 3.53 | 3:1 | cumple | src/app/recorrido/RutaEnCurso.module.css .flecha |
| `um-base-texto-secundario` | `um-base-fondo` | 4.69 | 16.52 | 4,5:1 | cumple | src/app/PantallaPendiente.module.css .meta; src/app/SinConexion.module.css .secundario y 33 más |
| `um-base-texto-secundario` | `um-base-superficie` | 5.07 | 17.87 | 4,5:1 | cumple | src/app/PantallaPendiente.module.css .meta; src/app/SinConexion.module.css .secundario y 35 más |
| `um-semaforo-comodo-texto` | `um-semaforo-comodo-fondo` | 5.41 | 5.41 | 4,5:1 | cumple | src/app/SinConexion.module.css .si; src/app/ajustes/Ajustes.module.css .tarjeta y 18 más |
| `um-semaforo-comodo-fondo` | `um-termico-sombra-plena` | 5.41 | 5.41 | 4,5:1 | cumple | src/app/entrada/Entrada.module.css .claro; src/app/recorrido/Llegada.module.css .claro y 1 más |
| `um-termico-sombra-plena` | `um-semaforo-comodo-fondo` | 5.41 | 5.41 | 4,5:1 | cumple | src/componentes/Marcador/Marcador.module.css .arbol |
| `um-semaforo-no-recomendado-texto` | `um-semaforo-no-recomendado-fondo` | 5.53 | 5.53 | 4,5:1 | cumple | src/app/guia/Guia.module.css .iconoTinte; src/app/guia/PanelSombra.module.css .aviso y 12 más |
| `um-semaforo-evitar-texto` | `um-semaforo-evitar-fondo` | 5.87 | 5.87 | 4,5:1 | cumple | src/app/entrada/Entrada.module.css .consejo; src/app/guia/Guia.module.css .iconoTinte y 14 más |
| `um-termico-sombra-plena` | `um-base-fondo` | 5.94 | 5.94 | 4,5:1 | cumple | src/app/entrada/Entrada.module.css .etiquetaCentro; src/app/recorrido/RutaEnCurso.module.css .enlace y 5 más |
| `um-base-texto-inverso` | `um-termico-sombra-plena` | 6.43 | 6.43 | 4,5:1 | cumple | src/app/entrada/Entrada.module.css .inicio; src/app/mapa/MapaPrincipal.module.css .botonActivo y 4 más |
| `um-termico-sombra-plena` | `um-base-superficie` | 6.43 | 6.43 | 4,5:1 | cumple | src/app/entrada/Entrada.module.css .etiquetaCentro; src/app/recorrido/Llegada.module.css .check y 6 más |
| `um-semaforo-precaucion-texto` | `um-semaforo-precaucion-fondo` | 6.58 | 6.58 | 4,5:1 | cumple | src/app/guia/Guia.module.css .nota; src/app/guia/Guia.module.css .iconoTinte y 12 más |
| `um-semaforo-evitar-texto` | `um-base-superficie` | 6.73 | 6.73 | 4,5:1 | cumple | src/app/elnino/ElNino.module.css .signo |
| `um-semaforo-nublado-texto` | `um-semaforo-nublado-fondo` | 7.26 | 7.26 | 4,5:1 | cumple | src/app/SinConexion.module.css .icono; src/app/SinConexion.module.css .no y 22 más |
| `um-base-texto` | `um-base-fondo` | 16.52 | 16.52 | 4,5:1 | cumple | src/app/ajustes/Ajustes.module.css .fila; src/app/guia/Guia.module.css .tamanos y 7 más |
| `um-base-texto` | `um-base-superficie` | 17.87 | 17.87 | 4,5:1 | cumple | src/app/ajustes/Ajustes.module.css .fila; src/app/entrada/Entrada.module.css .etiqueta y 15 más |

## Lo que queda pendiente o fuera de esta revisión

- **Precaución y Evitar se parecen mucho por color**: `--um-semaforo-precaucion-forma` (#d69e00) y
  `--um-semaforo-evitar-forma` (#ef9f27), con ΔE ≈ 4,5 en visión normal. Cumplen el contraste, pero cuesta
  distinguirlos entre sí. Por eso nunca se usan solos: cada nivel tiene su forma (triángulo y rombo) y su
  nombre. Cambiar los tokens toca `design/`; queda como insumo para la observación 2 de la autora.
- **El mapa es una imagen (canvas)**: el lector de pantalla no lo recorre. Lo compensan la ficha de cada
  tramo (07), las listas de destinos y refugios, las tarjetas de ruta y el gráfico de la 15, que tiene una
  lista oculta con los mismos datos.
- **Prueba con lectores de pantalla reales** (TalkBack en Android y VoiceOver en iPhone): pendiente para la
  prueba en la calle (Fase 10).
- **Las etiquetas dibujadas dentro del mapa** (nombres de lugares cubiertos en el modo nublado) usan los
  tokens de texto sobre superficie, pero no entran en el cálculo automático.
