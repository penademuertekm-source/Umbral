import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { BarraInferior, Boton, Encabezado, Icono } from '../../componentes'
import niveles from '../../estilos/niveles.module.css'
import { laHora } from '../../i18n/hora'
import { formatDistance, roundMinutes } from '../../i18n/numeros'
import { useT } from '../../i18n/useT'
import { usePerfil } from '../../perfil/usePerfil'
import type { Destination } from '../../mapa/datos'
import { destinationIcon } from '../perfil/lugares'
import p from '../perfil/Perfil.module.css'
import { useVolver } from '../useVolver'
import { NotaEstimado } from './NotaEstimado'
import s from './Rutas.module.css'
import { useEnlace } from './enlaces'
import { filaDestino, type FilaDestino } from './filaDestino'
import { useContextoRutas } from './useContextoRutas'

// Pantalla 05 (nodo 4:2): "¿A dónde vas?". Filtra los destinos locales (sin buscador externo) y muestra
// para cada uno la distancia, los minutos por la ruta con sombra y la píldora "Sombra NN %" con el color de
// su nivel a la hora elegida. Debajo del punto de partida, "Tus lugares" (S1, Figma 144:2565): un toque abre
// la ruta; si no hay lugares guardados, la sección no aparece.

const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export function BuscarDestino() {
  const i18n = useT()
  const { t, language } = i18n
  const volver = useVolver()
  const enlace = useEnlace()
  const [query, setQuery] = useState('')
  const ctx = useContextoRutas()
  const { places } = usePerfil()
  const { data, graph, resultado, origen, profile, context } = ctx
  const thermal = ctx.thermalAt(ctx.hora.time)

  const filas = useMemo(() => {
    if (!data) return []
    const fraction = resultado?.fraction ?? null
    const input = { data, graph, fraction, origin: origen?.point ?? null, profile, context, thermal }
    return data.destinos.map((destino): { destino: Destination; fila: FilaDestino } => ({
      destino,
      fila: filaDestino(destino, input),
    }))
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

        {places.length > 0 && (
          <section aria-labelledby="tus-lugares">
            <h2 id="tus-lugares" className={`${s.subtitulo} um-etiqueta`}>
              {t('buscar.tusLugares')}
            </h2>
            <ul className={p.chipsDesplazables}>
              {places.map((place) => (
                <li key={place.id}>
                  <Link className={p.chipToque} to={enlace('/rutas', { destino: place.destinationId })}>
                    <span className={`${p.chip} um-etiqueta`}>
                      <Icono name={destinationIcon(data?.destinos.find((d) => d.id === place.destinationId))} size={20} />
                      {place.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
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
      <BarraInferior active="ir" />
    </>
  )
}
