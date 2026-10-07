// Revisión de contraste (Fase 9, docs/accesibilidad.md): busca en los CSS de la app cada regla que pinta
// texto con un token (color: var(--um-…)) y lo compara con su fondo (background: var(--um-…) en la misma
// regla o, si no tiene, los dos fondos de la app: base-fondo y base-superficie). Calcula la razón de
// contraste WCAG 2.1 en el modo normal y en "Alto contraste". Uso: npm run contraste
//
// Cuando el fondo real lo pone un contenedor, la regla lo dice con un comentario:
//   /* contraste: fondo=um-termico-sombra-plena */   el fondo del contenedor
//   /* contraste: grande */                          texto de 24 px (o 18,7 px en negrita): basta 3:1
//   /* contraste: grafico */                         ícono o forma, no texto: basta 3:1 (WCAG 1.4.11)
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const css = readFileSync(join(ROOT, 'design/tokens.css'), 'utf8')

function tokens(block) {
  const out = {}
  for (const m of block.matchAll(/--(um-[\w-]+):\s*(#[0-9a-fA-F]{6}|rgba?\([^)]*\))/g)) out[m[1]] = m[2]
  return out
}
const base = tokens(css.slice(0, css.indexOf('}')))
const highContrast = { ...base, ...tokens(/data-alto-contraste="true"\]\s*\{([^}]*)\}/.exec(css)?.[1] ?? '') }

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const lum = (h) => {
  const [r, g, b] = hex(h).map(lin)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

// Los niveles del semáforo usan variables locales (estilos/niveles.module.css).
const LEVELS = ['comodo', 'precaucion', 'evitar', 'no-recomendado', 'nublado']
const resolve = (name, level) =>
  name === 'nivel-texto' ? `um-semaforo-${level}-texto` : name === 'nivel-fondo' ? `um-semaforo-${level}-fondo` : name

function files(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.css') ? [p] : []
  })
}

const pairs = new Map()
for (const file of files(join(ROOT, 'src'))) {
  const text = readFileSync(file, 'utf8')
  for (const m of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const hint = /contraste:\s*([^*]+)\*\//.exec(m[2])?.[1] ?? ''
    const body = m[2].replace(/\/\*[\s\S]*?\*\//g, '')
    const selector = m[1].replace(/\/\*[\s\S]*?\*\//g, '').trim()
    const color = /(?:^|;|\s)color:\s*var\(--([\w-]+)\)/.exec(body)?.[1]
    if (!color || !(color.startsWith('um-') || color.startsWith('nivel-'))) continue
    const large = /\b(grande|grafico)\b/.test(hint)
    const bg = /fondo=([\w-]+)/.exec(hint)?.[1] ?? /background(?:-color)?:\s*var\(--([\w-]+)\)/.exec(body)?.[1]
    const backgrounds = bg ? [bg] : ['um-base-fondo', 'um-base-superficie']
    const levels = color.startsWith('nivel-') || bg?.startsWith('nivel-') ? LEVELS : [null]
    for (const level of levels) {
      for (const b of backgrounds) {
        const fg = resolve(color, level)
        const bk = resolve(b, level)
        if (!base[fg]?.startsWith('#') || !base[bk]?.startsWith('#')) continue
        const key = `${fg} sobre ${bk}${large ? ' (3:1)' : ''}`
        const where = `${relative(ROOT, file)} ${selector.split(/\s+/).slice(-1)[0]}`
        const entry = pairs.get(key) ?? { fg, bk, where: [], min: large ? 3 : 4.5 }
        if (!entry.where.includes(where)) entry.where.push(where)
        pairs.set(key, entry)
      }
    }
  }
}

const rows = [...pairs.values()]
  .map((p) => ({ ...p, normal: ratio(base[p.fg], base[p.bk]), alto: ratio(highContrast[p.fg], highContrast[p.bk]) }))
  .sort((a, b) => a.normal - b.normal)

console.log('| Texto o gráfico | Fondo | Normal | Alto contraste | Mínimo AA | Resultado | Dónde |')
console.log('|---|---|---|---|---|---|---|')
for (const r of rows) {
  const ok = Math.min(r.normal, r.alto) >= r.min ? 'cumple' : 'NO cumple'
  console.log(`| \`${r.fg}\` | \`${r.bk}\` | ${r.normal.toFixed(2)} | ${r.alto.toFixed(2)} | ${r.min === 3 ? '3:1' : '4,5:1'} | ${ok} | ${r.where.slice(0, 2).join('; ')}${r.where.length > 2 ? ` y ${r.where.length - 2} más` : ''} |`)
}
const failing = rows.filter((r) => Math.min(r.normal, r.alto) < r.min)
console.error(`\n${rows.length} pares; ${failing.length} no cumplen.`)
process.exitCode = failing.length > 0 ? 1 : 0
