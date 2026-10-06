// Tipos de los dos módulos de jsthermalcomfort (MIT) que usa la app. Se importan por ruta directa para
// no cargar el resto de la librería (su modelo JOS-3 depende de mathjs, que pesa mucho).

declare module 'jsthermalcomfort/lib/esm/models/utci.js' {
  /** UTCI (°C), redondeado a 0,1. Devuelve NaN fuera del rango válido si `limitInputs` es true. */
  export function utci(
    tdb: number,
    tr: number,
    v: number,
    rh: number,
    units?: 'SI' | 'IP',
    returnStressCategory?: boolean,
    limitInputs?: boolean,
  ): { utci: number; stress_category?: string | number }
}

declare module 'jsthermalcomfort/lib/esm/models/solar_gain.js' {
  /** SolarCal (ASHRAE 55, apéndice C): campo radiante efectivo (W/m²) y aumento de la temperatura radiante media (°C). */
  export function solar_gain(
    solAltitude: number,
    sharp: number,
    solRadiationDir: number,
    solTransmittance: number,
    fSvv: number,
    fBes: number,
    asw?: number,
    posture?: 'standing' | 'sitting' | 'supine',
    floorReflectance?: number,
  ): { erf: number; delta_mrt: number }
}
