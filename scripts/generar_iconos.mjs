// Genera los íconos de la PWA (Fase 9) desde design/marca/isotipo-negativo.svg, sobre el verde de sombra
// plena de los tokens. Se corre a mano (npm run iconos) y los PNG quedan en public/iconos/.
//   icono-192.png, icono-512.png       propósito "any" (margen pequeño)
//   icono-adaptable-512.png             propósito "maskable": el isotipo dentro de la zona segura (80 %)
//   apple-touch-icon.png (180)          pantalla de inicio de iOS
import { mkdirSync, readFileSync } from 'node:fs'
import sharp from 'sharp'
import { token } from './tokens.mjs'

const SOURCE = new URL('../design/marca/isotipo-negativo.svg', import.meta.url)
const OUT = new URL('../public/iconos/', import.meta.url)
const background = token('um-termico-sombra-plena')
const svg = readFileSync(SOURCE)

async function icon(file, size, padding) {
  const inner = Math.round(size * (1 - 2 * padding))
  const logo = await sharp(svg, { density: 600 }).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(new URL(file, OUT).pathname)
  console.log(`  ${file} (${size} px)`)
}

mkdirSync(OUT, { recursive: true })
console.log(`Íconos sobre ${background}:`)
await icon('icono-192.png', 192, 0.16)
await icon('icono-512.png', 512, 0.16)
await icon('icono-adaptable-512.png', 512, 0.26)
await icon('apple-touch-icon.png', 180, 0.16)
