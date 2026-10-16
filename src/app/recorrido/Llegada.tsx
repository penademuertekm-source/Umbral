import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Boton, ChipEstimado } from '../../componentes'
import { HEAT_LEVELS, type HeatLevel } from '../../config/reglas-semaforo'
import { useT } from '../../i18n/useT'
import { placeForDestination, recordAnswered } from '../../perfil/almacen'
import { isNewStamp } from '../../perfil/colecciones'
import { advancedChallenge } from '../../perfil/logros'
import { usePerfil } from '../../perfil/usePerfil'
import { formatTime } from '../../sombra/tiempo'
import { readSettings } from '../ajustes/preferencias'
import { passportPlaces } from '../perfil/colecciones/comun'
import { Sello } from '../perfil/colecciones/Sello'
import { Barra } from '../perfil/logros/Logros'
import { challengeText } from '../perfil/logros/textos'
import { useContextoRutas } from '../rutas/useContextoRutas'
import s from './Llegada.module.css'
import { recordAnswer, type Answer } from './preferencias'

// Pantalla 22 con premios (S3, Figma 152:2798; reemplaza a 35:84): llegada, sol evitado frente a la ruta más
// corta, el reto que avanzó, "¡Nuevo sello!" y "¿Te sirvió esta ruta?". La llegada ya quedó registrada en la 13
// (?llegada=<id>); aquí solo se muestra. Con "Logros y retos" apagado se ven solo el resumen y la pregunta.
// La respuesta se guarda solo en el teléfono, como antes, para el CSV de la investigación.

const ANSWERS: Answer[] = ['si', 'mas_o_menos', 'no']
/** Valores de muestra de Figma, solo para la vista de ejemplo (/llegada sin datos de un recorrido). */
const EJEMPLO = { min: 7, sombra: 76, evitado: 2 }

export function Llegada() {
  const i18n = useT()
  const { t, language } = i18n
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const ctx = useContextoRutas()
  const { data } = ctx
  const profile = usePerfil()
  const [now] = useState(() => new Date())
  const [showAchievements] = useState(() => readSettings().achievements)

  const example = !params.get('min')
  const destino = data?.destinos.find((d) => d.id === params.get('destino')) ?? (example ? data?.destinos[0] : undefined)
  const real = destino ? (language === 'es' ? destino.nombre.es : destino.nombre.en) : ''
  const place = destino ? placeForDestination(profile, destino.id) : undefined
  const nombre = place?.name ?? real
  const number = (key: string, fallback: number) => (example ? fallback : Number(params.get(key) ?? 0))
  const nivelParam = params.get('nivel')
  const nivel = HEAT_LEVELS.includes(nivelParam as HeatLevel) ? nivelParam : null
  const arrivalId = params.get('llegada')
  const arrival = arrivalId ? profile.arrivals.find((a) => a.id === arrivalId) : undefined
  const avoided = example ? EJEMPLO.evitado : Math.round(arrival?.avoided ?? number('evitado', 0))
  const advanced = arrival ? advancedChallenge(profile, arrival.id, now) : undefined
  const simulated = arrival?.simulated ?? params.get('sim') === '1'
  // "¡Nuevo sello!": la primera llegada a este lugar.
  const newStamp = arrival && isNewStamp(profile, arrival.id) ? passportPlaces(data, language).find((pl) => pl.id === arrival.destinationId) : undefined

  const [answer, setAnswer] = useState<{ value: Answer; index: number } | null>(null)
  const answerWith = (value: Answer) => {
    if (example || !destino) return
    const index = recordAnswer({ destino: destino.id, nivel, respuesta: value, simulado: simulated }, answer?.index ?? null)
    // Para el logro "Ayudaste a la investigación": solo la primera respuesta de esta llegada.
    if (!answer) recordAnswered()
    setAnswer({ value, index })
  }

  const resumen = {
    min: number('min', EJEMPLO.min),
    p: number('sombra', EJEMPLO.sombra),
  }

  return (
    <div className={s.pantalla}>
      <main className={s.contenido}>
        <header className={s.cabecera}>
          <h1 className="um-titulo">{t('llegada.llegasteA', { nombre })}</h1>
          <p className={`${s.secundario} um-etiqueta`}>
            {real && real !== nombre ? t('llegada.resumen', { lugar: real, ...resumen }) : t('llegada.resumenCorto', resumen)}
          </p>
        </header>
        {data && <ChipEstimado time={formatTime(ctx.hora.time, language)} provisional={data.meta.datos_provisionales} />}
        {example && <p className={`${s.ejemplo} um-etiqueta`}>{t('llegada.ejemplo')}</p>}

        {showAchievements && (
          <section className={s.premio} aria-labelledby="sol-evitado">
            <p id="sol-evitado" className={`${s.evitado} um-subtitulo`}>
              {t('llegada.evitadoMas', { n: avoided })}
            </p>
            <p className={`${s.secundario} um-etiqueta`}>{t('llegada.frente')}</p>
            {advanced && (
              <>
                <p className="um-cuerpo-fuerte">
                  {advanced.done
                    ? t('llegada.retoHecho', { reto: challengeText(i18n, advanced.challenge) })
                    : t('llegada.reto', {
                        reto: challengeText(i18n, advanced.challenge),
                        v: advanced.value,
                        t: advanced.challenge.target,
                      })}
                </p>
                <Barra fraction={advanced.value / advanced.challenge.target} />
              </>
            )}
            {simulated && <p className={`${s.secundario} um-etiqueta`}>{t('llegada.simulada')}</p>}
          </section>
        )}
        {showAchievements && newStamp && (
          <section className={s.sello} aria-labelledby="nuevo-sello">
            <Sello icon={newStamp.icon} earned size={72} />
            <div className={s.selloTextos}>
              <p id="nuevo-sello" className="um-cuerpo-fuerte">
                {t('llegada.nuevoSello')}
              </p>
              <p className="um-cuerpo">{newStamp.name}</p>
              <Link className={`${s.enlace} um-etiqueta`} to="/perfil/pasaporte">
                {t('llegada.verPasaporte')}
              </Link>
            </div>
          </section>
        )}

        <section className={s.pregunta} aria-labelledby="pregunta-llegada">
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
          <p className={`${s.secundario} um-etiqueta`} role="status">
            {answer ? t('llegada.gracias') : t('llegada.nota')}
          </p>
        </section>

        <Boton className={s.listo} onClick={() => navigate('/mapa')}>
          {t('llegada.listo')}
        </Boton>
      </main>
    </div>
  )
}
