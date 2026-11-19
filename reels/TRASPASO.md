# Traspaso · Reel 1 de Umbral

Nota para seguir el reel en una sesión de Claude Code en el PC de la autora, después de una sesión en la nube
que no tenía acceso a la carpeta `C:\Users\Alfredo\Social Media Umbral\Reels\`.

Las reglas siguen siendo las de `Reels\DESIGN.md`, `Reels\guion-tecnico-reels.md` y `Reels\prompt-reel-1.md`.
Léelas completas antes de seguir.

## Etapa 1 · Capturas reales: hecha

- Script: `reels/scripts/capturar-reel1.cjs` (en este repositorio). Con la app corriendo
  (`npx vite --port 5179 --strictPort`), se corre con `node reels/scripts/capturar-reel1.cjs`.
  Para repetir una sola parte: `SOLO=barrido`, `SOLO=rutas`, `SOLO=recorrido` o `SOLO=tecleo`
  (en PowerShell: `$env:SOLO="barrido"; node reels/scripts/capturar-reel1.cjs`).
- Salida: `reels/capturas/reel-1/`, a 390 × 844 y ×3 (1170 × 2532 px):
  - `barrido/mapa-0700.png` … `mapa-1530.png`, cada 15 min (35), y copias de `mapa-0700`, `mapa-1130` y `mapa-1530`;
  - `rutas-1130.png`, `recorrido.png`;
  - `tecleo/tecleo-00.png` (campo vacío) a `tecleo-13.png` ("Plaza Alfonso").
- Condiciones: reloj fijo con `page.clock.setFixedTime` el 19 de noviembre de 2026 a las 11:30 a. m., hora de Bogotá,
  y ubicación simulada a 180 m al sur de la Plaza Alfonso López (10.476851, -73.244632).
- El script oculta "provisional", como pide el guion. También oculta el chip "Sin datos de clima" y la línea
  "Sensación térmica: — al sol · — a la sombra", porque ese día Open-Meteo no respondía por límite diario.
  No pone ningún valor en su lugar. Decisión de la autora: dejarlo resuelto así en la edición por ahora.
  Si en el PC Open-Meteo sí responde, conviene repetir las capturas para que se vea el clima real.

### Cifras reales que cambian el guion (aprobado por la autora: ajustarse a ellas)

| Lugar | Decía el guion | Muestra la app |
|---|---|---|
| Buscador, resultado | Plaza Alfonso López · 90 m · 1 min · 62 % | Plaza Alfonso López · 180 m · 3 min · 62 % |
| Rutas | Ruta recomendada · 90 m · 62 % en sombra · 1 min | Ruta con más sombra · 180 m · 62 % en sombra · 3 min |
| Recorrido | Sigue por la acera oriental · 50 m hasta la esquina de la Calle 15 | Sigue por la acera norte · 20 m hasta la esquina de la Cra. 6 |

Cualquier texto del reel o del pie de foto que cite estas cifras debe usar las de la app.

## Lo que sigue

- **Etapa 2 · Música**: tal como está en el prompt (Proximity desde 5,87 s, compás de 1,395 s, verificación con earshot).
- Etapas 3 a 5: sin cambios. Al terminar cada etapa, mostrar el resultado y esperar la aprobación de la autora.
- El proyecto de Remotion puede ir en `reels/reel-1/` de este repositorio o en la carpeta `Reels` del PC.
  No toca el código de la app (`src/`).
