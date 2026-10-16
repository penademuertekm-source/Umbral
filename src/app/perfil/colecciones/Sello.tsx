import { Icono, type IconName } from '../../../componentes'
import s from './Colecciones.module.css'

/**
 * Sello provisional hecho con el ícono del lugar (Figma 151:2661), hasta que lleguen las ilustraciones de
 * design/ilustraciones/sellos/. Conseguido: aro verde y aro interior punteado cañaguate. Por conseguir: aro
 * punteado gris. Decorativo: el nombre y el estado van en texto al lado.
 */
export function Sello({ icon, earned, size = 96 }: { icon: IconName; earned: boolean; size?: number }) {
  return (
    <span
      className={`${s.sello} ${earned ? s.selloGanado : s.selloPendiente}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <span className={s.selloInterior}>
        <Icono name={icon} size={Math.round(size * 0.3)} />
      </span>
    </span>
  )
}
