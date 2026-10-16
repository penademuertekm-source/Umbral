import type { IconName } from '../../../componentes'
import { EARLY_BEFORE_HOUR, LATE_FROM_HOUR, type AchievementId, type ChallengeKind } from '../../../config/logros'
import type { I18nValue } from '../../../i18n/contexto'
import type { Challenge } from '../../../perfil/logros'
import { formatTime, localDate } from '../../../sombra/tiempo'

// Textos e íconos de los retos y logros (S3). Figma usa un sol y un calendario que no están en
// design/iconos/: se usan los más cercanos (Al sol, Reloj, Destino). Ver "Notas de Claude Code".

export const CHALLENGE_ICON: Record<ChallengeKind, IconName> = {
  evitar: 'expuesto',
  temprano: 'reloj',
  tarde: 'nublado',
  planear: 'destino',
  lugar_nuevo: 'lugar',
}

export const ACHIEVEMENT_ICON: Record<AchievementId, IconName> = {
  primera_ruta: 'caminar',
  planificador: 'destino',
  ayudaste: 'informacion',
  madrugador: 'reloj',
  tarde_fresca: 'nublado',
  hora_evitada: 'expuesto',
}

/** "Evita 15 min de sol", "Sal una vez antes de las 8:00 a. m."… */
export function challengeText({ t, language }: Pick<I18nValue, 't' | 'language'>, challenge: Challenge): string {
  const hora = (hour: number) => formatTime(localDate(2026, 1, 1, hour), language)
  switch (challenge.kind) {
    case 'evitar':
      return t('logros.retos.evitar', { n: challenge.target })
    case 'temprano':
      return t('logros.retos.temprano', { hora: hora(EARLY_BEFORE_HOUR) })
    case 'tarde':
      return t('logros.retos.tarde', { hora: hora(LATE_FROM_HOUR) })
    case 'planear':
      return t('logros.retos.planear')
    case 'lugar_nuevo':
      return t('logros.retos.lugar_nuevo')
  }
}
