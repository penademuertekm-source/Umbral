import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { BarraInferior, Boton, ChipEstimado, Encabezado, Icono } from '../../componentes'
import niveles from '../../estilos/niveles.module.css'
import { laHora } from '../../i18n/hora'
import { formatDistance, roundMinutes } from '../../i18n/numeros'
import { useT } from '../../i18n/useT'
import { usePerfil } from '../../perfil/usePerfil'
import { formatTime } from '../../sombra/tiempo'
import { useEnlace } from '../rutas/enlaces'
import { filaDestino, type FilaDestino } from '../rutas/filaDestino'
import { useContextoRutas } from '../rutas/useContextoRutas'
import { useVolver } from '../useVolver'
import { destinationIcon } from './lugares'
import s from './Perfil.module.css'

// Mis lugares (S1, Figma 143:2425; vacío 143:2666). Las cifras (distancia, minutos y % en sombra) no se
// guardan: se calculan al abrir, con la hora de ese momento y la misma cuenta de rutas que la 05 (G3).

export function MisLugares() {
  const i18n = useT()
  const { t, language } = i18n
  const volver = useVolver('/perfil')
  const enlace = useEnlace()
  const navigate = useNavigate()
  const profile = usePerfil()
  const ctx = useContextoRutas()
  const { data, graph, resultado, origen, profile: heatProfile, context } = ctx
  const thermal = ctx.thermalAt(ctx.hora.time)
  const count = profile.places.length

  const filas = useMemo(() => {
    const fraction = resultado?.fraction ?? null
    const origin = origen?.point ?? null
    return profile.places.map((place) => {
      const destino = data?.destinos.find((d) => d.id === place.destinationId)
      const fila: FilaDestino | null =
        data && destino ? filaDestino(destino, { data, graph, fraction, origin, profile: heatProfile, context, thermal }) : null
      return { place, destino, fila }
    })
  }, [profile.places, data, graph, resultado, origen, heatProfile, context, thermal])

  const subtitle =
    count === 0 ? t('lugares.ninguno') : count === 1 ? t('lugares.totalUno') : t('lugares.total', { n: count })

  return (
    <div className={s.pantalla}>
      <Encabezado title={t('lugares.titulo')} subtitle={subtitle} onBack={volver} />
      {count === 0 ? (
        <main className={`${s.contenido} ${s.vacio}`}>
          <span className={s.iconoGrande} aria-hidden="true">
            <Icono name="guardar" size={32} />
          </span>
          <p className="um-subtitulo">{t('lugares.vacioTitulo')}</p>
          <p className={`${s.secundario} um-cuerpo`}>{t('lugares.vacioTexto')}</p>
          <Boton onClick={() => navigate(enlace('/buscar'))}>{t('lugares.buscar')}</Boton>
        </main>
      ) : (
        <main className={s.contenido}>
          <div className={s.encabezadoLista}>
            {data && <ChipEstimado time={formatTime(ctx.hora.time, language)} provisional={data.meta.datos_provisionales} />}
          </div>
          <p className={`${s.secundario} um-etiqueta`}>{t('lugares.rutaA', { laHora: laHora(i18n, ctx.hora.time) })}</p>
          <ul className={s.tarjeta}>
            {filas.map(({ place, destino, fila }) => {
              const real = destino ? (language === 'es' ? destino.nombre.es : destino.nombre.en) : t('lugares.desconocido')
              return (
                <li key={place.id}>
                  <Link className={s.fila} to={enlace('/rutas', { destino: place.destinationId })}>
                    <span className={s.icono} aria-hidden="true">
                      <Icono name={destinationIcon(destino)} />
                    </span>
                    <span className={s.textos}>
                      <span className="um-cuerpo-fuerte">{place.name}</span>
                      <span className={`${s.secundario} um-etiqueta`}>{real}</span>
                      {fila && <span className={`${s.secundario} um-etiqueta`}>{detalle(fila)}</span>}
                    </span>
                    {fila?.kind === 'ruta' && (
                      <span className={`${s.pildora} ${niveles[fila.level ?? 'nublado']} um-etiqueta`}>
                        <span aria-hidden="true">{t('lugares.pildora', { p: Math.round(fila.route.shadePercent) })}</span>
                        <span className="sr-only">{t('lugares.pildoraLarga', { p: Math.round(fila.route.shadePercent) })}</span>
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
          <Boton variant="secundario" onClick={() => navigate(enlace('/buscar'))}>
            {t('lugares.agregar')}
          </Boton>
          <p className={`${s.nota} um-etiqueta`}>{t('lugares.nota')}</p>
        </main>
      )}
      <BarraInferior active="perfil" />
    </div>
  )

  function detalle(fila: FilaDestino): string {
    switch (fila.kind) {
      case 'ruta':
        return t('lugares.detalle', {
          distancia: formatDistance(fila.route.meters, language),
          min: roundMinutes(fila.route.minutes),
        })
      case 'fuera':
        return t('buscar.fueraDelMapa', { distancia: formatDistance(fila.meters, language) })
      case 'sin_ubicacion':
        return t('buscar.sinUbicacion')
      case 'sin_origen':
        return t('buscar.sinOrigen')
      case 'sin_ruta':
        return t('rutas.sinRuta')
      case 'calculando':
        return t('buscar.calculando')
    }
  }
}
