import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { Boton, Icono } from '../../componentes'
import { HEAT_LEVELS, type HeatLevel } from '../../config/reglas-semaforo'
import { formatDistance } from '../../i18n/numeros'
import { useT } from '../../i18n/useT'
import { insideArea, metersBetween, type Refuge } from '../../mapa/datos'
import { NotaEstimado } from '../rutas/NotaEstimado'
import { useContextoRutas } from '../rutas/useContextoRutas'
import s from './Llegada.module.css'
import { recordAnswer, type Answer } from './preferencias'
import { refugeIcon, textoSombraLugar } from './textos'
import { refugePoint, useSombraLugares } from './useSombraLugares'

// Pantalla 22 (nodo 35:84): llegada. Resumen del recorrido, un lugar para quedarse cerca y "¿Te sirvió esta
// ruta?". La respuesta se guarda solo en el teléfono (CLAUDE.md, "Privacidad"); se exporta en la Fase 9.

const ANSWERS: Answer[] = ['si', 'mas_o_menos', 'no']
/** Valores de muestra de Figma, solo para la vista de ejemplo (/llegada sin datos de un recorrido). */
const EJEMPLO = { min: 9, sombra: 78, evitado: 4 }

const lowerFirst = (text: string, language: string) => text.charAt(0).toLocaleLowerCase(language) + text.slice(1)

export function Llegada() {
  const i18n = useT()
  const { t, language } = i18n
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const ctx = useContextoRutas()
  const { data, graph, resultado } = ctx

  const example = !params.get('min')
  const destino = data?.destinos.find((d) => d.id === params.get('destino')) ?? (example ? data?.destinos[0] : undefined)
  const nombre = destino ? (language === 'es' ? destino.nombre.es : destino.nombre.en) : ''
  const number = (key: string, fallback: number) => (example ? fallback : Number(params.get(key) ?? 0))
  const nivelParam = params.get('nivel')
  const nivel = HEAT_LEVELS.includes(nivelParam as HeatLevel) ? nivelParam : null

  // Un lugar para quedarse: el refugio con coordenadas más cercano al destino, dentro del mapa de sombra.
  const refuge = useMemo(() => {
    if (!data || destino?.lat == null || destino.lon == null) return null
    const point: [number, number] = [destino.lon, destino.lat]
    return (
      data.refugios
        .map((r) => ({ r, p: refugePoint(r) }))
        .filter((x): x is { r: Refuge; p: [number, number] } => !!x.p && insideArea(data.meta, x.p))
        .map(({ r, p }) => ({ refuge: r, meters: metersBetween(point, p) }))
        .sort((a, b) => a.meters - b.meters)[0] ?? null
    )
  }, [data, destino])
  const refugeList = useMemo(() => (refuge ? [refuge.refuge] : []), [refuge])
  const sombras = useSombraLugares(refugeList, graph, resultado)

  const [answer, setAnswer] = useState<{ value: Answer; index: number } | null>(null)
  const answerWith = (value: Answer) => {
    if (example || !destino) return
    const index = recordAnswer(
      { destino: destino.id, nivel, respuesta: value, simulado: params.get('sim') === '1' },
      answer?.index ?? null,
    )
    setAnswer({ value, index })
  }

  const stats = [
    { value: t('llegada.minutos', { n: number('min', EJEMPLO.min) }), label: t('llegada.caminando') },
    { value: t('llegada.porcentaje', { p: number('sombra', EJEMPLO.sombra) }), label: t('llegada.enSombra') },
    { value: t('llegada.minutos', { n: number('evitado', EJEMPLO.evitado) }), label: t('llegada.solEvitado') },
  ]
  const sombraTexto = refuge ? textoSombraLugar(i18n, sombras?.get(refuge.refuge.id)) : ''
  const refugeName = refuge && refuge.refuge.nombre !== nombre ? refuge.refuge.nombre : ''

  return (
    <div className={s.pantalla}>
      <header className={s.cabecera}>
        <span className={s.check} aria-hidden="true">
          <Icono name="llegada" size={28} />
        </span>
        <p className={`${s.claro} um-etiqueta`}>{t('llegada.llegaste')}</p>
        <h1 className="um-display">{nombre}</h1>
      </header>
      <main className={s.contenido}>
        {example && <p className={`${s.ejemplo} um-etiqueta`}>{t('llegada.ejemplo')}</p>}
        <ul className={s.datos}>
          {stats.map((stat) => (
            <li key={stat.label} className={s.dato}>
              <span className="um-subtitulo">{stat.value}</span>
              <span className={`${s.secundario} um-etiqueta`}>{stat.label}</span>
            </li>
          ))}
        </ul>
        <p className={`${s.secundario} um-micro`}>{t('llegada.frenteCorta')}</p>
        <NotaEstimado time={ctx.hora.time} provisional={!!data?.meta.datos_provisionales} />

        {refuge && (
          <div className={s.tarjeta}>
            <span className={s.icono} aria-hidden="true">
              <Icono name={refugeIcon(refuge.refuge)} />
            </span>
            <span className={s.textos}>
              <span className="um-cuerpo-fuerte">
                {t('llegada.quedarte', {
                  lugar: lowerFirst(language === 'es' ? refuge.refuge.descripcion.es : refuge.refuge.descripcion.en, language),
                })}
              </span>
              <span className={`${s.secundario} um-etiqueta`}>
                {[refugeName, sombraTexto, t('llegada.aDistancia', { distancia: formatDistance(refuge.meters, language) })]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </span>
          </div>
        )}

        <section className={s.tarjetaColumna} aria-labelledby="pregunta-llegada">
          <h2 id="pregunta-llegada" className="um-cuerpo-fuerte">
            {t('llegada.pregunta')}
          </h2>
          <div className={s.respuestas}>
            {ANSWERS.map((value) => (
              <button
                key={value}
                type="button"
                className={`${s.respuesta} ${answer?.value === value ? s.elegida : ''} um-etiqueta`}
                aria-pressed={answer?.value === value}
                disabled={example}
                onClick={() => answerWith(value)}
              >
                {t(`llegada.respuestas.${value}`)}
              </button>
            ))}
          </div>
          <p className={`${s.secundario} um-micro`} role="status">
            {answer ? t('llegada.gracias') : t('llegada.nota')}
          </p>
        </section>

        <Boton onClick={() => navigate('/mapa')}>{t('llegada.volverMapa')}</Boton>
      </main>
    </div>
  )
}
