import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Boton, Encabezado, Icono, type IconName } from '../componentes'
import type { TranslationKey } from '../i18n/traducir'
import { useT } from '../i18n/useT'
import { loadMapData } from '../mapa/datos'
import { formatIsoDate } from '../sombra/tiempo'
import s from './SinConexion.module.css'
import { useVolver } from './useVolver'

// Pantalla 14 (nodo 13:77): qué sigue funcionando sin conexión y qué no, con la fecha del modelo descargado.
// Las placas QR no se mencionan mientras estén en pausa (Fase 8).

const FUNCIONA: TranslationKey[] = ['sinConexion.mapa', 'sinConexion.deslizador', 'sinConexion.rutas', 'sinConexion.recorrido']
const NO_FUNCIONA: TranslationKey[] = ['sinConexion.clima', 'sinConexion.buscar', 'sinConexion.elNino']

export function SinConexion() {
  const { t, language } = useT()
  const navigate = useNavigate()
  const volver = useVolver()
  const [generado, setGenerado] = useState('')
  useEffect(() => {
    let vigente = true
    loadMapData()
      .then((data) => vigente && setGenerado(data.meta.generado.slice(0, 10)))
      .catch(() => undefined)
    return () => {
      vigente = false
    }
  }, [])
  const fecha = generado ? formatIsoDate(generado, language) : ''

  return (
    <div className={s.pantalla}>
      <Encabezado title={t('pantallas.p14')} onBack={volver} />
      <main className={s.contenido}>
        <span className={s.icono} aria-hidden="true">
          <Icono name="sin-conexion" size={40} />
        </span>
        <p className={`${s.secundario} um-cuerpo`}>{t('sinConexion.texto')}</p>
        <Lista titulo={t('sinConexion.funciona')} icon="llegada" items={FUNCIONA} tono="si" />
        <Lista titulo={t('sinConexion.noFunciona')} icon="cerrar" items={NO_FUNCIONA} tono="no" />
        {fecha && <p className={`${s.secundario} um-etiqueta`}>{t('sinConexion.modelo', { fecha })}</p>}
        <Boton onClick={() => navigate('/mapa')}>{t('sinConexion.volverMapa')}</Boton>
      </main>
    </div>
  )
}

function Lista({ titulo, icon, items, tono }: { titulo: string; icon: IconName; items: TranslationKey[]; tono: 'si' | 'no' }) {
  const { t } = useT()
  return (
    <section className={s.tarjeta}>
      <h2 className="um-cuerpo-fuerte">{titulo}</h2>
      <ul className={s.lista}>
        {items.map((key) => (
          <li key={key} className={`${s.item} um-etiqueta`}>
            <span className={`${s.marca} ${tono === 'si' ? s.si : s.no}`} aria-hidden="true">
              <Icono name={icon} size={20} />
            </span>
            {t(key)}
          </li>
        ))}
      </ul>
    </section>
  )
}
