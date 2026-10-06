import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Boton, Encabezado } from '../../componentes'
import type { HeatLevel } from '../../config/reglas-semaforo'
import niveles from '../../estilos/niveles.module.css'
import { laHora } from '../../i18n/hora'
import { formatDistance, roundMinutes } from '../../i18n/numeros'
import { useT } from '../../i18n/useT'
import { insideArea, metersBetween, type Destination } from '../../mapa/datos'
import type { Route } from '../../rutas/rutas'
import { useVolver } from '../useVolver'
import { NotaEstimado } from './NotaEstimado'
import s from './Rutas.module.css'
import { useEnlace } from './enlaces'
import { levelOfRoute, routeBetween, useContextoRutas } from './useContextoRutas'

// Pantalla 05 (nodo 4:2): "¿A dónde vas?". Filtra los destinos locales (sin buscador externo) y muestra
// para cada uno la distancia, los minutos por la ruta con sombra y la píldora "Sombra NN %" con el color de
// su nivel a la hora elegida.

type Fila =
  | { kind: 'sin_ubicacion' }
  | { kind: 'fuera'; meters: number }
  | { kind: 'sin_origen' }
  | { kind: 'calculando' }
  | { kind: 'sin_ruta' }
  | { kind: 'ruta'; route: Route; level: HeatLevel | null }

const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export function BuscarDestino() {
  const i18n = useT()
  const { t, language } = i18n
  const volver = useVolver()
  const enlace = useEnlace()
  const [query, setQuery] = useState('')
  const ctx = useContextoRutas()
  const { data, graph, resultado, origen, profile, context } = ctx
  const thermal = ctx.thermalAt(ctx.hora.time)

  const filas = useMemo(() => {
    if (!data) return []
    return data.destinos.map((destino): { destino: Destination; fila: Fila } => {
      if (destino.lat === null || destino.lon === null) return { destino, fila: { kind: 'sin_ubicacion' } }
      const point: [number, number] = [destino.lon, destino.lat]
      if (!insideArea(data.meta, point)) {
        return { destino, fila: { kind: 'fuera', meters: metersBetween(data.meta.area.centro, point) } }
      }
      if (!origen) return { destino, fila: { kind: 'sin_origen' } }
      if (!graph || !resultado || !context) return { destino, fila: { kind: 'calculando' } }
      const route = routeBetween(graph, origen.point, point, resultado.fraction, 'sombra', profile)
      if (!route) return { destino, fila: { kind: 'sin_ruta' } }
      return { destino, fila: { kind: 'ruta', route, level: levelOfRoute(route, thermal, context) } }
    })
  }, [data, origen, graph, resultado, profile, context, thermal])

  const visibles = filas.filter(({ destino }) =>
    normalize(`${destino.nombre.es} ${destino.nombre.en}`).includes(normalize(query.trim())),
  )
  const elegir = enlace('/mapa', { elegir: '1', volver: '/buscar' })

  return (
    <>
      <Encabezado title={t('pantallas.p05')} onBack={volver} />
      <main className={s.contenido}>
        <input
          className={`${s.campo} um-cuerpo`}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('buscar.campo')}
          aria-label={t('buscar.campo')}
        />

        {origen ? (
          <p className={`${s.origen} um-etiqueta`}>
            {t('origen.desde', { lugar: origen.kind === 'gps' ? t('origen.tuUbicacion') : t('origen.puntoElegido') })}
            {' · '}
            <Link to={elegir}>{t('origen.cambiar')}</Link>
          </p>
        ) : (
          <div className={s.aviso}>
            <p className="um-cuerpo">{ctx.gpsOutside ? t('origen.fueraDelCentro') : t('origen.falta')}</p>
            <div className={s.botones}>
              {!ctx.gpsOutside && (
                <Boton variant="secundario" icon="mi-ubicacion" onClick={() => ctx.ubicacion.start()}>
                  {t('origen.usarUbicacion')}
                </Boton>
              )}
              <Link to={elegir} className={`${s.botonEnlace} um-cuerpo-fuerte`}>
                {t('origen.elegirEnMapa')}
              </Link>
            </div>
          </div>
        )}

        <p className={`${s.subtitulo} um-etiqueta`}>
          {t('buscar.frecuentes', { laHora: laHora(i18n, ctx.hora.time) })}
        </p>
        {visibles.length === 0 && data && <p className="um-cuerpo">{t('buscar.sinResultados')}</p>}
        <ul className={s.lista}>
          {visibles.map(({ destino, fila }) => {
            const nombre = language === 'es' ? destino.nombre.es : destino.nombre.en
            const detalle =
              fila.kind === 'ruta'
                ? t('buscar.detalle', {
                    distancia: formatDistance(fila.route.meters, language),
                    min: roundMinutes(fila.route.minutes),
                  })
                : fila.kind === 'fuera'
                  ? t('buscar.fueraDelMapa', { distancia: formatDistance(fila.meters, language) })
                  : fila.kind === 'sin_ubicacion'
                    ? t('buscar.sinUbicacion')
                    : fila.kind === 'sin_origen'
                      ? t('buscar.sinOrigen')
                      : fila.kind === 'sin_ruta'
                        ? t('rutas.sinRuta')
                        : t('buscar.calculando')
            const contenido = (
              <>
                <span className={s.filaTexto}>
                  <span className="um-cuerpo-fuerte">{nombre}</span>
                  <span className={`${s.secundario} um-etiqueta`}>{detalle}</span>
                </span>
                {fila.kind === 'ruta' && (
                  <span className={`${s.pildora} ${niveles[fila.level ?? 'nublado']} um-etiqueta`}>
                    {t('buscar.pildora', { p: Math.round(fila.route.shadePercent) })}
                  </span>
                )}
              </>
            )
            return (
              <li key={destino.id}>
                {fila.kind === 'ruta' || fila.kind === 'fuera' ? (
                  <Link className={s.fila} to={enlace('/rutas', { destino: destino.id })}>
                    {contenido}
                  </Link>
                ) : (
                  <div className={`${s.fila} ${s.filaInactiva}`}>{contenido}</div>
                )}
              </li>
            )
          })}
        </ul>
        <NotaEstimado time={ctx.hora.time} provisional={!!data?.meta.datos_provisionales} />
      </main>
    </>
  )
}
