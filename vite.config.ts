import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
