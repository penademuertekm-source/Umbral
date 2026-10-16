import { BarraInferior, Encabezado, Icono } from '../../../componentes'
import { CARDS } from '../../../config/logros'
import { useT } from '../../../i18n/useT'
import { earnedCards } from '../../../perfil/colecciones'
import { usePerfil } from '../../../perfil/usePerfil'
import { useVolver } from '../../useVolver'
import p from '../Perfil.module.css'
import s from './Colecciones.module.css'
import { CARD_ICON } from './comun'

// Álbum de la sombra (S3, Figma 151:2844). Láminas provisionales con los íconos, hasta que lleguen las
// ilustraciones de design/ilustraciones/laminas/. La regla para ganarlas es aproximada (src/perfil/colecciones.ts).

export function Album() {
  const { t } = useT()
  const volver = useVolver('/perfil/logros')
  const profile = usePerfil()
  const cards = earnedCards(profile)

  return (
    <div className={p.pantalla}>
      <Encabezado
        title={t('album.titulo')}
        subtitle={t('album.cuenta', { n: cards.size, total: CARDS.length })}
        onBack={volver}
      />
      <main className={p.contenido}>
        <p className={`${p.secundario} um-etiqueta`}>{t('album.intro')}</p>
        <ul className={s.rejilla}>
          {CARDS.map((card) => {
            const got = cards.has(card)
            return (
              <li key={card} className={`${s.lamina} ${got ? s.laminaGanada : ''} ${s[card] ?? ''}`}>
                <span className={s.ilustracion} aria-hidden="true">
                  <Icono name={CARD_ICON[card]} size={40} />
                </span>
                <span className={s.laminaTextos}>
                  <span className={`${got ? '' : s.secundario} um-cuerpo-fuerte`}>{t(`album.laminas.${card}.nombre`)}</span>
                  <span className={`${s.secundario} um-etiqueta`}>
                    {got ? t(`album.laminas.${card}.texto`) : t('album.porDescubrir')}
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
        <p className={`${p.nota} um-etiqueta`}>{t('album.aproximado')}</p>
      </main>
      <BarraInferior active="perfil" />
    </div>
  )
}
