import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { NoticeItem } from '../../../componentes'
import { readHeatProfile } from '../../../clima/configClima'
import { roundMinutes } from '../../../i18n/numeros'
import { useT } from '../../../i18n/useT'
import { tripDueNow } from '../../../perfil/almacen'
import { usePerfil } from '../../../perfil/usePerfil'
import type { MapData } from '../../../mapa/datos'
import { useGraph } from '../../rutas/useContextoRutas'
import { tripNames, useRutasSalidas } from './comun'
import { routeLink } from './enlaces'

/**
 * "Es hora de salir" (S2, Figma 148:2664): si la app se abre entre 15 min antes y 10 min después de una
 * salida guardada. Nivel Aviso con el ícono Reloj; "Ver la ruta" abre la 06. La app no avisa con la
 * pantalla apagada: para eso está el calendario. Se entrega como dato para mostrarlo en el mismo Aviso que
 * los demás avisos de la pantalla (G6).
 */
export function useAvisoSalida(data: MapData | null): NoticeItem | null {
  const { t, language } = useT()
  const navigate = useNavigate()
  const profile = usePerfil()
  const [now] = useState(() => new Date())
  const [heatProfile] = useState(readHeatProfile)
  const trip = tripDueNow(profile, now)
  // El grafo solo se arma si hay una salida cerca (para la duración de la ruta).
  const graph = useGraph(trip ? data : null)
  const routes = useRutasSalidas(graph, trip ? [trip] : [], data?.destinos, heatProfile)
  if (!trip) return null
  const route = routes?.get(trip.id)
  const { name } = tripNames(trip, profile, data?.destinos, language)
  return {
    id: `salida-${trip.id}`,
    level: 'aviso',
    icon: 'reloj',
    title: t('avisoSalida.titulo', { nombre: name }),
    detail: route ? t('avisoSalida.detalle', { min: roundMinutes(route.minutes) }) : t('avisoSalida.detalleSinRuta'),
    action: {
      label: t('avisoSalida.verRuta'),
      onClick: () => navigate(routeLink(trip.destinationId, new Date(trip.departure), trip.origin, false)),
    },
  }
}
