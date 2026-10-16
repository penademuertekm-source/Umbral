import { useState } from 'react'
import { Boton, Modal } from '../../componentes'
import { useT } from '../../i18n/useT'
import { MAX_NAME_LENGTH, setName } from '../../perfil/almacen'
import s from './Perfil.module.css'

/** Hoja para poner o cambiar el nombre del saludo (opcional; vacío lo quita). */
export function HojaNombre({ open, current, onClose }: { open: boolean; current: string; onClose: () => void }) {
  const { t } = useT()
  const [value, setValue] = useState(current)
  return (
    <Modal
      sheet
      open={open}
      onClose={onClose}
      title={t('nombre.titulo')}
      actions={
        <>
          <Boton type="submit" form="form-nombre">
            {t('comun.guardar')}
          </Boton>
          <Boton variant="secundario" onClick={onClose}>
            {t('comun.cancelar')}
          </Boton>
        </>
      }
    >
      <form
        id="form-nombre"
        className={s.formulario}
        onSubmit={(event) => {
          event.preventDefault()
          setName(value)
          onClose()
        }}
      >
        <label className={s.etiquetaCampo}>
          <span className={`${s.secundario} um-etiqueta`}>{t('nombre.campo')}</span>
          <input
            className={`${s.campo} um-cuerpo`}
            value={value}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="given-name"
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
        <p className={`${s.secundario} um-etiqueta`}>{t('nombre.nota')}</p>
      </form>
    </Modal>
  )
}
