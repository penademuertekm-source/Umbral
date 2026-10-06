// Copia datos/provisional/clima_config.json a public/datos/ antes de `npm run dev` y `npm run build`,
// para que un cambio hecho a mano (p. ej. activar El Niño) llegue a la app sin correr todo el pipeline.
import { copyFile, readFile } from 'node:fs/promises'

const origen = new URL('../datos/provisional/clima_config.json', import.meta.url)
const destino = new URL('../public/datos/clima_config.json', import.meta.url)

const texto = await readFile(origen, 'utf8')
JSON.parse(texto) // si el JSON quedó mal escrito, se detiene aquí con un error claro
const actual = await readFile(destino, 'utf8').catch(() => '')
if (actual !== texto) {
  await copyFile(origen, destino)
  console.log('clima_config.json copiado a public/datos/')
}
