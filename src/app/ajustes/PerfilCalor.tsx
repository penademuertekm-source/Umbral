import { useState } from 'react'
import { Boton, Encabezado, Icono } from '../../componentes'
import { readHeatProfileOption, writeHeatProfileOption } from '../../clima/configClima'
import { HEAT_PROFILE_OPTIONS, PROFILE_OF_OPTION, type HeatProfileOption } from '../../config/reglas-semaforo'
import { useT } from '../../i18n/useT'
import { useVolver } from '../useVolver'
import s from './Ajustes.module.css'

// Pantalla 23 (nodo 35:121): perfil de calor. Las cuatro opciones sensibles aplican la misma regla (sube un
// nivel el semáforo y las rutas dan más peso a la sombra); se guarda solo la opción, en el teléfono.

export function PerfilCalor() {
  const { t } = useT()
  const volver = useVolver('/ajustes')
  const [choice, setChoice] = useState<HeatProfileOption>(readHeatProfileOption)
  const [justSaved, setJustSaved] = useState(false)

  return (
    <div className={s.pantalla}>
      <Encabezado title={t('pantallas.p23')} onBack={volver} />
      <main className={s.contenido}>
        <p className={`${s.intro} ${s.secundario} um-cuerpo`}>{t('perfil.intro')}</p>
        <fieldset className={s.opciones}>
          <legend className="sr-only">{t('pantallas.p23')}</legend>
          {HEAT_PROFILE_OPTIONS.map((option) => (
            <label key={option} className={s.opcion}>
              <input
                type="radio"
                name="perfil"
                value={option}
                checked={choice === option}
                onChange={() => {
                  setChoice(option)
                  setJustSaved(false)
                }}
              />
              <span className={s.textos}>
                <span className={`um-cuerpo ${choice === option ? s.elegida : ''}`}>{t(`perfil.opciones.${option}`)}</span>
                <span className={`${s.secundario} um-etiqueta`}>
                  {PROFILE_OF_OPTION[option] === 'estandar' ? t('perfil.general') : t('perfil.sensible')}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        <p className={`${s.privacidad} um-etiqueta`}>
          <Icono name="lugar" />
          {t('perfil.privacidad')}
        </p>
        <div className={s.acciones}>
          <p className={`${s.secundario} um-etiqueta`} role="status">
            {justSaved ? t('perfil.guardado') : ''}
          </p>
          <Boton
            onClick={() => {
              writeHeatProfileOption(choice)
              setJustSaved(true)
            }}
          >
            {t('perfil.guardar')}
          </Boton>
        </div>
      </main>
    </div>
  )
}
