import { useId, useState } from 'react'
import { BarraSuperior, Boton, Semaforo } from '../../componentes'
import { estimateUtci } from '../../clima/utci'
import { HEAT_PROFILES, generalLevel, routeLevel, type HeatProfile } from '../../config/reglas-semaforo'
import type { ThermalLevel } from '../../config/niveles'
import type { TranslationKey } from '../../i18n/traducir'
import { useT } from '../../i18n/useT'
import s from './SimuladorSemaforo.module.css'

// Simulador del semáforo (Fase 5): fuerza el clima para ver los cinco estados de la barra superior.
// Los valores son simulados y se rotulan así; no salen del pronóstico.

interface SimInputs {
  airTemp: number
  humidity: number
  windSpeed: number
  directNormal: number
  sunElevation: number
  cloudCover: number
  minutesInSun: number
  elNino: boolean
  profile: HeatProfile
}

type NumericInput = Exclude<keyof SimInputs, 'elNino' | 'profile'>

/** Un ejemplo por estado, con las horas de la pantalla 17 (calculados con los supuestos de docs/metodo-utci.md). */
const PRESETS: { level: ThermalLevel; inputs: Omit<SimInputs, 'minutesInSun' | 'elNino' | 'profile'> }[] = [
  { level: 'comodo', inputs: { airTemp: 26, humidity: 80, windSpeed: 1.5, directNormal: 300, sunElevation: 15, cloudCover: 10 } },
  { level: 'precaucion', inputs: { airTemp: 30, humidity: 60, windSpeed: 2, directNormal: 500, sunElevation: 40, cloudCover: 20 } },
  { level: 'evitar', inputs: { airTemp: 34, humidity: 50, windSpeed: 2.5, directNormal: 850, sunElevation: 75, cloudCover: 10 } },
  {
    level: 'no_recomendado',
    inputs: { airTemp: 37, humidity: 45, windSpeed: 1.5, directNormal: 900, sunElevation: 70, cloudCover: 5 },
  },
  { level: 'nublado', inputs: { airTemp: 31, humidity: 70, windSpeed: 2, directNormal: 60, sunElevation: 50, cloudCover: 90 } },
]

const RANGES: { key: NumericInput; label: TranslationKey; min: number; max: number; step: number }[] = [
  { key: 'airTemp', label: 'guia.simulador.temperatura', min: 18, max: 45, step: 0.5 },
  { key: 'humidity', label: 'guia.simulador.humedad', min: 15, max: 100, step: 1 },
  { key: 'windSpeed', label: 'guia.simulador.viento', min: 0.5, max: 8, step: 0.5 },
  { key: 'directNormal', label: 'guia.simulador.radiacion', min: 0, max: 1000, step: 10 },
  { key: 'sunElevation', label: 'guia.simulador.elevacion', min: 0, max: 90, step: 1 },
  { key: 'cloudCover', label: 'guia.simulador.nubosidad', min: 0, max: 100, step: 5 },
  { key: 'minutesInSun', label: 'guia.simulador.minutos', min: 0, max: 30, step: 1 },
]

export function SimuladorSemaforo() {
  const { t, language } = useT()
  const idBase = useId()
  const [inputs, setInputs] = useState<SimInputs>({
    ...PRESETS[2].inputs,
    minutesInSun: 5,
    elNino: false,
    profile: 'estandar',
  })
  const set = <K extends keyof SimInputs>(key: K, value: SimInputs[K]) => setInputs((prev) => ({ ...prev, [key]: value }))

  const utci = estimateUtci(inputs)
  const common = { cloudCover: inputs.cloudCover, elNino: inputs.elNino, profile: inputs.profile }
  const general = utci ? generalLevel({ utciSun: utci.sun, utciShade: utci.shade, ...common }) : null
  const route = utci
    ? routeLevel({ utciSun: utci.sun, utciShade: utci.shade, minutesInSun: inputs.minutesInSun, ...common })
    : null
  const number = (value: number) => new Intl.NumberFormat(language === 'es' ? 'es-CO' : 'en-US').format(value)

  return (
    <div className={s.simulador}>
      <fieldset className={s.grupo}>
        <legend className="um-etiqueta">{t('guia.simulador.ejemplos')}</legend>
        {PRESETS.map((preset) => (
          <Boton
            key={preset.level}
            variant="secundario"
            fullWidth={false}
            onClick={() => setInputs((prev) => ({ ...prev, ...preset.inputs, elNino: false, profile: 'estandar' }))}
          >
            {t(`semaforo.${preset.level}`)}
          </Boton>
        ))}
      </fieldset>

      <div className={s.vista} aria-live="polite">
        <BarraSuperior
          time={t('guia.simulador.hora')}
          level={general?.level ?? 'nublado'}
          levelLabel={general ? (general.level === 'nublado' ? t('semaforo.nubladoRiesgoBajo') : undefined) : t('semaforo.sinClima')}
          utciSun={utci?.sun ?? null}
          utciShade={utci?.shade ?? null}
        />
        <div className={s.detalles}>
          {!utci && <p className="um-etiqueta">{t('guia.simulador.fueraDeRango')}</p>}
          {utci && general && (
            <>
              <p className="um-etiqueta">
                {t('guia.simulador.categoria', { categoria: t(`semaforo.categorias.${general.category}`) })}
              </p>
              <p className={`${s.secundario} um-etiqueta`}>
                {t('guia.simulador.ganancia', { v: number(Math.round(utci.deltaMrt * 10) / 10) })}
              </p>
              {general.hardenedBy.length > 0 && (
                <p className={`${s.secundario} um-etiqueta`}>
                  {t('guia.simulador.endurecido', {
                    motivos: general.hardenedBy.map((m) => t(`guia.simulador.motivos.${m}`)).join(', '),
                  })}
                </p>
              )}
            </>
          )}
          {route && (
            <p className={`${s.ruta} um-etiqueta`}>
              {t('guia.simulador.ruta')}
              <Semaforo level={route.level} />
            </p>
          )}
        </div>
      </div>

      <div className={s.controles}>
        {RANGES.map(({ key, label, min, max, step }) => (
          <label key={key} className={s.campo} htmlFor={`${idBase}-${key}`}>
            <span className="um-etiqueta">{t(label, { v: number(inputs[key]) })}</span>
            <input
              id={`${idBase}-${key}`}
              type="range"
              min={min}
              max={max}
              step={step}
              value={inputs[key]}
              onChange={(e) => set(key, Number(e.target.value))}
            />
          </label>
        ))}
        <label className={s.casilla}>
          <input type="checkbox" checked={inputs.elNino} onChange={(e) => set('elNino', e.target.checked)} />
          <span className="um-etiqueta">{t('guia.simulador.elNino')}</span>
        </label>
        <fieldset className={s.grupo}>
          <legend className="um-etiqueta">{t('guia.simulador.perfil')}</legend>
          {HEAT_PROFILES.map((profile) => (
            <Boton
              key={profile}
              variant={inputs.profile === profile ? 'primario' : 'secundario'}
              fullWidth={false}
              aria-pressed={inputs.profile === profile}
              onClick={() => set('profile', profile)}
            >
              {t(`guia.simulador.perfiles.${profile}`)}
            </Boton>
          ))}
        </fieldset>
      </div>
    </div>
  )
}
