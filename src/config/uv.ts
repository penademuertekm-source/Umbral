// Categorías del índice UV de la OMS (Global Solar UV Index, 2002).
export type UvCategory = 'bajo' | 'moderado' | 'alto' | 'muy_alto' | 'extremo'

export function uvCategory(uv: number): UvCategory {
  if (uv < 3) return 'bajo'
  if (uv < 6) return 'moderado'
  if (uv < 8) return 'alto'
  if (uv < 11) return 'muy_alto'
  return 'extremo'
}
