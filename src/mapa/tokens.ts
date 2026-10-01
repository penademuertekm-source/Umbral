// MapLibre necesita colores concretos: se leen de design/tokens.css en tiempo de ejecución
// (así no hay ningún hex escrito en el código y el mapa sigue a los tokens, incluido Alto contraste).

export function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export interface MapColors {
  fondo: string
  manzana: string
  via: string
  plaza: string
  sombra: string
  parcial: string
  exposicion: string
  marcaExpuesto: string
  texto: string
  superficie: string
  borde: string
  arbolFondo: string
}

export function mapColors(): MapColors {
  return {
    fondo: token('--um-mapa-fondo'),
    manzana: token('--um-mapa-manzana'),
    via: token('--um-mapa-via-neutra'),
    plaza: token('--um-semaforo-comodo-fondo'),
    sombra: token('--um-termico-sombra-plena'),
    parcial: token('--um-termico-sombra-parcial'),
    exposicion: token('--um-termico-exposicion'),
    marcaExpuesto: token('--um-mapa-marca-expuesto'),
    texto: token('--um-base-texto'),
    superficie: token('--um-base-superficie'),
    borde: token('--um-base-borde'),
    arbolFondo: token('--um-semaforo-comodo-fondo'),
  }
}
