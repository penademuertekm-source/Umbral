import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import type { Feature, Point } from 'geojson'
import { Boton, Encabezado } from '../../componentes'
import { weatherAt } from '../../clima/openMeteo'
import { SINGLE_ROUTE_MIN_IMPROVEMENT } from '../../config/rutas'
import { TREE_DISTANCE_M } from '../../mapa/tramos'
import { formatDistance, roundMinutes } from '../../i18n/numeros'
import { useT } from '../../i18n/useT'
import { insideArea, metersBetween, type TreeProps } from '../../mapa/datos'
import { MapaRutas } from '../../mapa/MapaRutas'
import { nearRoute } from '../../rutas/cercanos'
import { preflightSteps } from '../../rutas/avisos'
import { singleRoute } from '../../rutas/rutas'
import { AvisoCalor } from '../recorrido/AvisoCalor'
import { heatWarningEnabled, heatWarningHiddenToday, hideHeatWarningToday } from '../recorrido/preferencias'
import { ProteccionSolar } from '../recorrido/ProteccionSolar'
import { useVolver } from '../useVolver'
import { useEnlace } from './enlaces'
import { NotaEstimado } from './NotaEstimado'
import s from './Rutas.module.css'
import c from './ComparacionRutas.module.css'
import { levelOfRoute, routeBetween, treesOnRoute, useContextoRutas } from './useContextoRutas'
import { textoArboles } from './textos'

// Pantalla 06 (nodo 4:42): la ruta con sombra frente a la más corta, a la hora elegida.

export function ComparacionRutas() {
  const i18n = useT()
  const { t, language } = i18n
  const volver = useVolver('/buscar')
  const enlace = useEnlace()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const ctx = useContextoRutas()
  const { data, graph, resultado, origen, profile, context } = ctx
  const [selected, setSelected] = useState<'sombra' | 'corta'>('sombra')
  // Avisos antes de salir (pantallas 19 y 18), en orden; vacío si no hay ninguno abierto.
  const [pending, setPending] = useState<('aviso' | 'proteccion')[]>([])
  const destinoId = params.get('destino')
  const destino = data?.destinos.find((d) => d.id === destinoId)
  const nombre = destino ? (language === 'es' ? destino.nombre.es : destino.nombre.en) : ''
  const point: [number, number] | null = destino?.lat != null && destino.lon != null ? [destino.lon, destino.lat] : null

  const routes = useMemo(() => {
    const target = data?.destinos.find((d) => d.id === destinoId)
    if (!graph || !resultado || !origen || target?.lat == null || target.lon == null) return null
    const to: [number, number] = [target.lon, target.lat]
    const shaded = routeBetween(graph, origen.point, to, resultado.fraction, 'sombra', profile)
    const shortest = routeBetween(graph, origen.point, to, resultado.fraction, 'corta', profile)
    return shaded && shortest ? { shaded, shortest } : null
  }, [graph, resultado, origen, data, destinoId, profile])

  const treePoints = useMemo(() => {
    if (!data || !graph || !routes) return { type: 'FeatureCollection' as const, features: [] as Feature<Point, TreeProps>[] }
    const near = nearRoute(routes.shaded, data.arboles.features, (f) => f.geometry.coordinates as [number, number], TREE_DISTANCE_M, graph.projection)
    return { type: 'FeatureCollection' as const, features: near }
  }, [data, graph, routes])

  if (data && !destino) return <Pantalla title="" volver={volver} mensaje={t('rutas.destinoDesconocido')} enlace={enlace('/buscar')} />
  if (data && destino && !point) return <Pantalla title={nombre} volver={volver} mensaje={t('buscar.sinUbicacion')} enlace={enlace('/buscar')} />
  if (data && point && !insideArea(data.meta, point)) {
    return (
      <Pantalla
        title={nombre}
        volver={volver}
        mensaje={t('rutas.fueraDelArea', { destino: nombre, distancia: formatDistance(metersBetween(data.meta.area.centro, point), language) })}
        enlace={enlace('/buscar')}
      />
    )
  }
  if (data && !origen) return <Pantalla title={nombre} volver={volver} mensaje={t('origen.falta')} enlace={enlace('/buscar')} />

  const thermal = ctx.thermalAt(ctx.hora.time)
  const level = routes && context ? levelOfRoute(routes.shaded, thermal, context) : null
  // Pantalla 16: si a esta hora la ruta es para evitar, se muestran las alternativas (salvo "caminar de todos modos").
  if (routes && (level === 'evitar' || level === 'no_recomendado') && params.get('forzar') !== '1') {
    return <Navigate to={enlace('/sin-ruta-con-sombra', { destino: destino?.id })} replace />
  }
  const unica = routes ? singleRoute(routes.shortest, routes.shaded, SINGLE_ROUTE_MIN_IMPROVEMENT) : false
  const chosen = routes ? (unica || selected === 'corta' ? routes.shortest : routes.shaded) : null
  const uv = ctx.forecast ? (weatherAt(ctx.forecast, ctx.hora.time)?.uvIndex ?? null) : null
  const start = () => navigate(enlace('/recorrido', { destino: destino?.id, ruta: unica ? 'corta' : selected }))
  // "Iniciar recorrido": primero el aviso de calor (19) y la protección solar (18), si corresponden.
  const onStart = () => {
    if (!chosen) return
    const steps = preflightSteps({
      now: new Date(),
      heatWarningEnabled: heatWarningEnabled(),
      heatWarningHiddenToday: heatWarningHiddenToday(),
      sunMinutes: chosen.sunMinutes,
      uv,
    })
    if (steps.length > 0) setPending(steps)
    else start()
  }
  const nextStep = () => {
    const rest = pending.slice(1)
    setPending(rest)
    if (rest.length === 0) start()
  }

  return (
    <main className={c.pantalla}>
      <Encabezado title={nombre} onBack={volver} />
      <div className={c.mapa}>
        {data && origen && point && routes && (
          <MapaRutas
            data={data}
            shaded={unica ? null : routes.shaded}
            shortest={routes.shortest}
            selected={unica ? 'corta' : selected}
            origin={origen.point}
            destination={point}
            trees={treePoints}
            label={t('rutas.mapa', { destino: nombre })}
          />
        )}
        {(!routes || !data) && <p className={`${c.estado} um-cuerpo`}>{t('buscar.calculando')}</p>}
      </div>
      <section className={c.panel}>
        <NotaEstimado time={ctx.hora.time} provisional={!!ctx.data?.meta.datos_provisionales} />
        {routes && !unica && (
          <>
            <TarjetaRuta
              activa={selected === 'sombra'}
              onClick={() => setSelected('sombra')}
              titulo={t('rutas.conSombra')}
              detalle={[
                t('rutas.protegido', { p: Math.round(routes.shaded.shadePercent) }),
                ctx.trees ? textoArboles(i18n, treesOnRoute(routes.shaded, ctx.trees)) : '',
              ]
                .filter(Boolean)
                .join(' · ')}
              minutos={roundMinutes(routes.shaded.minutes)}
            />
            <TarjetaRuta
              activa={selected === 'corta'}
              onClick={() => setSelected('corta')}
              titulo={t('rutas.corta')}
              detalle={`${t('rutas.protegidoCorto', { p: Math.round(routes.shortest.shadePercent) })} · ${t('rutas.alSol', { n: roundMinutes(routes.shortest.sunMinutes) })}`}
              minutos={roundMinutes(routes.shortest.minutes)}
            />
          </>
        )}
        {routes && unica && (
          <TarjetaRuta
            activa
            titulo={t('rutas.recomendada')}
            detalle={`${t('rutas.protegidoCorto', { p: Math.round(routes.shortest.shadePercent) })} · ${t('rutas.unaSola')}`}
            minutos={roundMinutes(routes.shortest.minutes)}
          />
        )}
        <Boton disabled={!routes} onClick={onStart}>
          {unica || selected === 'corta' ? t('rutas.iniciarSimple') : t('rutas.iniciar')}
        </Boton>
        <Link className={`${c.enlace} um-cuerpo-fuerte`} to={enlace('/cuando-salir', { destino: destino?.id })}>
          {t('rutas.cuandoSalir')}
        </Link>
      </section>
      {chosen && (
        <AvisoCalor
          open={pending[0] === 'aviso'}
          shadePercent={chosen.shadePercent}
          sunMinutes={chosen.sunMinutes}
          onClose={() => setPending([])}
          onBestTime={() => navigate(enlace('/cuando-salir', { destino: destino?.id }))}
          onStart={(hideToday) => {
            if (hideToday) hideHeatWarningToday()
            nextStep()
          }}
        />
      )}
      {chosen && uv !== null && (
        <ProteccionSolar
          open={pending[0] === 'proteccion'}
          uv={uv}
          sunMinutes={chosen.sunMinutes}
          onClose={() => setPending([])}
          onStart={nextStep}
        />
      )}
    </main>
  )
}

function TarjetaRuta(props: { activa: boolean; onClick?: () => void; titulo: string; detalle: string; minutos: number }) {
  const { t } = useT()
  const content = (
    <>
      <span className={c.tarjetaTexto}>
        <span className="um-cuerpo-fuerte">{props.titulo}</span>
        <span className={`${s.secundario} um-etiqueta`}>{props.detalle}</span>
      </span>
      <span className={`${c.minutos} um-dato`}>{t('rutas.minutos', { n: props.minutos })}</span>
    </>
  )
  return props.onClick ? (
    <button type="button" className={`${c.tarjeta} ${props.activa ? c.activa : ''}`} aria-pressed={props.activa} onClick={props.onClick}>
      {content}
    </button>
  ) : (
    <div className={`${c.tarjeta} ${c.activa}`}>{content}</div>
  )
}

function Pantalla({ title, volver, mensaje, enlace }: { title: string; volver: () => void; mensaje: string; enlace: string }) {
  const { t } = useT()
  return (
    <>
      <Encabezado title={title || t('pantallas.p06')} onBack={volver} />
      <main className={s.contenido}>
        <p className="um-cuerpo">{mensaje}</p>
        <Link className={`${s.botonEnlace} um-cuerpo-fuerte`} to={enlace}>
          {t('rutas.verDestinos')}
        </Link>
      </main>
    </>
  )
}
