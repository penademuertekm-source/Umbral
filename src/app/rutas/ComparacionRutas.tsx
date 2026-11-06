import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { BarraInferior, Boton, ChipEstimado, Encabezado, HojaInferior, Icono } from '../../componentes'
import { weatherAt } from '../../clima/openMeteo'
import { SINGLE_ROUTE_MIN_IMPROVEMENT } from '../../config/rutas'
import { horaConDia } from '../../i18n/hora'
import { formatDistance, roundMinutes } from '../../i18n/numeros'
import { useT } from '../../i18n/useT'
import { insideArea, metersBetween } from '../../mapa/datos'
import { MapaRutas } from '../../mapa/MapaRutas'
import { preflightSteps } from '../../rutas/avisos'
import { singleRoute } from '../../rutas/rutas'
import { useGuardarLugar } from '../perfil/GuardarLugar'
import { AvisoCalor } from '../recorrido/AvisoCalor'
import { heatWarningEnabled, heatWarningHiddenToday, hideHeatWarningToday } from '../recorrido/preferencias'
import { ProteccionSolar } from '../recorrido/ProteccionSolar'
import { useVolver } from '../useVolver'
import { useEnlace } from './enlaces'
import { destinationIcon } from '../perfil/lugares'
import s from './Rutas.module.css'
import c from './ComparacionRutas.module.css'
import { levelOfRoute, routeBetween, useContextoRutas } from './useContextoRutas'

// Pantalla 06 (rediseño 2026, Figma 117:613): la ruta con más sombra frente a la más corta, a la hora
// elegida. Mapa solo con las dos rutas, hoja con las dos tarjetas (cada una con la muestra de su línea, 06-3,
// y sin el conteo de árboles, 06-2) y barra inferior con "Ir a" activa. Las cifras salen de la fuente única
// del viaje (G3).



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
  // S1: "Guardar" en el encabezado (también para destinos fuera del mapa de sombra).
  const guardar = useGuardarLugar(destino?.id ?? null, nombre)

  const routes = useMemo(() => {
    const target = data?.destinos.find((d) => d.id === destinoId)
    if (!graph || !resultado || !origen || target?.lat == null || target.lon == null) return null
    const to: [number, number] = [target.lon, target.lat]
    const shaded = routeBetween(graph, origen.point, to, resultado, 'sombra', profile)
    const shortest = routeBetween(graph, origen.point, to, resultado, 'corta', profile)
    return shaded && shortest ? { shaded, shortest } : null
  }, [graph, resultado, origen, data, destinoId, profile])

  // Alto real de la hoja, para que el encuadre del mapa deje libre lo que ella tapa.
  const sheetRef = useRef<HTMLDivElement>(null)
  const [sheetHeight, setSheetHeight] = useState(0)
  // Se vuelve a medir cuando la hoja aparece (con datos válidos) o cambia de alto.
  const hasSheet = !!data && !!destino
  useEffect(() => {
    const element = sheetRef.current
    if (!element) return
    const observer = new ResizeObserver(() => setSheetHeight(element.offsetHeight))
    observer.observe(element)
    return () => observer.disconnect()
  }, [hasSheet])

  if (data && !destino) return <Pantalla title="" volver={volver} mensaje={t('rutas.destinoDesconocido')} enlace={enlace('/buscar')} />
  if (data && destino && !point) {
    return <Pantalla title={nombre} volver={volver} mensaje={t('buscar.sinUbicacion')} enlace={enlace('/buscar')} guardar={guardar} />
  }
  if (data && point && !insideArea(data.meta, point)) {
    return (
      <Pantalla
        title={nombre}
        volver={volver}
        mensaje={t('rutas.fueraDelArea', { destino: nombre, distancia: formatDistance(metersBetween(data.meta.area.centro, point), language) })}
        enlace={enlace('/buscar')}
        guardar={guardar}
      />
    )
  }
  if (data && !origen) {
    return <Pantalla title={nombre} volver={volver} mensaje={t('origen.falta')} enlace={enlace('/buscar')} guardar={guardar} />
  }

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
      now: ctx.hora.now,
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

  const desde = t('rutas.desde', { lugar: origen?.kind === 'gps' ? t('origen.tuUbicacion') : t('origen.puntoElegido') })

  return (
    <div className={c.pantalla}>
      <Encabezado compact title={nombre} subtitle={origen ? desde : undefined} onBack={volver} action={guardar.action} />
      <main className={c.principal}>
        <div className={c.mapa}>
          {data && origen && point && routes && (
            <MapaRutas
              data={data}
              shaded={unica ? null : routes.shaded}
              shortest={routes.shortest}
              selected={unica ? 'corta' : selected}
              origin={origen.point}
              destination={point}
              destinationName={nombre}
              destinationIcon={destinationIcon(destino)}
              bottomInset={sheetHeight}
              label={t('rutas.mapa', { destino: nombre })}
            />
          )}
          {(!routes || !data) && <p className={`${c.estado} um-cuerpo`}>{t('buscar.calculando')}</p>}
          {data && (
            <div className={c.chip}>
              <ChipEstimado time={horaConDia(i18n, ctx.hora.time)} provisional={data.meta.datos_provisionales} />
            </div>
          )}
          <div className={c.abajo} ref={sheetRef}>
            <HojaInferior open embedded height="asomada" title={t('rutas.opciones')}>
              <div className={c.panel}>
                {guardar.notice}
                {routes && !unica && (
                  <>
                    <TarjetaRuta
                      activa={selected === 'sombra'}
                      onClick={() => setSelected('sombra')}
                      linea="sombra"
                      titulo={t('rutas.conSombra')}
                      detalle={t('rutas.detalleSombra', {
                        distancia: formatDistance(routes.shaded.meters, language),
                        p: Math.round(routes.shaded.shadePercent),
                      })}
                      minutos={roundMinutes(routes.shaded.minutes)}
                    />
                    <TarjetaRuta
                      activa={selected === 'corta'}
                      onClick={() => setSelected('corta')}
                      linea="corta"
                      titulo={t('rutas.corta')}
                      detalle={t('rutas.detalleCorta', {
                        distancia: formatDistance(routes.shortest.meters, language),
                        n: roundMinutes(routes.shortest.sunMinutes),
                      })}
                      minutos={roundMinutes(routes.shortest.minutes)}
                    />
                  </>
                )}
                {routes && unica && (
                  <TarjetaRuta
                    activa
                    linea="sombra"
                    titulo={t('rutas.recomendada')}
                    detalle={`${t('rutas.detalleSombra', {
                      distancia: formatDistance(routes.shortest.meters, language),
                      p: Math.round(routes.shortest.shadePercent),
                    })} · ${t('rutas.unaSola')}`}
                    minutos={roundMinutes(routes.shortest.minutes)}
                  />
                )}
                <Boton disabled={!routes} onClick={onStart}>
                  {unica || selected === 'corta' ? t('rutas.iniciarSimple') : t('rutas.iniciar')}
                </Boton>
                <Link className={`${c.enlace} um-cuerpo-fuerte`} to={enlace('/cuando-salir', { destino: destino?.id })}>
                  <Icono name="reloj" size={20} />
                  {t('rutas.cuandoSalir')}
                </Link>
              </div>
            </HojaInferior>
          </div>
        </div>
      </main>
      <BarraInferior active="ir" />
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
      {guardar.sheet}
    </div>
  )
}

interface TarjetaRutaProps {
  activa: boolean
  onClick?: () => void
  /** Muestra de la línea del mapa (06-3): con más sombra, verde continua; más corta, gris a rayas. */
  linea: 'sombra' | 'corta'
  titulo: string
  detalle: string
  minutos: number
}

function TarjetaRuta({ activa, onClick, linea, titulo, detalle, minutos }: TarjetaRutaProps) {
  const { t } = useT()
  const content = (
    <>
      <svg className={`${c.muestra} ${linea === 'sombra' ? c.muestraSombra : c.muestraCorta}`} width="28" height="12" viewBox="0 0 28 12" aria-hidden="true">
        <line x1="3" y1="6" x2="25" y2="6" />
      </svg>
      <span className={c.tarjetaTexto}>
        <span className="um-cuerpo-fuerte">{titulo}</span>
        <span className={`${s.secundario} um-etiqueta`}>{detalle}</span>
      </span>
      <span className={`${c.minutos} um-dato`}>{t('rutas.minutos', { n: minutos })}</span>
    </>
  )
  return onClick ? (
    <button type="button" className={`${c.tarjeta} ${activa ? c.activa : ''}`} aria-pressed={activa} onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className={`${c.tarjeta} ${c.activa}`}>{content}</div>
  )
}

interface PantallaProps {
  title: string
  volver: () => void
  mensaje: string
  enlace: string
  guardar?: { action: ReactNode; sheet: ReactNode; notice: ReactNode }
}

function Pantalla({ title, volver, mensaje, enlace, guardar }: PantallaProps) {
  const { t } = useT()
  return (
    <>
      <Encabezado title={title || t('pantallas.p06')} onBack={volver} action={guardar?.action} />
      <main className={s.contenido}>
        {guardar?.notice}
        <p className="um-cuerpo">{mensaje}</p>
        <Link className={`${s.botonEnlace} um-cuerpo-fuerte`} to={enlace}>
          {t('rutas.verDestinos')}
        </Link>
      </main>
      {guardar?.sheet}
    </>
  )
}
