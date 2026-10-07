# Publicación en GitHub Pages

Umbral se publica como sitio estático en **https://penademuertekm-source.github.io/Umbral/**. La dirección
es HTTPS, así que el GPS funciona en cualquier celular, sin VS Code ni terminal.

## Cómo funciona

- El flujo `.github/workflows/pages.yml` corre solo cada vez que se suben cambios a la rama principal
  (`claude/inspiring-cannon-6rmgzq`, o `main` si algún día se crea). También se puede correr a mano.
- Pasos del flujo:
  1. Instala las dependencias y corre las pruebas y la revisión de código.
  2. Arma la app con la ruta base `/Umbral/` (`VITE_BASE`) y la dirección pública (`VITE_URL_PUBLICA`).
  3. Revisa si GitHub Pages está activado. Si lo está, publica; si no, termina con un aviso y sin error.
- `dist/404.html` es una copia de `index.html`. Por eso abrir directo una pantalla
  (`…/Umbral/mapa`, `…/Umbral/ajustes`) carga la app en vez de la página de error de GitHub.
- Después de la primera visita, el service worker guarda la app y los datos del centro en el teléfono
  (alcance `/Umbral/`).

## Activar Pages (una sola vez)

1. Entra a https://github.com/penademuertekm-source/Umbral.
2. Arriba, en las pestañas del repositorio, haz clic en **Settings** (Configuración).
3. En el menú de la izquierda, en la sección *Code and automation*, haz clic en **Pages**.
4. En **Build and deployment → Source**, elige **GitHub Actions**. No hace falta guardar nada más.
5. Ve a la pestaña **Actions**, elige **Publicar en GitHub Pages** a la izquierda y pulsa
   **Run workflow → Run workflow**.
6. Espera unos 2 minutos a que el círculo amarillo pase a verde.
7. En la tarjeta del flujo aparece el enlace de la publicación. También queda en *Settings → Pages*:
   "Your site is live at…".

## Si algo falla

- **El flujo termina con "GitHub Pages no está activado"**: falta el paso 4.
- **Error en "Pruebas y revisión de código"**: alguna prueba falló; el registro del paso dice cuál. No se
  publica nada hasta que pase.
- **La página abre en blanco**: recarga con Ctrl + F5. El service worker puede estar mostrando una versión
  anterior; la nueva se instala sola en la siguiente visita.

## Probarlo localmente con la misma ruta

```
set VITE_BASE=/Umbral/        (en Command Prompt; en PowerShell: $env:VITE_BASE="/Umbral/")
npm.cmd run build
npm.cmd run preview -- --base /Umbral/
```

Luego abre `http://localhost:4173/Umbral/`.
