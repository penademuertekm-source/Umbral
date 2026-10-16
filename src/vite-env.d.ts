/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Dirección pública de la app (GitHub Pages). La usarán los QR de las placas (Fase 8, en pausa). */
  readonly VITE_URL_PUBLICA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** Commit con el que se armó la app (vite.config.ts). */
declare const __APP_VERSION__: string
/** Fecha y hora en que se armó la app (ISO 8601). */
declare const __APP_BUILT__: string
