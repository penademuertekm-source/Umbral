import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig, type Plugin } from 'vitest/config'
import { token } from './scripts/tokens.mjs'

// Colores del manifiesto y de la barra del navegador: salen de design/tokens.css.
const themeColor = token('um-termico-sombra-plena')

/** <meta name="theme-color"> y el ícono de iOS, sin escribir colores a mano en index.html. */
function cabeceraPwa(): Plugin {
  let base = '/'
  return {
    name: 'umbral-cabecera-pwa',
    configResolved: (config) => {
      base = config.base
    },
    // Ruta con la base completa: el mismo index.html sirve también para /Umbral/ajustes/perfil-calor (404.html).
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { name: 'theme-color', content: themeColor }, injectTo: 'head' },
      { tag: 'link', attrs: { rel: 'apple-touch-icon', href: `${base}iconos/apple-touch-icon.png` }, injectTo: 'head' },
    ],
  }
}

/**
 * GitHub Pages no conoce las rutas de la app (/Umbral/mapa…): ante una ruta que no existe sirve 404.html.
 * Una copia de index.html hace que la app abra igual y resuelva la ruta (Fase 10).
 */
function respaldo404(): Plugin {
  let outDir = 'dist'
  return {
    name: 'umbral-respaldo-404',
    apply: 'build',
    configResolved: (config) => {
      outDir = config.build.outDir
    },
    closeBundle: () => copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html')),
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Ruta base: "/" en local; "/Umbral/" en GitHub Pages (la pone el flujo de publicación con VITE_BASE).
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    react(),
    cabeceraPwa(),
    respaldo404(),
    // PWA (Fase 9): la app, las fuentes, los íconos y los datos del centro quedan en el teléfono tras la
    // primera visita; el clima de Open-Meteo se pide a la red y, sin conexión, se usa la última respuesta.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Los íconos ya entran por globPatterns; agregarlos otra vez duplicaría la lista de precarga.
      includeManifestIcons: false,
      manifest: {
        name: 'Umbral',
        short_name: 'umbral',
        description: 'Sombra en tiempo real · Centro Histórico de Valledupar',
        lang: 'es',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: themeColor,
        background_color: themeColor,
        icons: [
          { src: 'iconos/icono-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'iconos/icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'iconos/icono-adaptable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Todo lo de dist: código, estilos, fuentes (woff2), íconos y public/datos (≈ 3 MB).
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json,geojson,gz}'],
        // La app está en español e inglés: no hacen falta las fuentes cirílicas, griegas ni vietnamitas.
        globIgnores: ['**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2', '404.html'],
        // MapLibre ocupa ~1 MB y muestras.bin.gz ~0,9 MB.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        // Cualquier pantalla abre sin conexión (la app resuelve la ruta).
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.open-meteo\.com\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'open-meteo',
              networkTimeoutSeconds: 8,
              expiration: { maxEntries: 8, maxAgeSeconds: 2 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  // GitHub Codespaces sirve la app en https://<nombre>-5173.app.github.dev: Vite solo responde a los
  // dominios permitidos (protección contra DNS rebinding), así que se agrega solo ese.
  server: { allowedHosts: ['.app.github.dev'] },
  preview: { allowedHosts: ['.app.github.dev'] },
  // Workers como módulos ES: el del motor de sombra y el de MapLibre (que importa su parte compartida).
  worker: { format: 'es' },
  build: {
    // MapLibre GL ocupa ~1 MB minificado (285 kB comprimido) y ya va en su propio trozo,
    // que solo se descarga al abrir el mapa.
    chunkSizeWarningLimit: 1100,
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/pruebas/preparar.ts'],
  },
})
