import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Boton, Icono, Modal, type IconName } from '../../componentes'
import type { TranslationKey } from '../../i18n/traducir'
import { useT } from '../../i18n/useT'
import {
  addPlace,
  MAX_NAME_LENGTH,
  MAX_PLACES,
  readProfile,
  removePlace,
  renamePlace,
  type RemovedPlace,
  type SavedPlace,
} from '../../perfil/almacen'
import s from './Perfil.module.css'

// Hojas de S1: "Guardar este lugar" (Figma 144:2213) y "Editar lugar" (144:2679), más el aviso recogido
// que confirma lo hecho ("Guardado en Mis lugares", "Lugar borrado · Deshacer").

const QUICK_NAMES: TranslationKey[] = ['guardarLugar.casa', 'guardarLugar.trabajo', 'guardarLugar.estudio']

interface HojaGuardarProps {
  destinationId: string
  /** Nombre real del destino: viene escrito en el campo. */
  realName: string
  onClose: () => void
  onSaved: (place: SavedPlace) => void
}

/** "Guardar este lugar": nombre con el nombre real ya escrito y chips Casa · Trabajo · Estudio que lo llenan. */
export function HojaGuardarLugar({ destinationId, realName, onClose, onSaved }: HojaGuardarProps) {
  const { t } = useT()
  const navigate = useNavigate()
  const [name, setName] = useState(realName)
  const [error, setError] = useState(false)
  const full = readProfile().places.length >= MAX_PLACES

  if (full) {
    return (
      <Modal
        sheet
        open
        onClose={onClose}
        title={t('guardarLugar.titulo')}
        actions={
          <>
            <Boton onClick={() => navigate('/perfil/lugares')}>{t('guardarLugar.irAMisLugares')}</Boton>
            <Boton variant="secundario" onClick={onClose}>
              {t('comun.cancelar')}
            </Boton>
          </>
        }
      >
        <p>{t('guardarLugar.limite', { n: MAX_PLACES })}</p>
      </Modal>
    )
  }

  return (
    <Modal
      sheet
      open
      onClose={onClose}
      title={t('guardarLugar.titulo')}
      actions={
        <>
          <Boton type="submit" form="form-guardar-lugar">
            {t('comun.guardar')}
          </Boton>
          <Boton variant="secundario" onClick={onClose}>
            {t('comun.cancelar')}
          </Boton>
        </>
      }
    >
      <form
        id="form-guardar-lugar"
        className={s.formulario}
        onSubmit={(event) => {
          event.preventDefault()
          const result = addPlace(name, destinationId)
          if (result.ok) onSaved(result.place)
          else if (result.reason === 'sin_nombre') setError(true)
        }}
      >
        <CampoNombre value={name} onChange={setName} error={error} />
        <div className={s.chips} role="group" aria-label={t('guardarLugar.sugerencias')}>
          {QUICK_NAMES.map((key) => (
            <button key={key} type="button" className={s.chipToque} onClick={() => setName(t(key))}>
              <span className={`${s.chip} um-etiqueta`}>{t(key)}</span>
            </button>
          ))}
        </div>
        <p className={`${s.secundario} um-etiqueta`}>{t('guardarLugar.nota')}</p>
      </form>
    </Modal>
  )
}

interface HojaEditarProps {
  place: SavedPlace
  /** Nombre real del destino y su distancia, si se conoce ("Plaza Alfonso López · 453 m"). */
  detail: string
  onClose: () => void
  onRemoved: (removed: RemovedPlace) => void
}

/** "Editar lugar": cambiar el nombre o borrarlo. Borrar no pregunta: se puede deshacer unos segundos. */
export function HojaEditarLugar({ place, detail, onClose, onRemoved }: HojaEditarProps) {
  const { t } = useT()
  const [name, setName] = useState(place.name)
  const [error, setError] = useState(false)
  return (
    <Modal
      sheet
      open
      onClose={onClose}
      title={t('editarLugar.titulo')}
      actions={
        <>
          <Boton type="submit" form="form-editar-lugar">
            {t('editarLugar.guardarCambios')}
          </Boton>
          <Boton
            variant="advertencia"
            onClick={() => {
              const removed = removePlace(place.id)
              if (removed) onRemoved(removed)
              else onClose()
            }}
          >
            {t('editarLugar.borrar')}
          </Boton>
        </>
      }
    >
      <form
        id="form-editar-lugar"
        className={s.formulario}
        onSubmit={(event) => {
          event.preventDefault()
          if (renamePlace(place.id, name)) onClose()
          else setError(true)
        }}
      >
        <CampoNombre value={name} onChange={setName} error={error} />
        {detail && <p className={`${s.secundario} um-etiqueta`}>{detail}</p>}
      </form>
    </Modal>
  )
}

function CampoNombre({ value, onChange, error }: { value: string; onChange: (value: string) => void; error: boolean }) {
  const { t } = useT()
  return (
    <label className={s.etiquetaCampo}>
      <span className={`${s.secundario} um-etiqueta`}>{t('guardarLugar.campo')}</span>
      <input
        className={`${s.campo} um-cuerpo`}
        value={value}
        maxLength={MAX_NAME_LENGTH}
        aria-invalid={error || undefined}
        aria-describedby={error ? 'nombre-lugar-error' : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && (
        <span id="nombre-lugar-error" className={`${s.error} um-etiqueta`}>
          {t('guardarLugar.sinNombre')}
        </span>
      )}
    </label>
  )
}

interface AvisoHechoProps {
  text: string
  icon: IconName
  /** "Deshacer" u otra acción junto al texto. */
  action?: { label: string; onClick: () => void }
}

/**
 * Aviso recogido (G6) que confirma lo que se acaba de hacer, en forma de chip. Se anuncia con role="status".
 * El nivel es Cómodo: es una confirmación, no un problema.
 */
export function AvisoHecho({ text, icon, action }: AvisoHechoProps) {
  return (
    <div className={s.avisoHecho} role="status">
      <span className={`${s.avisoTexto} um-etiqueta`}>
        <Icono name={icon} size={20} />
        {text}
      </span>
      {action && (
        <button type="button" className={`${s.avisoAccion} um-etiqueta`} onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  )
}
