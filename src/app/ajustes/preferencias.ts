// Ajustes de la pantalla 11. Se guardan solo en el teléfono (CLAUDE.md, "Privacidad").

export interface Settings {
  /** Ningún texto por debajo de 20 px (design/tokens.css, data-texto-grande). */
  largeText: boolean
  /** Bordes y textos más fuertes (design/tokens.css, data-alto-contraste). */
  highContrast: boolean
  /** Aviso antes de salir entre las 11 y las 3 (pantalla 19). Activo por defecto. */
  heatWarning: boolean
  /** No descargar el clima: usar el último pronóstico guardado. */
  dataSaver: boolean
}

export type SettingKey = keyof Settings

const KEYS: Record<SettingKey, string> = {
  largeText: 'umbral.textoGrande',
  highContrast: 'umbral.altoContraste',
  heatWarning: 'umbral.avisoCalor',
  dataSaver: 'umbral.ahorroDatos',
}

const DEFAULTS: Settings = { largeText: false, highContrast: false, heatWarning: true, dataSaver: false }

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function readSettings(): Settings {
  const value = (key: SettingKey) => {
    const stored = read(KEYS[key])
    return stored === 'si' ? true : stored === 'no' ? false : DEFAULTS[key]
  }
  return {
    largeText: value('largeText'),
    highContrast: value('highContrast'),
    heatWarning: value('heatWarning'),
    dataSaver: value('dataSaver'),
  }
}

export function writeSetting(key: SettingKey, on: boolean): void {
  try {
    localStorage.setItem(KEYS[key], on ? 'si' : 'no')
  } catch {
    // Sin almacenamiento: el ajuste vale solo mientras la página esté abierta.
  }
}

/** Pasa Texto grande y Alto contraste a <html> (los modos están definidos en design/tokens.css). */
export function applyDisplaySettings(settings: Pick<Settings, 'largeText' | 'highContrast'>, root = document.documentElement): void {
  if (settings.largeText) root.dataset.textoGrande = 'true'
  else delete root.dataset.textoGrande
  if (settings.highContrast) root.dataset.altoContraste = 'true'
  else delete root.dataset.altoContraste
}
