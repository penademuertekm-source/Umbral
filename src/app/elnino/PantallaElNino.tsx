import { useNavigate } from 'react-router'
import { useClimaConfig } from '../../clima/useClima'
import { ContenidoElNino } from './ContenidoElNino'
import { markElNinoSeen } from './visto'

/** Ruta /el-nino: la pantalla 09 como página (por ejemplo, desde /guia). */
export function PantallaElNino() {
  const navigate = useNavigate()
  const config = useClimaConfig()
  return (
    <ContenidoElNino
      asPage
      config={config}
      onDone={() => {
        if (config?.elNino) markElNinoSeen()
        navigate('/mapa')
      }}
    />
  )
}
