import { HEAT_WARNING_HOURS } from '../../config/recorrido'
import { useT } from '../../i18n/useT'
import { formatTime, localDate } from '../../sombra/tiempo'

/** "11:00 a. m." y "3:00 p. m.": la franja del aviso (cualquier día sirve para escribir la hora). */
export function useHorasAviso() {
  const { language } = useT()
  return {
    desde: formatTime(localDate(2026, 1, 1, HEAT_WARNING_HOURS.from), language),
    hasta: formatTime(localDate(2026, 1, 1, HEAT_WARNING_HOURS.to), language),
  }
}
