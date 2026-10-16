import { useState, type ReactNode } from 'react'
import { Icono } from '../../componentes'
import { useT } from '../../i18n/useT'
import { placeForDestination, restorePlace, type RemovedPlace } from '../../perfil/almacen'
import { usePerfil } from '../../perfil/usePerfil'
import { AvisoHecho, HojaEditarLugar, HojaGuardarLugar } from './HojasLugar'
import { useAvisoTemporal } from './useAvisoTemporal'
import s from './Perfil.module.css'

type Notice = { kind: 'guardado' } | { kind: 'borrado'; removed: RemovedPlace }

/**
 * "Guardar" en el encabezado de la 06 (S1, Figma 144:2095). Si el destino ya está en Mis lugares se ve
 * "Guardado" (ícono relleno) y abre Editar lugar. Devuelve el botón, la hoja abierta y el aviso de
 * confirmación, para que la pantalla los ponga donde van.
 */
export function useGuardarLugar(destinationId: string | null, realName: string): {
  action: ReactNode
  sheet: ReactNode
  notice: ReactNode
} {
  const { t } = useT()
  const profile = usePerfil()
  const [open, setOpen] = useState(false)
  const [notice, setNotice] = useAvisoTemporal<Notice>()
  if (!destinationId) return { action: null, sheet: null, notice: null }
  const saved = placeForDestination(profile, destinationId)

  const action = (
    <button
      type="button"
      className={`${s.guardar} um-cuerpo-fuerte`}
      aria-haspopup="dialog"
      onClick={() => setOpen(true)}
    >
      <Icono name={saved ? 'guardado' : 'guardar'} />
      {saved ? t('guardarLugar.botonGuardado') : t('guardarLugar.boton')}
    </button>
  )

  let sheet: ReactNode = null
  if (open && saved) {
    sheet = (
      <HojaEditarLugar
        place={saved}
        detail={realName}
        onClose={() => setOpen(false)}
        onRemoved={(removed) => {
          setOpen(false)
          setNotice({ kind: 'borrado', removed })
        }}
      />
    )
  } else if (open) {
    sheet = (
      <HojaGuardarLugar
        destinationId={destinationId}
        realName={realName}
        onClose={() => setOpen(false)}
        onSaved={() => {
          setOpen(false)
          setNotice({ kind: 'guardado' })
        }}
      />
    )
  }

  const shown =
    notice?.kind === 'guardado' ? (
      <AvisoHecho icon="guardado" text={t('guardarLugar.hecho')} />
    ) : notice?.kind === 'borrado' ? (
      <AvisoHecho
        icon="guardar"
        text={t('editarLugar.borrado')}
        action={{
          label: t('editarLugar.deshacer'),
          onClick: () => {
            restorePlace(notice.removed)
            setNotice(null)
          },
        }}
      />
    ) : null

  return { action, sheet, notice: shown }
}
