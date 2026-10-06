import { BarraSuperior, Encabezado } from '../../componentes'
import { generalLevel, type HeatLevel } from '../../config/reglas-semaforo'
import { useT } from '../../i18n/useT'
import { formatTime, localDate } from '../../sombra/tiempo'
import { SimuladorSemaforo } from '../guia/SimuladorSemaforo'
import { useVolver } from '../useVolver'
import s from './ReferenciaSemaforo.module.css'

// Pantalla 17 (nodo 32:154): referencia de los cuatro niveles de la barra superior, con los valores de
// ejemplo de Figma. El nivel de cada tarjeta lo calculan las reglas de la app (src/config/reglas-semaforo.ts).

const EXAMPLES: { hour: number; minute: number; sun: number; shade: number; level: HeatLevel }[] = [
  { hour: 7, minute: 20, sun: 29, shade: 26, level: 'comodo' },
  { hour: 9, minute: 40, sun: 35, shade: 31, level: 'precaucion' },
  { hour: 11, minute: 47, sun: 41, shade: 35, level: 'evitar' },
  { hour: 13, minute: 15, sun: 47, shade: 38, level: 'no_recomendado' },
]

export function ReferenciaSemaforo() {
  const { t, language } = useT()
  const volver = useVolver()
  return (
    <>
      <Encabezado title={t('pantallas.p17')} onBack={volver} />
      <main className={s.contenido}>
        <section className={s.seccion}>
          <h2 className="um-subtitulo">{t('referencia.titulo')}</h2>
          <p className={`${s.secundario} um-cuerpo`}>{t('referencia.texto')}</p>
          <ul className={s.tarjetas}>
            {EXAMPLES.map(({ hour, minute, sun, shade, level }) => {
              const decision = generalLevel({
                utciSun: sun,
                utciShade: shade,
                cloudCover: null,
                elNino: false,
                profile: 'estandar',
              })
              return (
                <li key={level} className={s.ejemplo}>
                  <div className={s.tarjeta}>
                    <BarraSuperior
                      time={formatTime(localDate(2026, 8, 15, hour, minute), language)}
                      level={decision.level}
                      utciSun={sun}
                      utciShade={shade}
                    />
                  </div>
                  <p className={`${s.secundario} um-etiqueta`}>{t(`referencia.niveles.${level}`)}</p>
                </li>
              )
            })}
          </ul>
          <p className={`${s.secundario} um-etiqueta`}>{t('referencia.nota')}</p>
          <p className={`${s.secundario} um-micro`}>{t('referencia.ejemplo')}</p>
        </section>
        <section className={s.seccion}>
          <h2 className="um-subtitulo">{t('guia.simulador.titulo')}</h2>
          <p className={`${s.secundario} um-etiqueta`}>{t('guia.simulador.texto')}</p>
          <SimuladorSemaforo />
        </section>
      </main>
    </>
  )
}
