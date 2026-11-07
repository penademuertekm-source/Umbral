import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { BarraInferior, Boton, ChipEstimado, Encabezado, Icono } from '../../componentes'
import { horaConDia, laHora } from '../../i18n/hora'
import { formatDistance, roundMinutes } from '../../i18n/numeros'
import { useT } from '../../i18n/useT'
import { usePerfil } from '../../perfil/usePerfil'
import type { Destination } from '../../mapa/datos'
import { destinationIcon } from '../perfil/lugares'
import p from '../perfil/Perfil.module.css'
import s from './Rutas.module.css'
import { useEnlace } from './enlaces'
import { filaDestino, type FilaDestino } from './filaDestino'
import { PildoraRuta } from './PildoraRuta'
import { useContextoRutas } from './useContextoRutas'

// Pantalla 05 (rediseño 2026, Figma 116:534): "¿A dónde vas?". Se abre desde la pestaña "Ir a" o desde el
// buscador del mapa. Filtra los destinos locales (sin buscador externo). "En el centro": cada destino con su
// ruta con más sombra a la hora elegida (las mismas cifras de la 06, G3) y una pastilla con la forma y el
// color del nivel más el % de sombra. "Fuera del mapa de sombra" (05-1): la distancia y "Cómo llegar ›",
// que abre la pantalla 21 con ese destino. "Tus lugares" (S1) sigue debajo del punto de partida.

const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export function BuscarDestino() {
  const i18n = useT()
  const { t, language } = i18n
  const enlace = useEnlace()
  const [query, setQuery] = useState('')
  const ctx = useContextoRutas()
  const { places } = usePerfil()
  const { data, graph, resultado, origen, profile, context } = ctx
  const thermal = ctx.thermalAt(ctx.hora.time)

  const filas = useMemo(() => {
    if (!data) return []
    const input = { data, graph, shade: resultado ?? null, origin: origen?.point ?? null, profile, context, thermal }
    return data.destinos.map((destino): { destino: Destination; fila: FilaDestino } => ({
      destino,
      fila: filaDestino(destino, input),
    }))
  }, [data, origen, graph, resultado, profile, context, thermal])

  const visibles = filas.filter(({ destino }) =>
    normalize(`${destino.nombre.es} ${destino.nombre.en}`).includes(normalize(query.trim())),
  )
  const enCentro = visibles.filter(({ fila }) => fila.kind !== 'fuera')
  const fuera = visibles.filter(({ fila }) => fila.kind === 'fuera')
  const elegir = enlace('/mapa', { elegir: '1', volver: '/buscar' })
  const nombreDe = (destino: Destination) => (language === 'es' ? destino.nombre.es : destino.nombre.en)

  return (
    <>
      {/* Es una pestaña ("Ir a"): título sin "Volver", como Perfil. */}
      <Encabezado title={t('buscar.campo')} />
      <main className={s.contenido}>
        <label className={s.buscador}>
          <Icono name="buscar" />
          <input
            className="um-cuerpo"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('buscar.placeholder')}
            aria-label={t('buscar.placeholder')}
          />
        </label>

        {origen ? (
          <p className={`${s.origen} um-cuerpo`}>
            <Icono name="mi-ubicacion" size={20} />
            <span className={s.origenTexto}>
              {t('origen.desde', { lugar: origen.kind === 'gps' ? t('origen.tuUbicacion') : t('origen.puntoElegido') })}
            </span>
            <Link to={elegir} className="um-cuerpo-fuerte">
              {t('origen.cambiar')}
            </Link>
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

        {data && <ChipEstimado time={horaConDia(i18n, ctx.hora.time)} provisional={data.meta.datos_provisionales} />}

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

        {visibles.length === 0 && data && <p className="um-cuerpo">{t('buscar.sinResultados')}</p>}

        {enCentro.length > 0 && (
          <section aria-labelledby="en-el-centro">
            <h2 id="en-el-centro" className={`${s.subtitulo} um-etiqueta`}>
              {t(ctx.hora.tomorrow ? 'buscar.enCentroManana' : 'buscar.enCentro', { laHora: laHora(i18n, ctx.hora.time) })}
            </h2>
            <ul className={`${p.tarjeta} ${s.lista}`}>
              {enCentro.map(({ destino, fila }) => {
                const detalle =
                  fila.kind === 'ruta'
                    ? t('lugares.detalle', { distancia: formatDistance(fila.route.meters, language), min: roundMinutes(fila.route.minutes) })
                    : fila.kind === 'sin_ubicacion'
                      ? t('buscar.sinUbicacion')
                      : fila.kind === 'sin_origen'
                        ? t('buscar.sinOrigen')
                        : fila.kind === 'sin_ruta'
                          ? t('rutas.sinRuta')
                          : t('buscar.calculando')
                const contenido = (
                  <>
                    <span className={p.icono} aria-hidden="true">
                      <Icono name={destinationIcon(destino)} />
                    </span>
                    <span className={p.textos}>
                      <span className="um-cuerpo-fuerte">{nombreDe(destino)}</span>
                      <span className={`${s.secundario} um-etiqueta`}>{detalle}</span>
                    </span>
                    {fila.kind === 'ruta' && <PildoraRuta level={fila.level} percent={fila.route.shadePercent} />}
                  </>
                )
                return (
                  <li key={destino.id}>
                    {fila.kind === 'ruta' ? (
                      <Link className={`${p.fila} ${s.filaAlta}`} to={enlace('/rutas', { destino: destino.id })}>
                        {contenido}
                      </Link>
                    ) : (
                      <div className={`${p.fila} ${s.filaAlta} ${s.filaInactiva}`}>{contenido}</div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {fuera.length > 0 && (
          <section aria-labelledby="fuera-del-mapa">
            <h2 id="fuera-del-mapa" className={`${s.subtitulo} um-etiqueta`}>
              {t('buscar.fueraTitulo')}
            </h2>
            <ul className={`${p.tarjeta} ${s.lista}`}>
              {fuera.map(({ destino, fila }) => (
                <li key={destino.id}>
                  {/* 05-1: toda la fila lleva a la pantalla 21 con este destino. */}
                  <Link className={`${p.fila} ${s.filaAlta}`} to={enlace('/fuera-del-centro', { destino: destino.id })}>
                    <span className={`${p.icono} ${s.iconoFuera}`} aria-hidden="true">
                      <Icono name={destinationIcon(destino)} />
                    </span>
                    <span className={p.textos}>
                      <span className="um-cuerpo-fuerte">{nombreDe(destino)}</span>
                      <span className={`${s.secundario} um-etiqueta`}>
                        {fila.kind === 'fuera' && t('buscar.sinDatosSombra', { distancia: formatDistance(fila.meters, language) })}
                      </span>
                    </span>
                    <span className={`${s.comoLlegar} um-cuerpo-fuerte`}>
                      {t('buscar.comoLlegar')}
                      <Icono name="avanzar" size={20} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <BarraInferior active="ir" />
    </>
  )
}
