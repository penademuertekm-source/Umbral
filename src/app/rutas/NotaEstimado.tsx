import { laHora } from '../../i18n/hora'
import { useT } from '../../i18n/useT'
import s from './Rutas.module.css'

/** Honestidad del dato en las pantallas de rutas: "Valores estimados para las 7:00 a. m. · Datos provisionales". */
export function NotaEstimado({ time, provisional }: { time?: Date; provisional: boolean }) {
  const i18n = useT()
  const { t } = i18n
  const parts = [time ? t('ficha.estimadoA', { laHora: laHora(i18n, time) }) : t('cuando.estimadosHoy')]
  if (provisional) parts.push(t('app.datosProvisionales'))
  return <p className={`${s.secundario} um-micro`}>{parts.join(' · ')}</p>
}
