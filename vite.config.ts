import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
