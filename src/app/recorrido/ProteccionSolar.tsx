import { Boton, HojaInferior, Icono, type IconName } from '../../componentes'
import { uvCategory } from '../../config/uv'
import niveles from '../../estilos/niveles.module.css'
import { roundMinutes } from '../../i18n/numeros'
import { useT } from '../../i18n/useT'
import type { TranslationKey } from '../../i18n/traducir'
import s from './Avisos.module.css'

// Pantalla 18 (nodo 34:35): protección solar antes de un recorrido con varios minutos al sol y UV alto.

const CONSEJOS: { icon: IconName; key: TranslationKey }[] = [
  { icon: 'protector-solar', key: 'proteccion.protector' },
  { icon: 'agua', key: 'proteccion.agua' },
  { icon: 'gorra', key: 'proteccion.gorra' },
]

interface ContenidoProps {
  uv: number
  sunMinutes: number
}

/** Chip de UV, minutos al sol, recomendaciones y nota de salud. */
export function ContenidoProteccion({ uv, sunMinutes }: ContenidoProps) {
  const { t } = useT()
  const category = uvCategory(uv)
  return (
    <>
      <span className={`${s.chip} ${niveles[category === 'extremo' || category === 'muy_alto' ? 'evitar' : 'precaucion']} um-etiqueta`}>
        <Icono name="indice-uv" size={20} />
        {`${t('uv.valor', { n: Math.round(uv) })} · ${t(`uv.categorias.${category}`)}`}
      </span>
      <p className="um-cuerpo">{t('proteccion.texto', { n: roundMinutes(sunMinutes) })}</p>
      <ul className={s.lista}>
        {CONSEJOS.map(({ icon, key }) => (
          <li key={key} className={`${s.item} um-cuerpo`}>
            <span className={`${s.icono} ${niveles.precaucion}`} aria-hidden="true">
              <Icono name={icon} />
            </span>
            {t(key)}
          </li>
        ))}
      </ul>
      <p className={`${s.secundario} um-micro`}>{t('proteccion.nota')}</p>
    </>
  )
}

interface ProteccionSolarProps extends ContenidoProps {
  open: boolean
  onClose: () => void
  onStart: () => void
}

/** La pantalla 18 como hoja inferior sobre la comparación de rutas (06). */
export function ProteccionSolar({ open, onClose, onStart, ...contenido }: ProteccionSolarProps) {
  const { t } = useT()
  return (
    <HojaInferior open={open} onClose={onClose} title={t('proteccion.titulo')}>
      <ContenidoProteccion {...contenido} />
      <Boton onClick={onStart}>{t('proteccion.iniciar')}</Boton>
    </HojaInferior>
  )
}
