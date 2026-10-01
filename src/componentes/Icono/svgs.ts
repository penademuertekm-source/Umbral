// Carga en el build el contenido de los SVG de design/iconos/ (son pequeños: ~10 KB en total).
// Se guarda solo el interior de cada <svg>; el <svg> exterior lo pone el componente Icono.
const raw = import.meta.glob<string>('../../../design/iconos/*/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function innerMarkup(svg: string): string {
  return svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
}

export const ICON_SVGS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(raw).map(([path, svg]) => {
    const name = path.slice(path.lastIndexOf('/') + 1, -'.svg'.length)
    return [name, innerMarkup(svg)]
  }),
)
