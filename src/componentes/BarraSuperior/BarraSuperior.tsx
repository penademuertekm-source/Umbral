import type { ThermalLevel } from '../../config/niveles'
import { useT } from '../../i18n/useT'
import { Semaforo } from '../Semaforo/Semaforo'
import s from './BarraSuperior.module.css'

interface BarraSuperiorProps {
  /** Hora ya formateada, p. ej. "11:47 a. m.". */
  time: string
  level: ThermalLevel
  /** Texto alternativo del chip (p. ej. "Nublado · riesgo bajo"). */
  levelLabel?: string
  /** UTCI estimado en °C; `null` muestra "—" (sin dato). */
  utciSun?: number | null
  utciShade?: number | null
}

/** Barra superior de 112 px: hora, semáforo y línea de UTCI estimado. */
export function BarraSuperior({ time, level, levelLabel, utciSun = null, utciShade = null }: BarraSuperiorProps) {
  const { t } = useT()
  const degrees = (value: number | null) =>
    value === null ? t('comun.sinDato') : t('comun.grados', { valor: Math.round(value) })
  return (
    <header className={s.barra}>
      <div className={s.fila}>
        <time className={`${s.hora} um-dato`}>{time}</time>
        <Semaforo level={level} label={levelLabel} />
      </div>
      <p className={`${s.utci} um-micro`}>
        {t('barra.utci', { sol: degrees(utciSun), sombra: degrees(utciShade) })}
      </p>
    </header>
  )
}
