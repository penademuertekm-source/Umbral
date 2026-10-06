import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import isotipoNegativo from '../../../design/marca/isotipo-negativo.svg'
import { Boton } from '../../componentes'
import { readStoredLanguage } from '../../i18n/idioma'
import { useT } from '../../i18n/useT'
import { loadMapData } from '../../mapa/datos'
import { motorSombra } from '../../sombra/cliente'
import s from './Entrada.module.css'
import { nextAfterSplash, onboardingDone } from './entrada'

// Pantalla 01 (nodo 2:2): inicio. Se ve mientras cargan los datos del centro y el motor de sombra; si ya
// están en caché, dura menos de 1 s. Después: primer uso → 02 → 03; usos siguientes → mapa.

/** Tiempo mínimo en pantalla, para que no sea un parpadeo (ms). */
const MIN_SPLASH_MS = 500

export function Inicio() {
  const { t } = useT()
  const navigate = useNavigate()
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let vigente = true
    const started = performance.now()
    // El mapa (MapLibre) se descarga en paralelo para que la pantalla 04 abra rápido.
    void import('../mapa/MapaPrincipal').catch(() => undefined)
    Promise.all([loadMapData(), motorSombra.lados()])
      .then(() => {
        const wait = Math.max(0, MIN_SPLASH_MS - (performance.now() - started))
        window.setTimeout(() => {
          if (vigente) navigate(nextAfterSplash(readStoredLanguage() !== null, onboardingDone()), { replace: true })
        }, wait)
      })
      .catch(() => {
        if (vigente) setError(true)
      })
    return () => {
      vigente = false
    }
  }, [attempt, navigate])

  return (
    <main className={s.inicio}>
      <img className={s.isotipoGrande} src={isotipoNegativo} width={96} height={96} alt="" />
      <h1 className={s.palabra}>{t('app.nombre')}</h1>
      <p className={`${s.claro} um-cuerpo`}>{t('app.lema')}</p>
      <div className={s.cargando} role="status">
        {error ? (
          <>
            <p className="um-cuerpo">{t('inicio.error')}</p>
            <Boton
              variant="secundario"
              onClick={() => {
                setError(false)
                setAttempt((n) => n + 1)
              }}
            >
              {t('inicio.reintentar')}
            </Boton>
          </>
        ) : (
          <p className={`${s.claro} um-etiqueta`}>{t('inicio.cargando')}</p>
        )}
      </div>
    </main>
  )
}
