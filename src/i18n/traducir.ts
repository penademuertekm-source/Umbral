import type es from './es.json'

/** Todas las claves de texto, con puntos: 'semaforo.comodo', 'guia.color.titulo'… */
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>
}[keyof T & string]

export type TranslationKey = Leaves<typeof es>
export type TranslationVars = Record<string, string | number>

export interface Dictionary {
  [key: string]: string | Dictionary
}

export function lookup(dict: Dictionary, key: string): string | undefined {
  let node: string | Dictionary | undefined = dict
  for (const part of key.split('.')) {
    if (node === undefined || typeof node === 'string') return undefined
    node = node[part]
  }
  return typeof node === 'string' ? node : undefined
}

/** Reemplaza los marcadores {nombre} por los valores dados. */
export function interpolate(text: string, vars?: TranslationVars): string {
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

/** Lista plana de claves de un diccionario (para comparar es.json con en.json). */
export function flattenKeys(dict: Dictionary, prefix = ''): string[] {
  return Object.entries(dict).flatMap(([key, value]) =>
    typeof value === 'string' ? [prefix + key] : flattenKeys(value, `${prefix}${key}.`),
  )
}
