/** Alturas de la hoja inferior (04-5, Figma 105:328): asomada ≈ 200, media ≈ 420 y completa ≈ 720 px de 844. */
export const SHEET_HEIGHTS = ['asomada', 'media', 'completa'] as const
export type SheetHeight = (typeof SHEET_HEIGHTS)[number]
