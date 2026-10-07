import { useMemo } from 'react'
import { Encabezado, Icono } from '../../componentes'
import { formatDistance } from '../../i18n/numeros'
import { useT } from '../../i18n/useT'
import { insideArea, metersBetween } from '../../mapa/datos'
import { MapaRutas, type MapPlace } from '../../mapa/MapaRutas'
import type { LonLat } from '../../rutas/geometria'
import { useVolver } from '../useVolver'
import { NotaEstimado } from '../rutas/NotaEstimado'
import { useContextoRutas } from '../rutas/useContextoRutas'
import s from './Refugios.module.css'
import { refugeIcon, textoSombraLugar } from './textos'
import { refugePoint, useSombraLugares } from './useSombraLugares'

// Pantalla 10 (nodo 6:21): puntos de permanencia. Mapa de refugios y una lista con nombre, descripción,
// "sombra hasta" calculada a la hora elegida y distancia desde el punto de partida (o desde la plaza).

export function Refugios() {
  const i18n = useT()
  const { t, language } = i18n
  const volver = useVolver()
  const ctx = useContextoRutas()
  const { data, graph, resultado, origen } = ctx

  const from: LonLat | null = origen?.point ?? data?.meta.area.centro ?? null
  const lugar = origen ? (origen.kind === 'gps' ? t('origen.tuUbicacion') : t('origen.puntoElegido')) : t('refugios.plaza')

  const filas = useMemo(() => {
    if (!data || !from) return []
    return data.refugios
      .map((refuge) => {
        const point = refugePoint(refuge)
        return {
          refuge,
          point,
          inside: !!point && insideArea(data.meta, point),
          meters: point ? metersBetween(from, point) : Infinity,
        }
      })
      .sort((a, b) => Number(b.inside) - Number(a.inside) || a.meters - b.meters)
  }, [data, from])

  const insideRefuges = useMemo(() => filas.filter((f) => f.inside).map((f) => f.refuge), [filas])
  const sombras = useSombraLugares(insideRefuges, graph, resultado)
  const places = useMemo(
    (): MapPlace[] =>
      filas
        .filter((f) => f.inside && f.point)
        .map((f) => ({
          id: f.refuge.id,
          point: f.point!,
          kind: f.refuge.agua_potable === 'si' ? 'agua' : 'refugio',
          label: f.refuge.nombre,
        })),
    [filas],
  )

  return (
    <main className={s.pantalla}>
      <Encabezado title={t('pantallas.p10')} onBack={volver} />
      <div className={s.mapa}>
        {data && <MapaRutas data={data} places={places} origin={origen?.point ?? null} label={t('refugios.mapa')} />}
      </div>
      <div className={s.contenido}>
        <NotaEstimado time={ctx.hora.time} provisional={!!data?.meta.datos_provisionales} />
        <p className={`${s.secundario} um-etiqueta`}>{t('refugios.distancias', { lugar })}</p>
        {data && filas.length === 0 && <p className="um-cuerpo">{t('refugios.sinDatos')}</p>}
        <ul className={s.lista}>
          {filas.map(({ refuge, inside, meters }) => {
            const distancia = Number.isFinite(meters) ? formatDistance(meters, language) : ''
            const detalle = inside
              ? [textoSombraLugar(i18n, sombras?.get(refuge.id)), distancia && t('refugios.aDistancia', { distancia })]
              : [distancia ? t('refugios.fuera', { distancia }) : t('buscar.sinUbicacion')]
            const extras = [refuge.asientos === 'si' && t('refugios.asientos'), refuge.agua_potable === 'si' && t('refugios.agua')]
            return (
              <li key={refuge.id} className={s.fila}>
                <span className={`${s.icono} ${inside ? '' : s.iconoFuera}`} aria-hidden="true">
                  <Icono name={refugeIcon(refuge)} />
                </span>
                <span className={s.textos}>
                  <span className="um-cuerpo-fuerte">{refuge.nombre}</span>
                  <span className="um-etiqueta">{language === 'es' ? refuge.descripcion.es : refuge.descripcion.en}</span>
                  <span className={`${s.secundario} um-etiqueta`}>{detalle.filter(Boolean).join(' · ')}</span>
                  {extras.some(Boolean) && (
                    <span className={`${s.secundario} um-micro`}>{extras.filter(Boolean).join(' · ')}</span>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </main>
  )
}
