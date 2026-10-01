// Carga de public/datos/muestras.json y del archivo de perfiles (muestras.bin.gz, Fase 2).
import { buildModel, type SampleIndex, type ShadeModel } from './modelo'

type Fetch = (url: string) => Promise<Response>

/** Carpeta de los datos según la base de la app (en GitHub Pages, p. ej. /umbral/datos/). */
export function dataBaseUrl(): string {
  return `${import.meta.env.BASE_URL}datos/`
}

function isGzip(bytes: Uint8Array): boolean {
  return bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b
}

async function gunzip(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function get(fetchFn: Fetch, url: string): Promise<Response> {
  const response = await fetchFn(url)
  if (!response.ok) throw new Error(`No se pudo cargar ${url} (${response.status})`)
  return response
}

export async function loadModel(baseUrl = dataBaseUrl(), fetchFn: Fetch = fetch): Promise<ShadeModel> {
  const index = (await (await get(fetchFn, `${baseUrl}muestras.json`)).json()) as SampleIndex
  const file = index.archivo ?? 'muestras.bin'
  const bytes = new Uint8Array(await (await get(fetchFn, `${baseUrl}${file}`)).arrayBuffer())
  // Algunos servidores ya entregan el .gz descomprimido: se revisa la firma antes de descomprimir.
  const profiles = isGzip(bytes) ? await gunzip(bytes) : bytes
  return buildModel(index, profiles)
}
