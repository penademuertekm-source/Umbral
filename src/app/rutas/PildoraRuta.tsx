import { FormaSemaforo } from '../../componentes'
import type { HeatLevel } from '../../config/reglas-semaforo'
import niveles from '../../estilos/niveles.module.css'
import { useT } from '../../i18n/useT'
import s from './PildoraRuta.module.css'

/**
 * Pastilla de una ruta en las listas (05 y Mis lugares): la forma y el color del nivel del semáforo más el %
 * de sombra ("● 76 %"). El lector de pantalla oye el nivel y el % completo. Sin clima, el nivel es Nublado.
 */
export function PildoraRuta({ level, percent }: { level: HeatLevel | null; percent: number }) {
  const { t } = useT()
  const shown = level ?? 'nublado'
  const p = Math.round(percent)
  return (
    <span className={`${s.pildora} ${niveles[shown]} um-etiqueta`}>
      <FormaSemaforo level={shown} />
      <span aria-hidden="true">{t('lugares.pildora', { p })}</span>
      <span className="sr-only">{`${t(`semaforo.${shown}`)}: ${t('lugares.pildoraLarga', { p })}`}</span>
    </span>
  )
}
