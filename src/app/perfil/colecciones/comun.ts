import type { IconName } from '../../../componentes'
import { PASSPORT_EXTRA_REFUGES, type CardId } from '../../../config/logros'
import type { TranslationKey } from '../../../i18n/traducir'
import type { MapData } from '../../../mapa/datos'
import { TIME_ZONE } from '../../../sombra/tiempo'
import { destinationIcon } from '../lugares'

// Lo que comparten Pasaporte, Álbum, Logros y la llegada (S3).

export interface StampPlace {
  id: string
  name: string
  icon: IconName
}

/** Los lugares del Pasaporte: los destinos de destinos.csv y los refugios de PASSPORT_EXTRA_REFUGES. */
export function passportPlaces(data: MapData | null, language: string): StampPlace[] {
  if (!data) return []
  const destinos = data.destinos.map((d) => ({
    id: d.id,
    name: language === 'es' ? d.nombre.es : d.nombre.en,
    icon: destinationIcon(d),
  }))
  const refugios = data.refugios
    .filter((r) => (PASSPORT_EXTRA_REFUGES as readonly string[]).includes(r.id))
    .map((r) => ({ id: r.id, name: r.nombre, icon: 'banca' as IconName }))
  return [...destinos, ...refugios]
}

/** "¿Sabías que…?" por lugar. Solo el de la Plaza está escrito; los demás los aporta la autora. */
export const STAMP_FACTS: Readonly<Record<string, TranslationKey>> = {
  'plaza-alfonso-lopez': 'pasaporte.datos.plaza',
}

export const CARD_ICON: Record<CardId, IconName> = {
  mango: 'mango',
  canaguate: 'canaguate-en-flor',
  alero: 'alero',
  otros: 'mango',
  muro: 'iglesia',
}

/** "16 de octubre" (hora de Valledupar). */
export function dayMonth(iso: string, language: string): string {
  return new Intl.DateTimeFormat(language === 'es' ? 'es-CO' : 'en-US', {
    day: 'numeric',
    month: 'long',
    timeZone: TIME_ZONE,
  }).format(new Date(iso))
}
