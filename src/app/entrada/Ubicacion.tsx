import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Boton } from '../../componentes'
import { useT } from '../../i18n/useT'
import { insideArea, loadMapData } from '../../mapa/datos'
import type { LonLat } from '../../rutas/geometria'
import s from './Entrada.module.css'
import { markOnboardingDone } from './entrada'

// Pantalla 03 (nodo 2:19): para qué se usa la ubicación, antes de pedir el permiso. Si la persona no lo da
// (o el navegador no puede), la app sigue sin ubicación. La posición no se guarda ni se envía.

export function Ubicacion() {
  const { t } = useT()
  const navigate = useNavigate()
  const [searching, setSearching] = useState(false)

  const withoutLocation = () => {
    markOnboardingDone()
    navigate('/mapa', { replace: true })
  }

  const allow = () => {
    if (!('geolocation' in navigator)) return withoutLocation()
    setSearching(true)
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const point: LonLat = [p.coords.longitude, p.coords.latitude]
        const data = await loadMapData().catch(() => null)
        markOnboardingDone()
        if (data && !insideArea(data.meta, point)) navigate('/fuera-del-centro', { replace: true, state: { point } })
        else navigate('/mapa', { replace: true })
      },
      withoutLocation,
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    )
  }

  return (
    <main className={`${s.pagina} ${s.centrada}`}>
      <span className={s.ilustracion} aria-hidden="true" />
      <h1 className="um-titulo">{t('permiso.titulo')}</h1>
      <p className={`${s.secundario} um-cuerpo`}>{t('permiso.texto')}</p>
      <div className={s.botones}>
        <Boton onClick={allow} disabled={searching}>
          {t('permiso.permitir')}
        </Boton>
        <Boton variant="secundario" onClick={withoutLocation}>
          {t('permiso.sinUbicacion')}
        </Boton>
      </div>
      {searching && (
        <p className={`${s.secundario} um-etiqueta`} role="status">
          {t('permiso.buscando')}
        </p>
      )}
    </main>
  )
}
