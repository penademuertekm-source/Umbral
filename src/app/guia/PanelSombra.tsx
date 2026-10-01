import { useEffect, useMemo, useState } from 'react'
import { Boton, MuestraTramo } from '../../componentes'
import { dataBaseUrl } from '../../sombra/cargar'
import { motorSombra } from '../../sombra/cliente'
import { STATE_CODES, type ProfilePoint, type Season, type SideLetter } from '../../sombra/modelo'
import { formatTime, isoLocalDate, localDate, localParts } from '../../sombra/tiempo'
import { useSombra } from '../../sombra/useSombra'
import { useT } from '../../i18n/useT'
import s from './PanelSombra.module.css'

// Panel de desarrollo de la Fase 3: el motor de sombra para una hora, sin mapa todavía.

interface LadoRed {
  lado: SideLetter
  orientacion: 'norte' | 'sur' | 'oriental' | 'occidental'
}
interface AristaRed {
  id: number
  nombre: string
  lados: LadoRed[]
}

const SEASONS: Season[] = ['automatica', 'seca', 'lluvias']
const MIN_MINUTE = 6 * 60
const MAX_MINUTE = 18 * 60

function useRed(): Map<number, AristaRed> {
  const [red, setRed] = useState(new Map<number, AristaRed>())
  useEffect(() => {
    let vigente = true
    fetch(`${dataBaseUrl()}red.geojson`)
      .then((r) => r.json())
      .then((geo: { features: { properties: AristaRed }[] }) => {
        if (vigente) setRed(new Map(geo.features.map((f) => [f.properties.id, f.properties])))
      })
      .catch(() => undefined)
    return () => {
      vigente = false
    }
  }, [])
  return red
}

function initialMinute(): number {
  const { hour, minute } = localParts(new Date())
  const now = Math.floor((hour * 60 + minute) / 15) * 15
  return Math.min(MAX_MINUTE, Math.max(MIN_MINUTE, now))
}

export function PanelSombra() {
  const { t, language } = useT()
  const [day, setDay] = useState(() => isoLocalDate(new Date()))
  const [minute, setMinute] = useState(initialMinute)
  const [season, setSeason] = useState<Season>('automatica')
  const [chosen, setChosen] = useState<string>('')
  const [until, setUntil] = useState<{ key: string; text: string } | null>(null)
  const [profile, setProfile] = useState<{ key: string; points: ProfilePoint[] } | null>(null)
  const red = useRed()

  const time = useMemo(() => {
    const [year, month, date] = day.split('-').map(Number)
    return localDate(year, month, date, Math.floor(minute / 60), minute % 60)
  }, [day, minute])
  const estado = useSombra(time, season)
  const resultado = estado.resultado

  // Lados con nombre que están en sombra plena a esta hora (para el ejemplo).
  const shadedSides = useMemo(() => {
    if (!resultado || red.size === 0) return []
    const list: { key: string; edge: number; side: SideLetter; label: string }[] = []
    for (const arista of red.values()) {
      if (!arista.nombre) continue
      for (const lado of arista.lados) {
        if (resultado.lado(arista.id, lado.lado)?.state !== 'sombra') continue
        list.push({
          key: `${arista.id}:${lado.lado}`,
          edge: arista.id,
          side: lado.lado,
          label: t('guia.sombra.lado', {
            calle: arista.nombre,
            orientacion: t(`guia.sombra.orientaciones.${lado.orientacion}`),
          }),
        })
      }
    }
    return list.sort((a, b) => a.label.localeCompare(b.label, language))
  }, [resultado, red, t, language])

  const example = shadedSides.find((x) => x.key === chosen) ?? shadedSides[0]
  const exampleShade = example ? resultado?.lado(example.edge, example.side) : undefined
  const exampleEdge = example?.edge
  const exampleSide = example?.side
  const requestKey = example ? `${example.key}|${time.getTime()}|${season}` : ''

  useEffect(() => {
    if (exampleEdge === undefined || exampleSide === undefined) return
    let vigente = true
    const options = { season }
    motorSombra.sombraHasta(exampleEdge, exampleSide, time, options).then((r) => {
      if (!vigente) return
      const text = !r
        ? t('guia.sombra.noPlena')
        : r.untilSunset
          ? t('guia.sombra.hastaAtardecer')
          : t('guia.sombra.hasta', { hora: formatTime(new Date(r.until), language) })
      setUntil({ key: requestKey, text })
    })
    motorSombra.perfilDelDia(exampleEdge, exampleSide, time, options).then((points) => {
      if (vigente) setProfile({ key: requestKey, points })
    })
    return () => {
      vigente = false
    }
  }, [exampleEdge, exampleSide, time, season, requestKey, t, language])

  const stateLabel = (state: (typeof STATE_CODES)[number]) =>
    state === 'sin_sol' ? t('guia.sombra.sinSolEstado') : t(`tramo.${state}`)

  return (
    <div className={s.panel}>
      <div className={s.controles}>
        <label className={s.campo}>
          <span className="um-etiqueta">{t('guia.sombra.fecha')}</span>
          <input type="date" className="um-cuerpo" value={day} onChange={(e) => e.target.value && setDay(e.target.value)} />
        </label>
        <label className={`${s.campo} ${s.hora}`}>
          <span className="um-etiqueta">{t('guia.sombra.hora', { hora: formatTime(time, language) })}</span>
          <input
            type="range"
            min={MIN_MINUTE}
            max={MAX_MINUTE}
            step={15}
            value={minute}
            onChange={(e) => setMinute(Number(e.target.value))}
            aria-valuetext={formatTime(time, language)}
          />
        </label>
        <fieldset className={s.temporadas}>
          <legend className="um-etiqueta">{t('guia.sombra.temporada')}</legend>
          {SEASONS.map((value) => (
            <Boton
              key={value}
              variant={value === season ? 'primario' : 'secundario'}
              fullWidth={false}
              aria-pressed={value === season}
              onClick={() => setSeason(value)}
            >
              {t(`guia.sombra.temporadas.${value}`)}
            </Boton>
          ))}
        </fieldset>
      </div>

      <div className={s.resultado} aria-live="polite">
        {estado.status === 'error' && <p className={`${s.aviso} um-etiqueta`}>{t('guia.sombra.error', { error: estado.error })}</p>}
        {!resultado && estado.status === 'cargando' && <p className="um-cuerpo">{t('guia.sombra.cargando')}</p>}
        {resultado && (
          <>
            {resultado.noSun ? (
              <p className="um-cuerpo-fuerte">{t('guia.sombra.sinSol')}</p>
            ) : (
              <p className="um-cuerpo">
                {t('guia.sombra.sol', {
                  azimut: Math.round(resultado.sun.azimuth),
                  elevacion: Math.round(resultado.sun.elevation),
                })}
              </p>
            )}
            <ul className={s.conteos}>
              {(['sombra', 'parcial', 'expuesto'] as const).map((state) => (
                <li key={state} className={s.conteo}>
                  <MuestraTramo state={state} />
                  <span className="um-dato">{resultado.counts[state]}</span>
                </li>
              ))}
            </ul>
            <p className={`${s.secundario} um-micro`}>
              {t('guia.sombra.conteo', { n: resultado.fraction.length })} ·{' '}
              {resultado.deciduousActive ? t('guia.sombra.conHojas') : t('guia.sombra.sinHojas')} ·{' '}
              {resultado.cached ? t('guia.sombra.cache') : t('guia.sombra.calculo', { ms: resultado.ms.toFixed(1) })}
            </p>
          </>
        )}
      </div>

      {resultado && !resultado.noSun && (
        <div className={s.tramo}>
          <h3 className="um-cuerpo-fuerte">{t('guia.sombra.tramo')}</h3>
          {shadedSides.length === 0 ? (
            <p className={`${s.secundario} um-etiqueta`}>{t('guia.sombra.ninguno')}</p>
          ) : (
            <>
              <label className={s.campo}>
                <span className="um-etiqueta">{t('guia.sombra.elegirTramo')}</span>
                <select className="um-cuerpo" value={example?.key} onChange={(e) => setChosen(e.target.value)}>
                  {shadedSides.map((x) => (
                    <option key={x.key} value={x.key}>
                      {x.label}
                    </option>
                  ))}
                </select>
              </label>
              {exampleShade && (
                <div className={s.datosTramo}>
                  {exampleShade.state !== 'sin_sol' && <MuestraTramo state={exampleShade.state} />}
                  <p className="um-etiqueta">
                    {t('guia.sombra.porcentaje', { pct: Math.round(exampleShade.fraction * 100) })} ·{' '}
                    {t('guia.sombra.canalTitulo')}: {t(`guia.sombra.canal.${exampleShade.channel}`)}
                  </p>
                  {until?.key === requestKey && <p className={`${s.pildora} um-etiqueta`}>{until.text}</p>}
                </div>
              )}
              {profile?.key === requestKey && (
                <figure className={s.perfil}>
                  <figcaption className="um-etiqueta">{t('guia.sombra.perfil')}</figcaption>
                  <div className={s.barras} role="list">
                    {profile.points.map((point) => {
                      const label = t('guia.sombra.perfilBarra', {
                        hora: formatTime(new Date(point.time), language),
                        pct: point.state === 'sin_sol' ? '—' : Math.round(point.fraction * 100),
                        estado: stateLabel(point.state),
                      })
                      const selected = Math.abs(point.time - time.getTime()) < 60_000
                      return (
                        <span
                          key={point.time}
                          role="listitem"
                          aria-label={label}
                          title={label}
                          className={`${s.barra} ${s[point.state]} ${selected ? s.seleccionada : ''}`}
                        >
                          <span style={{ height: `${point.state === 'sin_sol' ? 100 : Math.max(4, point.fraction * 100)}%` }} />
                        </span>
                      )
                    })}
                  </div>
                  <div className={`${s.eje} um-micro`} aria-hidden="true">
                    <span>{formatTime(new Date(profile.points[0].time), language)}</span>
                    <span>{formatTime(new Date(profile.points[24].time), language)}</span>
                    <span>{formatTime(new Date(profile.points[48].time), language)}</span>
                  </div>
                </figure>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
