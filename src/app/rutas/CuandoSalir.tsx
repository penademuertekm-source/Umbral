import { useNavigate, useSearchParams } from 'react-router'
import { Boton, Encabezado, FormaSemaforo, Icono } from '../../componentes'
import { HEAT_LEVELS } from '../../config/reglas-semaforo'
import { DEPARTURES } from '../../config/rutas'
import niveles from '../../estilos/niveles.module.css'
import { laHora } from '../../i18n/hora'
import { formatDistance, roundMinutes } from '../../i18n/numeros'
import { useT } from '../../i18n/useT'
import type { DepartureWindow } from '../../rutas/salidas'
import { formatTime, TIME_ZONE } from '../../sombra/tiempo'
import { formatHora } from '../useHoraElegida'
import { useVolver } from '../useVolver'
import c from './CuandoSalir.module.css'
import { useEnlace } from './enlaces'
import { NotaEstimado } from './NotaEstimado'
import s from './Rutas.module.css'
import { useContextoRutas } from './useContextoRutas'
import { useSalidas } from './useSalidas'

// Pantalla 15 (nodo 32:35): minutos al sol de la ruta con sombra según la hora de salida, de 6 a. m. a
// 6 p. m. El cálculo es cada 15 min; el gráfico muestra una barra por hora en punto, como en Figma, con el
// color y la forma del nivel. Las ventanas recomendadas salen del cálculo cada 15 min.

const HOURS = Array.from({ length: DEPARTURES.endHour - DEPARTURES.startHour + 1 }, (_, i) => DEPARTURES.startHour + i)

/** Posición horizontal (0–100 %) de una hora dentro del gráfico: cada hora es una columna. */
const xOf = (minute: number) => ((minute - DEPARTURES.startHour * 60) / 60 + 0.5) * (100 / HOURS.length)

export function CuandoSalir() {
  const i18n = useT()
  const { t, language } = i18n
  const volver = useVolver('/rutas')
  const enlace = useEnlace()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const ctx = useContextoRutas()
  const destino = ctx.data?.destinos.find((d) => d.id === params.get('destino'))
  const destination: [number, number] | null = destino?.lat != null && destino.lon != null ? [destino.lon, destino.lat] : null
  const { departures, windows, suggested, nowMinute } = useSalidas(ctx, destination)
  const nombre = destino ? (language === 'es' ? destino.nombre.es : destino.nombre.en) : ''
  const time = (minute: number) => ctx.hora.at(minute)
  const hourLabel = (hour: number) =>
    new Intl.DateTimeFormat(language === 'es' ? 'es-CO' : 'en-US', { hour: 'numeric', timeZone: TIME_ZONE }).format(time(hour * 60))

  const atHour = (hour: number) => departures?.find((d) => d.minute === hour * 60)
  const maxSun = Math.max(1, ...(departures ?? []).map((d) => d.route.sunMinutes))
  const nowQuarter = Math.floor(nowMinute / DEPARTURES.stepMin) * DEPARTURES.stepMin
  const nowDeparture = departures?.find((d) => d.minute === nowQuarter)
  const showNow = nowMinute >= DEPARTURES.startHour * 60 && nowMinute <= DEPARTURES.endHour * 60
  const current = departures?.find((d) => d.minute === ctx.hora.minute)?.route ?? departures?.[0]?.route
  const hasLevels = !!departures?.some((d) => d.level)
  const levelWord = (level: string | null) => (level ? t(`cuando.niveles.${level as 'comodo'}`) : '')

  const windowTitle = (w: DepartureWindow) => {
    const end = time(w.to + DEPARTURES.stepMin)
    if (w.part === 'manana' && w.from === DEPARTURES.startHour * 60) return t('cuando.antesDe', { laHora: laHora(i18n, end) })
    if (w.part === 'tarde' && w.to === DEPARTURES.endHour * 60) return t('cuando.desde', { laHora: laHora(i18n, time(w.from)) })
    return t('cuando.entre', { desde: formatTime(time(w.from), language), hasta: formatTime(end, language) })
  }
  const windowDetail = (w: DepartureWindow) => {
    const a = roundMinutes(w.sunMin)
    const b = roundMinutes(w.sunMax)
    return [
      w.part === 'manana' ? t('cuando.manana') : t('cuando.tarde'),
      a === b ? t('cuando.rangoUno', { a }) : t('cuando.rango', { a, b }),
      levelWord(w.level),
    ]
      .filter(Boolean)
      .join(' · ')
  }
  const windowList = [windows?.morning, windows?.afternoon].filter((w): w is DepartureWindow => !!w)

  return (
    <>
      <Encabezado title={t('pantallas.p15')} onBack={volver} />
      <main className={s.contenido}>
        <section className={c.resumen}>
          <p className="um-cuerpo-fuerte">{t('cuando.hacia', { destino: nombre })}</p>
          {current && (
            <p className={`${s.secundario} um-etiqueta`}>
              {t('cuando.resumen', { distancia: formatDistance(current.meters, language), min: roundMinutes(current.minutes) })}
            </p>
          )}
        </section>

        <section className={c.grafico} aria-labelledby="titulo-grafico">
          <h2 id="titulo-grafico" className="um-cuerpo-fuerte">
            {t('cuando.grafico')}
          </h2>
          {!departures ? (
            <p className="um-cuerpo">{t('cuando.calculando')}</p>
          ) : (
            <div className={c.lienzo}>
              <div className={c.area} aria-hidden="true">
                {windowList.map((w) => (
                  <span
                    key={w.part}
                    className={c.ventana}
                    style={{ left: `${xOf(w.from) - 50 / HOURS.length}%`, width: `${xOf(w.to) - xOf(w.from) + 100 / HOURS.length}%` }}
                  />
                ))}
                {HOURS.map((hour) => {
                  const d = atHour(hour)
                  const height = d ? Math.max(3, (d.route.sunMinutes / maxSun) * 100) : 0
                  const level = d?.level ?? 'nublado'
                  const label = d
                    ? d.level
                      ? t('cuando.barra', { hora: formatTime(time(hour * 60), language), n: roundMinutes(d.route.sunMinutes), nivel: levelWord(d.level) })
                      : t('cuando.barraSinNivel', { hora: formatTime(time(hour * 60), language), n: roundMinutes(d.route.sunMinutes) })
                    : ''
                  return (
                    <span key={hour} className={c.columna} title={label}>
                      <span className={c.forma}>{d?.level && <FormaSemaforo level={d.level} size={10} />}</span>
                      <span className={`${c.barra} ${niveles[level]}`} style={{ height: `${height}%` }} />
                    </span>
                  )
                })}
                {showNow && (
                  <span className={c.ahora} style={{ left: `${xOf(nowMinute)}%` }}>
                    <span className={`${c.ahoraTexto} um-micro`}>{t('cuando.ahora', { hora: formatTime(ctx.hora.now, language) })}</span>
                  </span>
                )}
              </div>
              <div className={`${c.eje} um-micro`} aria-hidden="true">
                {/* Tres marcas (inicio, mediodía y fin): con más no caben a 390 px. */}
                {HOURS.map((hour) => (
                  <span key={hour}>{hour % 6 === 0 ? hourLabel(hour) : ''}</span>
                ))}
              </div>
              {/* Los mismos datos como lista, para lectores de pantalla. */}
              <ul className="sr-only">
                {HOURS.map((hour) => {
                  const d = atHour(hour)
                  return d ? (
                    <li key={hour}>
                      {d.level
                        ? t('cuando.barra', { hora: formatTime(time(hour * 60), language), n: roundMinutes(d.route.sunMinutes), nivel: levelWord(d.level) })
                        : t('cuando.barraSinNivel', { hora: formatTime(time(hour * 60), language), n: roundMinutes(d.route.sunMinutes) })}
                    </li>
                  ) : null
                })}
              </ul>
            </div>
          )}
          {departures && (
            <ul className={`${c.leyenda} um-etiqueta`} aria-hidden={!hasLevels}>
              {hasLevels ? (
                HEAT_LEVELS.map((level) => (
                  <li key={level}>
                    <FormaSemaforo level={level} />
                    {t(`semaforo.${level}`)}
                  </li>
                ))
              ) : (
                <li>{t('cuando.sinClima')}</li>
              )}
            </ul>
          )}
        </section>

        {windowList.length > 0 && (
          <section className={c.ventanas} aria-label={t('cuando.ventanas')}>
            {windowList.map((w) => (
              <div key={w.part} className={c.tarjeta}>
                <span className={c.reloj} aria-hidden="true">
                  <Icono name="reloj" />
                </span>
                <span>
                  <span className="um-cuerpo-fuerte">{windowTitle(w)}</span>
                  <br />
                  <span className={`${s.secundario} um-etiqueta`}>{windowDetail(w)}</span>
                </span>
              </div>
            ))}
          </section>
        )}

        <NotaEstimado provisional={!!ctx.data?.meta.datos_provisionales} />

        {showNow && nowDeparture && (
          <p className={`${c.siAhora} ${niveles[nowDeparture.level ?? 'nublado']} um-etiqueta`}>
            {nowDeparture.level && <FormaSemaforo level={nowDeparture.level} />}
            {t('cuando.siSalesAhora', { n: roundMinutes(nowDeparture.route.sunMinutes) })}
          </p>
        )}

        {suggested && destino && (
          <Boton
            onClick={() => navigate(enlace('/rutas', { destino: destino.id, hora: formatHora(suggested.from), forzar: undefined }))}
          >
            {t('cuando.verRuta', { laHora: laHora(i18n, time(suggested.from)) })}
          </Boton>
        )}
        {ctx.data && !destination && <p className="um-cuerpo">{t('rutas.destinoDesconocido')}</p>}
      </main>
    </>
  )
}
