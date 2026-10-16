// Metas de sol evitado (S3, docs/especificacion-pantallas.md). Valores PROVISIONALES: están aquí para que
// sea fácil cambiarlos. Regla: ninguna meta premia distancia, pasos ni salir entre 11 a. m. y 3 p. m.; no
// hay rachas que se pierdan ni tablas contra otros.

/** Niveles por sol evitado total (minutos). El nombre de cada uno está en i18n (logros.niveles.n1…n5). */
export const LEVELS = [
  { level: 1, minMinutes: 0 },
  { level: 2, minMinutes: 30 },
  { level: 3, minMinutes: 60 },
  { level: 4, minMinutes: 120 },
  { level: 5, minMinutes: 240 },
] as const

export type ChallengeKind = 'evitar' | 'temprano' | 'tarde' | 'planear' | 'lugar_nuevo'

/** Lista fija de retos. Cada semana tocan CHALLENGES_PER_WEEK seguidos, según el número de la semana. */
export const CHALLENGES: readonly { id: string; kind: ChallengeKind; target: number }[] = [
  { id: 'evitar-15', kind: 'evitar', target: 15 },
  { id: 'temprano', kind: 'temprano', target: 1 },
  { id: 'planear', kind: 'planear', target: 1 },
  { id: 'tarde', kind: 'tarde', target: 1 },
  { id: 'lugar-nuevo', kind: 'lugar_nuevo', target: 1 },
]
export const CHALLENGES_PER_WEEK = 3

/** "Salir temprano": antes de esta hora. "Tarde fresca": desde esta hora (hora de Valledupar). */
export const EARLY_BEFORE_HOUR = 8
export const LATE_FROM_HOUR = 16

export type AchievementId = 'primera_ruta' | 'planificador' | 'ayudaste' | 'madrugador' | 'tarde_fresca' | 'hora_evitada'

/** Los 6 logros. El nombre de cada uno está en i18n (logros.insignias.<id>). */
export const ACHIEVEMENTS: readonly { id: AchievementId; target: number }[] = [
  { id: 'primera_ruta', target: 1 }, // primera llegada
  { id: 'planificador', target: 3 }, // salidas planeadas
  { id: 'ayudaste', target: 1 }, // respuestas a "¿Te sirvió esta ruta?"
  { id: 'madrugador', target: 1 }, // llegadas con salida antes de las 8 a. m.
  { id: 'tarde_fresca', target: 1 }, // llegadas con salida desde las 4 p. m.
  { id: 'hora_evitada', target: 60 }, // minutos de sol evitado en total
]

/** Lunes desde el que se cuentan las semanas para elegir los retos (hora de Valledupar). */
export const WEEK_EPOCH = { year: 2026, month: 1, day: 5 } as const

/** Pasaporte del centro: un sello por destino de destinos.csv y por estos lugares de refugios.csv. */
export const PASSPORT_EXTRA_REFUGES = ['ref-parque-leyenda'] as const

export type CardId = 'mango' | 'canaguate' | 'alero' | 'otros' | 'muro'

/** Láminas del Álbum de la sombra, en el orden de Figma (151:2844). */
export const CARDS: readonly CardId[] = ['mango', 'canaguate', 'alero', 'otros', 'muro']

/** Un tramo de la ruta cuenta para una lámina si tiene al menos esta fracción en sombra (umbral de "parcial"). */
export const CARD_MIN_SHADE = 0.3
