// Lee un token de color de design/tokens.css (para el manifiesto de la PWA y los íconos), así el color sale
// siempre de la fuente de verdad del diseño y no se copia a mano.
import { readFileSync } from 'node:fs'

const TOKENS = new URL('../design/tokens.css', import.meta.url)

export function token(name) {
  const css = readFileSync(TOKENS, 'utf8')
  const match = new RegExp(`--${name}:\\s*([^;]+);`).exec(css)
  if (!match) throw new Error(`No existe el token --${name} en design/tokens.css`)
  return match[1].trim()
}
