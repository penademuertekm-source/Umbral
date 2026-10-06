import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Boton, FormaSemaforo, Icono, type IconName } from '../../componentes'
import { weatherAt } from '../../clima/openMeteo'
import { HEAT_LEVELS } from '../../config/reglas-semaforo'
import { REST_POINT_DISTANCE_M, ROUTE_PROFILES } from '../../config/rutas'
import { uvCategory } from '../../config/uv'
import niveles from '../../estilos/niveles.module.css'
import { laHora } from '../../i18n/hora'
import { formatDistance, roundMinutes } from '../../i18n/numeros'
import { useT } from '../../i18n/useT'
import { insideArea, metersBetween } from '../../mapa/datos'
import { abbreviate, indexEdges, segmentName } from '../../mapa/tramos'
import { nearRoute } from '../../rutas/cercanos'
import { shadedTail } from '../../rutas/salidas'
import { useVolver } from '../useVolver'
import { useEnlace } from './enlaces'
import { NotaEstimado } from './NotaEstimado'
import s from './Rutas.module.css'
import c from './SinRutaConSombra.module.css'
import { levelOfRoute, routeBetween, useContextoRutas } from './useContextoRutas'
import { useSalidas } from './useSalidas'

// Pantalla 16 (nodo 32:105): a esta hora la ruta es para evitar. Se muestran los datos de la ruta con
// sombra y tres alternativas: esperar la mejor hora, hacer una parte en transporte o caminar protegido.

/** Un lugar con nombre a menos de esta distancia del punto de bajada sirve para nombrarlo (m). */
const NAMED_PLACE_M = 80

export function SinRutaConSombra() {
  const i18n = useT()
  const { t, language } = i18n
  const volver = useVolver('/buscar')
  const enlace = useEnlace()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const ctx = useContextoRutas()
  const { data, graph, resultado, origen, profile, context } = ctx
  const destinoId = params.get('destino')
  const destino = data?.destinos.find((d) => d.id === destinoId)
  const nombre = destino ? (language === 'es' ? destino.nombre.es : destino.nombre.en) : ''
  const destination: [number, number] | null = destino?.lat != null && destino.lon != null ? [destino.lon, destino.lat] : null
  const salidas = useSalidas(ctx, destination)

  const route = useMemo(() => {
    const target = data?.destinos.find((d) => d.id === destinoId)
    if (!graph || !resultado || !origen || target?.lat == null || target.lon == null) return null
    return routeBetween(graph, origen.point, [target.lon, target.lat], resultado.fraction, 'sombra', profile)
  }, [graph, resultado, origen, data, destinoId, profile])

  const thermal = ctx.thermalAt(ctx.hora.time)
  const level = route && context ? (levelOfRoute(route, thermal, context) ?? 'evitar') : 'evitar'
  const uv = ctx.forecast ? weatherAt(ctx.forecast, ctx.hora.time)?.uvIndex ?? null : null

  // Esperar: la ventana sugerida, si es mejor que ahora.
  const better =
    salidas.suggested && HEAT_LEVELS.indexOf(salidas.suggested.level ?? 'evitar') < HEAT_LEVELS.indexOf(level)
      ? salidas.suggested
      : undefined

  // Transporte: hasta el primer punto desde el que el resto va en sombra, o hasta el refugio más cercano.
  let transporte = t('sinRuta.transporteNo')
  if (route && data && graph && destination) {
    const tail = shadedTail(route)
    const places = [
      ...data.destinos.map((d) => ({ nombre: language === 'es' ? d.nombre.es : d.nombre.en, lat: d.lat, lon: d.lon })),
      ...data.refugios.map((r) => ({ nombre: r.nombre, lat: r.lat, lon: r.lon })),
    ].filter((p): p is { nombre: string; lat: number; lon: number } => p.lat !== null && p.lon !== null)
    if (tail) {
      const named = places
        .map((p) => ({ ...p, d: metersBetween(tail.point, [p.lon, p.lat]) }))
        .filter((p) => p.d <= NAMED_PLACE_M)
        .sort((a, b) => a.d - b.d)[0]
      const piece = route.pieces.slice(tail.pieceIndex).find((p) => p.kind === 'acera')
      let lugar = named?.nombre ?? ''
      if (!lugar && piece) {
        const name = segmentName(graph.segments[piece.segment].edge, indexEdges(data.red))
        lugar = name.crossings[0] ? t('ficha.esquina', { calle: name.street, a: name.crossings[0] }) : abbreviate(name.street)
      }
      if (lugar) {
        transporte = t('sinRuta.transporteTexto', {
          lugar,
          n: roundMinutes(tail.walkMeters / ROUTE_PROFILES[profile].speed / 60),
        })
      }
    } else {
      const refuge = data.refugios
        .filter((r) => r.lat !== null && r.lon !== null && insideArea(data.meta, [r.lon, r.lat]))
        .map((r) => ({ r, d: metersBetween(destination, [r.lon!, r.lat!]) }))
        .sort((a, b) => a.d - b.d)[0]
      // Si el refugio más cercano es el propio destino, se sugiere el taxi hasta allá sin llamarlo "cerca".
      if (refuge && refuge.d <= NAMED_PLACE_M) transporte = t('sinRuta.transporteDestino', { lugar: nombre })
      else if (refuge) transporte = t('sinRuta.transporteRefugio', { lugar: refuge.r.nombre })
    }
  }

  // Caminar protegido: refugios con coordenadas a menos de 60 m de la ruta.
  const descansos =
    route && data && graph
      ? nearRoute(route, data.refugios, (r) => (r.lat !== null && r.lon !== null ? [r.lon, r.lat] : null), REST_POINT_DISTANCE_M, graph.projection)
          .length
      : 0

  const opciones: { icon: IconName; title: string; text: string; tono: 'comodo' | 'nublado' | 'precaucion' }[] = [
    {
      icon: 'reloj',
      title: better?.part === 'manana' ? t('sinRuta.esperarManana') : t('sinRuta.esperarTarde'),
      text: better
        ? t('sinRuta.esperarTexto', { laHora: laHora(i18n, ctx.hora.at(better.from)), p: Math.round(better.shadePercent) })
        : t('sinRuta.esperarNo'),
      tono: 'comodo',
    },
    { icon: 'transporte', title: t('sinRuta.transporteTitulo'), text: transporte, tono: 'nublado' },
    {
      icon: 'protector-solar',
      title: t('sinRuta.protegerseTitulo'),
      text:
        descansos === 0
          ? t('sinRuta.protegerseCero')
          : descansos === 1
            ? t('sinRuta.protegerseUno')
            : t('sinRuta.protegerseVarios', { n: descansos }),
      tono: 'precaucion',
    },
  ]

  return (
    <>
      <header className={`${c.banda} ${niveles[level]}`}>
        <button type="button" className={`${c.volver} um-etiqueta`} onClick={volver}>
          <Icono name="volver" size={20} />
          {t('comun.volver')}
        </button>
        <span className={`${c.nivel} um-etiqueta`}>
          <FormaSemaforo level={level} />
          {t(`semaforo.${level}`)}
        </span>
        <h1 className="um-titulo">{t('sinRuta.titulo')}</h1>
        {route && (
          <p className={`${c.subtitulo} um-etiqueta`}>
            {t('sinRuta.hacia', { destino: nombre, distancia: formatDistance(route.meters, language), min: roundMinutes(route.minutes) })}
          </p>
        )}
      </header>
      <main className={s.contenido}>
        <div className={c.datos}>
          <p className={c.dato}>
            <span className="um-subtitulo">{route ? `${Math.round(route.shadePercent)} %` : '—'}</span>
            <span className={`${s.secundario} um-etiqueta`}>{t('sinRuta.enSombra')}</span>
          </p>
          <p className={c.dato}>
            <span className="um-subtitulo">{route ? t('rutas.minutos', { n: roundMinutes(route.sunMinutes) }) : '—'}</span>
            <span className={`${s.secundario} um-etiqueta`}>{t('sinRuta.alSol')}</span>
          </p>
          <p className={c.dato}>
            <span className="um-subtitulo">{uv !== null ? t('uv.valor', { n: Math.round(uv) }) : t('uv.sinDato')}</span>
            {uv !== null && (
              <span className={`${s.secundario} um-etiqueta`}>
                {t('sinRuta.indice', { categoria: t(`uv.categorias.${uvCategory(uv)}`) })}
              </span>
            )}
          </p>
        </div>
        <NotaEstimado time={ctx.hora.time} provisional={!!ctx.data?.meta.datos_provisionales} />

        <h2 className="um-cuerpo-fuerte">{t('sinRuta.queHacer')}</h2>
        <ul className={c.opciones}>
          {opciones.map((o) => (
            <li key={o.icon} className={c.opcion}>
              <span className={`${c.icono} ${niveles[o.tono]}`} aria-hidden="true">
                <Icono name={o.icon} />
              </span>
              <span>
                <span className="um-cuerpo-fuerte">{o.title}</span>
                <br />
                <span className={`${s.secundario} um-etiqueta`}>{o.text}</span>
              </span>
            </li>
          ))}
        </ul>

        <Boton onClick={() => navigate(enlace('/cuando-salir', { destino: destino?.id }))}>{t('sinRuta.verMejorHora')}</Boton>
        <Boton variant="secundario" onClick={() => navigate(enlace('/rutas', { destino: destino?.id, forzar: '1' }))}>
          {t('sinRuta.caminar')}
        </Boton>
      </main>
    </>
  )
}
