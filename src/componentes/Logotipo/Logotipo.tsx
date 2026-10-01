import isotipoNegativo from '../../../design/marca/isotipo-negativo.svg'
import isotipoPositivo from '../../../design/marca/isotipo-positivo.svg'
import isotipoUnaTinta from '../../../design/marca/isotipo-una-tinta.svg'
import { useT } from '../../i18n/useT'
import s from './Logotipo.module.css'

export type LogoVariant = 'positivo' | 'negativo' | 'una-tinta'

const ISOTIPOS: Record<LogoVariant, string> = {
  positivo: isotipoPositivo,
  negativo: isotipoNegativo,
  'una-tinta': isotipoUnaTinta,
}

interface LogotipoProps {
  variant?: LogoVariant
  /** Alto del isotipo en px. */
  size?: number
  /** Muestra la palabra "umbral" (Archivo Black, siempre en minúscula). */
  withWord?: boolean
}

export function Logotipo({ variant = 'positivo', size = 40, withWord = true }: LogotipoProps) {
  const { t } = useT()
  return (
    <span className={s.logotipo} style={{ fontSize: size * 0.7 }}>
      <img src={ISOTIPOS[variant]} width={size} height={size} alt={withWord ? '' : t('app.nombre')} />
      {withWord && <span className={s.palabra}>{t('app.nombre')}</span>}
    </span>
  )
}
