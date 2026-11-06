import { laHoraConDia } from '../../i18n/hora'
import { useT } from '../../i18n/useT'
import s from './Rutas.module.css'

/** Honestidad del dato en las pantallas de rutas: "Valores estimados para las 7:00 a. m. · Datos provisionales". */
export function NotaEstimado({ time, provisional, tomorrow = false }: { time?: Date; provisional: boolean; tomorrow?: boolean }) {
  const i18n = useT()
  const { t } = i18n
  // N3: con "Mañana" elegido lo dice ("mañana a las 4:00 p. m.", "Valores estimados para mañana").
  const parts = [
    time ? t('ficha.estimadoA', { laHora: laHoraConDia(i18n, time) }) : t(tomorrow ? 'cuando.estimadosManana' : 'cuando.estimadosHoy'),
  ]
  if (provisional) parts.push(t('app.datosProvisionales'))
  return <p className={`${s.secundario} um-micro`}>{parts.join(' · ')}</p>
}
