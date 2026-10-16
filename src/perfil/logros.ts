// Progreso, retos y logros de S3, calculados a partir de lo guardado en el teléfono (llegadas, salidas
// planeadas y respuestas). Código puro: nada de esto se guarda aparte, así "Borrar mis datos" lo deja en cero.
import {
  ACHIEVEMENTS,
  CHALLENGES,
  CHALLENGES_PER_WEEK,
  EARLY_BEFORE_HOUR,
  LATE_FROM_HOUR,
  LEVELS,
  WEEK_EPOCH,
  type AchievementId,
  type ChallengeKind,
} from '../config/logros'
import { localDate, localParts, minutesOfDay } from '../sombra/tiempo'
import type { Arrival, ProfileData } from './almacen'

const DAY_MS = 86_400_000

/** Lunes 00:00 (hora de Valledupar) de la semana de `date`. La semana va de lunes a domingo. */
export function weekStart(date: Date): Date {
  const { year, month, day } = localParts(date)
  const midnight = localDate(year, month, day)
  // getUTCDay del día local: 0 = domingo.
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  const sinceMonday = (weekday + 6) % 7
  return new Date(midnight.getTime() - sinceMonday * DAY_MS)
}

/** Número de la semana desde WEEK_EPOCH (puede ser negativo antes de esa fecha). */
export function weekNumber(date: Date): number {
  const epoch = localDate(WEEK_EPOCH.year, WEEK_EPOCH.month, WEEK_EPOCH.day)
  return Math.floor((weekStart(date).getTime() - epoch.getTime()) / (7 * DAY_MS))
}

const inWeek = (iso: string, now: Date) => {
  const start = weekStart(now).getTime()
  const t = Date.parse(iso)
  return t >= start && t < start + 7 * DAY_MS
}

const isEarly = (a: Arrival) => minutesOfDay(new Date(a.departure)) < EARLY_BEFORE_HOUR * 60
const isLate = (a: Arrival) => minutesOfDay(new Date(a.departure)) >= LATE_FROM_HOUR * 60
const sum = (list: Arrival[]) => list.reduce((total, a) => total + a.avoided, 0)

export function avoidedTotal(profile: ProfileData): number {
  return sum(profile.arrivals)
}

export function avoidedThisWeek(profile: ProfileData, now: Date): number {
  return sum(profile.arrivals.filter((a) => inWeek(a.date, now)))
}

export interface LevelProgress {
  level: number
  /** Minutos que faltan para el siguiente nivel (null en el último). */
  toNext: number | null
  /** Avance dentro del nivel, de 0 a 1 (1 en el último). */
  fraction: number
}

export function levelFor(totalMinutes: number): LevelProgress {
  const total = Math.round(totalMinutes)
  let index = 0
  for (let i = 0; i < LEVELS.length; i++) if (total >= LEVELS[i].minMinutes) index = i
  const current = LEVELS[index]
  const next = LEVELS[index + 1]
  if (!next) return { level: current.level, toNext: null, fraction: 1 }
  return {
    level: current.level,
    toNext: next.minMinutes - total,
    fraction: (total - current.minMinutes) / (next.minMinutes - current.minMinutes),
  }
}

export interface Challenge {
  id: string
  kind: ChallengeKind
  target: number
}

/** Los retos de la semana de `now`: siempre los mismos para esa semana. */
export function weeklyChallenges(now: Date): Challenge[] {
  const n = CHALLENGES.length
  const start = ((weekNumber(now) % n) + n) % n
  return Array.from({ length: Math.min(CHALLENGES_PER_WEEK, n) }, (_, i) => CHALLENGES[(start + i) % n])
}

/** ¿La llegada es al primer lugar nuevo (sin llegadas anteriores a ese destino)? */
function isNewPlace(arrival: Arrival, all: Arrival[]): boolean {
  return !all.some((a) => a.destinationId === arrival.destinationId && Date.parse(a.date) < Date.parse(arrival.date))
}

export interface ChallengeProgress {
  challenge: Challenge
  value: number
  done: boolean
}

export function challengeProgress(challenge: Challenge, profile: ProfileData, now: Date): ChallengeProgress {
  const week = profile.arrivals.filter((a) => inWeek(a.date, now))
  const value = (() => {
    switch (challenge.kind) {
      case 'evitar':
        return Math.round(sum(week))
      case 'temprano':
        return week.filter(isEarly).length
      case 'tarde':
        return week.filter(isLate).length
      case 'planear':
        return profile.planned.filter((d) => inWeek(d, now)).length
      case 'lugar_nuevo':
        return week.filter((a) => isNewPlace(a, profile.arrivals)).length
    }
  })()
  return { challenge, value: Math.min(value, challenge.target), done: value >= challenge.target }
}

export function earnedAchievements(profile: ProfileData): Set<AchievementId> {
  const counts: Record<AchievementId, number> = {
    primera_ruta: profile.arrivals.length,
    planificador: profile.planned.length,
    ayudaste: profile.answered.length,
    madrugador: profile.arrivals.filter(isEarly).length,
    tarde_fresca: profile.arrivals.filter(isLate).length,
    hora_evitada: Math.round(avoidedTotal(profile)),
  }
  return new Set(ACHIEVEMENTS.filter((a) => counts[a.id] >= a.target).map((a) => a.id))
}

/**
 * El reto que avanzó con una llegada (pantalla 22): el primero de la semana cuyo valor sube al contar esa
 * llegada. undefined si ninguno avanzó.
 */
export function advancedChallenge(profile: ProfileData, arrivalId: string, now: Date): ChallengeProgress | undefined {
  const without: ProfileData = { ...profile, arrivals: profile.arrivals.filter((a) => a.id !== arrivalId) }
  for (const challenge of weeklyChallenges(now)) {
    const after = challengeProgress(challenge, profile, now)
    if (after.value > challengeProgress(challenge, without, now).value) return after
  }
  return undefined
}
