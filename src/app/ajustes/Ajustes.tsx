import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Encabezado, Icono } from '../../componentes'
import { readHeatProfileOption } from '../../clima/configClima'
import { LANGUAGES, type Language } from '../../i18n/idioma'
import { translateIn } from '../../i18n/diccionarios'
import { useT } from '../../i18n/useT'
import { isoLocalDate } from '../../sombra/tiempo'
import { useHorasAviso } from '../recorrido/horasAviso'
import { readAnswers } from '../recorrido/preferencias'
import { useVolver } from '../useVolver'
import s from './Ajustes.module.css'
import { answersToCsv, downloadCsv } from './csv'
import { applyDisplaySettings, readSettings, writeSetting, type SettingKey, type Settings } from './preferencias'

// Pantalla 11 (nodo 7:2): ajustes y accesibilidad. Todo se guarda solo en el teléfono.

export function Ajustes() {
  const { t, language, setLanguage } = useT()
  const navigate = useNavigate()
  const volver = useVolver()
  const horas = useHorasAviso()
  const [settings, setSettings] = useState<Settings>(readSettings)
  const [answers] = useState(() => readAnswers().length)
  const [profile] = useState(readHeatProfileOption)
  const other: Language = LANGUAGES.find((code) => code !== language) ?? 'es'

  const toggle = (key: SettingKey) => {
    const next = { ...settings, [key]: !settings[key] }
    writeSetting(key, next[key])
    setSettings(next)
    if (key === 'largeText' || key === 'highContrast') applyDisplaySettings(next)
  }

  const switches: { key: SettingKey; title: string; text: string }[] = [
    { key: 'largeText', title: t('ajustes.textoGrande'), text: t('ajustes.textoGrandeTexto') },
    { key: 'highContrast', title: t('ajustes.altoContraste'), text: t('ajustes.altoContrasteTexto') },
    { key: 'heatWarning', title: t('ajustes.avisoCalor'), text: t('ajustes.avisoCalorTexto', horas) },
  ]

  return (
    <div className={s.pantalla}>
      <Encabezado title={t('pantallas.p11')} onBack={volver} />
      <main className={s.contenido}>
        <ul className={s.lista}>
          {switches.map((item) => (
            <li key={item.key}>
              <FilaInterruptor title={item.title} text={item.text} checked={settings[item.key]} onToggle={() => toggle(item.key)} />
            </li>
          ))}
          <li>
            <button type="button" className={s.fila} onClick={() => navigate('/ajustes/perfil-calor')}>
              <span className={s.textos}>
                <span className="um-cuerpo-fuerte">{t('ajustes.perfil')}</span>
                <span className={`${s.secundario} um-etiqueta`}>
                  {t('ajustes.perfilTexto', { perfil: t(`perfil.opciones.${profile}`) })}
                </span>
              </span>
              <Icono name="avanzar" className={s.flecha} />
            </button>
          </li>
          <li>
            <FilaInterruptor
              title={t('ajustes.ahorro')}
              text={t('ajustes.ahorroTexto')}
              checked={settings.dataSaver}
              onToggle={() => toggle('dataSaver')}
            />
          </li>
          <li>
            <button type="button" className={s.fila} onClick={() => setLanguage(other)}>
              <span className={s.textos}>
                <span className="um-cuerpo-fuerte">{t('ajustes.idioma')}</span>
                <span className={`${s.secundario} um-etiqueta`}>
                  {t('ajustes.idiomaTexto', { actual: translateIn(language, `idioma.${language}`), otro: translateIn(other, `idioma.${other}`) })}
                </span>
              </span>
              <Icono name="avanzar" className={s.flecha} />
            </button>
          </li>
          <li>
            <button
              type="button"
              className={s.fila}
              disabled={answers === 0}
              onClick={() => downloadCsv(answersToCsv(readAnswers()), `umbral-respuestas-${isoLocalDate(new Date())}.csv`)}
            >
              <span className={s.textos}>
                <span className="um-cuerpo-fuerte">{t('ajustes.exportar')}</span>
                <span className={`${s.secundario} um-etiqueta`}>
                  {answers === 0
                    ? t('ajustes.exportarNinguna')
                    : answers === 1
                      ? t('ajustes.exportarUna')
                      : t('ajustes.exportarTexto', { n: answers })}
                </span>
              </span>
              {answers > 0 && <Icono name="compartir" className={s.flecha} />}
            </button>
          </li>
        </ul>
        <section className={s.tarjeta} aria-labelledby="como-se-calcula">
          <h2 id="como-se-calcula" className="um-cuerpo-fuerte">
            {t('ajustes.comoTitulo')}
          </h2>
          <p className="um-etiqueta">{t('ajustes.comoTexto')}</p>
        </section>
        <p className={`${s.nota} ${s.secundario} um-micro`}>{t('ajustes.guardadoLocal')}</p>
      </main>
    </div>
  )
}

/** Fila con interruptor (role="switch"): el estado se anuncia y se ve por la posición, no solo por el color. */
function FilaInterruptor({ title, text, checked, onToggle }: { title: string; text: string; checked: boolean; onToggle: () => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className={s.fila} onClick={onToggle}>
      <span className={s.textos}>
        <span className="um-cuerpo-fuerte">{title}</span>
        <span className={`${s.secundario} um-etiqueta`}>{text}</span>
      </span>
      <span className={s.interruptor} aria-hidden="true" />
    </button>
  )
}
