import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { BarraInferior, Boton, Encabezado, Icono, Modal } from '../../../componentes'
import { useT } from '../../../i18n/useT'
import { insideArea } from '../../../mapa/datos'
import { removeTrip } from '../../../perfil/almacen'
import { usePerfil } from '../../../perfil/usePerfil'
import { formatTime, isoLocalDate, localDate, localParts } from '../../../sombra/tiempo'
import { useMapData } from '../../rutas/useContextoRutas'
import { useVolver } from '../../useVolver'
import { destinationIcon } from '../lugares'
import s from '../Perfil.module.css'
import { tripNames } from './comun'

// Planear una salida (S2, Figma 146:2554): adónde y a qué hora quiere llegar la persona. La hora de salida
// se calcula en "Tu salida". Con ?editar=<id> cambia una salida guardada.

type Day = 'hoy' | 'manana' | 'otro'

/** Llegada por defecto: la próxima hora en punto con al menos 30 minutos de margen. */
function defaultArrival(now: Date): Date {
  const next = new Date(now.getTime() + 30 * 60_000)
  const { year, month, day, hour, minute } = localParts(next)
  return localDate(year, month, day, minute === 0 ? hour : hour + 1, 0)
}

const pad = (n: number) => String(n).padStart(2, '0')

export function PlanearSalida() {
  const { t, language } = useT()
  const navigate = useNavigate()
  const volver = useVolver('/perfil/salidas')
  const [params] = useSearchParams()
  const profile = usePerfil()
  const { data } = useMapData()
  const editId = params.get('editar')
  const editing = editId ? profile.trips.find((trip) => trip.id === editId) : undefined

  const [now] = useState(() => new Date())
  const initialArrival = (() => {
    const value = params.get('llegada') ?? editing?.arrival
    const parsed = value ? new Date(value) : null
    return parsed && !Number.isNaN(parsed.getTime()) ? parsed : defaultArrival(now)
  })()
  const today = isoLocalDate(now)
  const tomorrow = isoLocalDate(new Date(now.getTime() + 86_400_000))
  const [destinationId, setDestinationId] = useState(params.get('destino') ?? editing?.destinationId ?? '')
  const [placeId, setPlaceId] = useState(params.get('lugar') ?? editing?.placeId ?? '')
  const [date, setDate] = useState(isoLocalDate(initialArrival))
  const [day, setDay] = useState<Day>(date === today ? 'hoy' : date === tomorrow ? 'manana' : 'otro')
  const initialParts = localParts(initialArrival)
  const [time, setTime] = useState(`${pad(initialParts.hour)}:${pad(initialParts.minute)}`)
  const [sheet, setSheet] = useState<'lugar' | 'hora' | null>(null)

  const [year, month, dayOfMonth] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const arrival = localDate(year, month, dayOfMonth, hour, minute)
  const past = arrival.getTime() <= now.getTime()
  const names = destinationId ? tripNames({ destinationId, placeId: placeId || undefined }, profile, data?.destinos, language) : null
  const destinos = (data?.destinos ?? []).filter(
    (d) => d.lat != null && d.lon != null && data && insideArea(data.meta, [d.lon, d.lat]),
  )

  const chooseDay = (next: Day) => {
    setDay(next)
    if (next === 'hoy') setDate(today)
    if (next === 'manana') setDate(tomorrow)
  }
  const calculate = () => {
    const query = new URLSearchParams({ destino: destinationId, llegada: arrival.toISOString() })
    if (placeId) query.set('lugar', placeId)
    if (editing) query.set('editar', editing.id)
    navigate(`/perfil/salidas/tu-salida?${query.toString()}`)
  }

  return (
    <div className={s.pantalla}>
      <Encabezado title={editing ? t('planear.editarTitulo') : t('planear.titulo')} onBack={volver} />
      <main className={s.contenido}>
        <h2 className={`${s.grupo} um-etiqueta`}>{t('planear.adonde')}</h2>
        <div className={s.tarjeta}>
          <button type="button" className={s.fila} aria-haspopup="dialog" onClick={() => setSheet('lugar')}>
            <span className={`${s.textos} um-cuerpo`}>{names ? names.name : t('planear.elegirLugar')}</span>
            {names && names.real !== names.name && <span className={`${s.cuenta} um-etiqueta`}>{names.real}</span>}
            <Icono name="avanzar" className={s.flecha} />
          </button>
        </div>

        <h2 className={`${s.grupo} um-etiqueta`}>{t('planear.cuando')}</h2>
        <div className={s.tarjeta}>
          <button type="button" className={s.fila} aria-haspopup="dialog" onClick={() => setSheet('hora')}>
            <span className={`${s.textos} um-cuerpo`}>{t('planear.quieroLlegar')}</span>
            <span className={`${s.cuenta} um-etiqueta`}>{formatTime(arrival, language)}</span>
            <Icono name="avanzar" className={s.flecha} />
          </button>
        </div>
        <div className={s.chips} role="group" aria-label={t('planear.dia')}>
          {(['hoy', 'manana', 'otro'] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={s.chipToque}
              aria-pressed={day === option}
              onClick={() => chooseDay(option)}
            >
              <span className={`${s.chip} ${day === option ? s.chipActivo : ''} um-etiqueta`}>
                {t(option === 'hoy' ? 'planear.hoy' : option === 'manana' ? 'planear.manana' : 'planear.otroDia')}
              </span>
            </button>
          ))}
        </div>
        {day === 'otro' && (
          <label className={s.etiquetaCampo}>
            <span className={`${s.secundario} um-etiqueta`}>{t('planear.fecha')}</span>
            <input
              className={`${s.campo} um-cuerpo`}
              type="date"
              min={today}
              value={date}
              onChange={(event) => event.target.value && setDate(event.target.value)}
            />
          </label>
        )}
        <p className={`${s.secundario} um-etiqueta`}>{t('planear.nota')}</p>
        {past && (
          <p className={`${s.error} um-etiqueta`} role="status">
            {t('planear.horaPasada')}
          </p>
        )}
        <Boton disabled={!destinationId || past} onClick={calculate}>
          {t('planear.calcular')}
        </Boton>
        {editing && (
          <Boton
            variant="advertencia"
            onClick={() => {
              removeTrip(editing.id)
              navigate('/perfil/salidas', { replace: true })
            }}
          >
            {t('planear.borrar')}
          </Boton>
        )}
      </main>
      <BarraInferior active="perfil" />

      <Modal sheet open={sheet === 'lugar'} onClose={() => setSheet(null)} title={t('planear.hojaLugar')}>
        {profile.places.length > 0 && (
          <>
            <h3 className={`${s.secundario} um-etiqueta`}>{t('planear.tusLugares')}</h3>
            <ul className={s.tarjeta}>
              {profile.places.map((place) => {
                const destino = data?.destinos.find((d) => d.id === place.destinationId)
                return (
                  <li key={place.id}>
                    <button
                      type="button"
                      className={s.fila}
                      onClick={() => {
                        setDestinationId(place.destinationId)
                        setPlaceId(place.id)
                        setSheet(null)
                      }}
                    >
                      <span className={s.icono} aria-hidden="true">
                        <Icono name={destinationIcon(destino)} />
                      </span>
                      <span className={`${s.textos} um-cuerpo`}>{place.name}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
        <h3 className={`${s.secundario} um-etiqueta`}>{t('planear.destinos')}</h3>
        <ul className={s.tarjeta}>
          {destinos.map((destino) => (
            <li key={destino.id}>
              <button
                type="button"
                className={s.fila}
                onClick={() => {
                  setDestinationId(destino.id)
                  setPlaceId('')
                  setSheet(null)
                }}
              >
                <span className={s.icono} aria-hidden="true">
                  <Icono name={destinationIcon(destino)} />
                </span>
                <span className={`${s.textos} um-cuerpo`}>{language === 'es' ? destino.nombre.es : destino.nombre.en}</span>
              </button>
            </li>
          ))}
        </ul>
      </Modal>

      <Modal
        sheet
        open={sheet === 'hora'}
        onClose={() => setSheet(null)}
        title={t('planear.hojaHora')}
        actions={<Boton onClick={() => setSheet(null)}>{t('planear.listo')}</Boton>}
      >
        <label className={s.etiquetaCampo}>
          <span className={`${s.secundario} um-etiqueta`}>{t('planear.hora')}</span>
          <input
            className={`${s.campo} um-cuerpo`}
            type="time"
            step={300}
            value={time}
            onChange={(event) => event.target.value && setTime(event.target.value)}
          />
        </label>
      </Modal>
    </div>
  )
}
