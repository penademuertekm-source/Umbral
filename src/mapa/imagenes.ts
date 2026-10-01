// Íconos del mapa dibujados en el navegador (sin sprites ni fuentes externas, para funcionar sin conexión).
import type { Map as MapLibreMap } from 'maplibre-gl'
import { ICON_SVGS } from '../componentes/Icono/svgs'
import type { MapColors } from './tokens'

const RATIO = 2
const SIZE = 40 // como el componente Marcador (Figma, nodo 43:86)

function canvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas')
  c.width = c.height = SIZE * RATIO
  const ctx = c.getContext('2d')!
  ctx.scale(RATIO, RATIO)
  return [c, ctx]
}

function circle(ctx: CanvasRenderingContext2D, fill: string, stroke: string, strokeWidth: number) {
  ctx.beginPath()
  ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - strokeWidth / 2 - 1, 0, Math.PI * 2)
  ctx.fillStyle = fill
  ctx.fill()
  ctx.lineWidth = strokeWidth
  ctx.strokeStyle = stroke
  ctx.stroke()
}

async function svgImage(icon: string, color: string): Promise<HTMLImageElement> {
  const markup =
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" ` +
    `stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" color="${color}">` +
    `${ICON_SVGS[icon] ?? ''}</svg>`
  const image = new Image()
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
  await image.decode()
  return image
}

/** Marcador "árbol": fondo menta, borde fino e ícono verde de 20 px. */
async function treeImage(icon: string, colors: MapColors) {
  const [c, ctx] = canvas()
  circle(ctx, colors.arbolFondo, colors.borde, 1)
  ctx.drawImage(await svgImage(icon, colors.sombra), 10, 10, 20, 20)
  return ctx.getImageData(0, 0, c.width, c.height)
}

/** Marcador "grupo de árboles": verde con borde blanco y el número. */
function groupImage(count: number, colors: MapColors) {
  const [c, ctx] = canvas()
  circle(ctx, colors.sombra, colors.superficie, 3)
  ctx.fillStyle = colors.superficie
  ctx.font = `600 ${count > 99 ? 13 : 15}px Inter, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(count), SIZE / 2, SIZE / 2 + 1)
  return ctx.getImageData(0, 0, c.width, c.height)
}

export async function addMapImages(map: MapLibreMap, colors: MapColors): Promise<void> {
  const [mango, canaguate] = await Promise.all([treeImage('mango', colors), treeImage('canaguate-en-flor', colors)])
  map.addImage('arbol-mango', mango, { pixelRatio: RATIO })
  map.addImage('arbol-canaguate', canaguate, { pixelRatio: RATIO })
  // Los números de los grupos se dibujan cuando el mapa los pide.
  map.setMissingStyleImageResolver((id) => {
    const match = /^grupo-(\d+)$/.exec(id)
    if (match && !map.hasImage(id)) map.addImage(id, groupImage(Number(match[1]), colors), { pixelRatio: RATIO })
  })
}
