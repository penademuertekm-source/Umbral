import { useNavigate } from 'react-router'
import { Boton, Encabezado } from '../../componentes'
import { SUN_PROTECTION } from '../../config/recorrido'
import { useT } from '../../i18n/useT'
import { useVolver } from '../useVolver'
import { TextoAvisoCalor } from './AvisoCalor'
import s from './Avisos.module.css'
import { useHorasAviso } from './horasAviso'
import { ContenidoProteccion } from './ProteccionSolar'

// Las pantallas 19 y 18 como páginas (por ejemplo, desde /guia). En la app salen sobre la comparación de
// rutas (06) al iniciar un recorrido; aquí usan valores de muestra y lo dicen.
const EJEMPLO = { shadePercent: 62, sunMinutes: 6, uv: 11 }

/** Ruta /aviso-calor: pantalla 19. */
export function PantallaAvisoCalor() {
  const { t } = useT()
  const navigate = useNavigate()
  const volver = useVolver()
  const horas = useHorasAviso()
  return (
    <>
      <Encabezado title={t('pantallas.p19')} onBack={volver} />
      <main className={s.pagina}>
        <p className={`${s.ejemplo} um-etiqueta`}>{t('avisoCalor.ejemplo', horas)}</p>
        <h2 className="um-subtitulo">{t('avisoCalor.titulo')}</h2>
        <TextoAvisoCalor shadePercent={EJEMPLO.shadePercent} sunMinutes={EJEMPLO.sunMinutes} />
        <div className={s.acciones}>
          <Boton onClick={() => navigate('/buscar')}>{t('avisoCalor.mejorHora')}</Boton>
          <Boton variant="secundario" onClick={() => navigate('/buscar')}>
            {t('avisoCalor.iniciar')}
          </Boton>
        </div>
      </main>
    </>
  )
}

/** Ruta /proteccion-solar: pantalla 18. */
export function PantallaProteccionSolar() {
  const { t } = useT()
  const navigate = useNavigate()
  const volver = useVolver()
  return (
    <>
      <Encabezado title={t('pantallas.p18')} onBack={volver} />
      <main className={s.pagina}>
        <p className={`${s.ejemplo} um-etiqueta`}>
          {t('proteccion.ejemplo', { min: SUN_PROTECTION.minSunMinutes, uv: SUN_PROTECTION.minUv })}
        </p>
        <h2 className="um-subtitulo">{t('proteccion.titulo')}</h2>
        <ContenidoProteccion uv={EJEMPLO.uv} sunMinutes={EJEMPLO.sunMinutes} />
        <Boton onClick={() => navigate('/buscar')}>{t('proteccion.iniciar')}</Boton>
      </main>
    </>
  )
}
