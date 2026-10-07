/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Dirección pública de la app (GitHub Pages). La usarán los QR de las placas (Fase 8, en pausa). */
  readonly VITE_URL_PUBLICA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
