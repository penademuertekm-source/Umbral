import { useState } from 'react'
import { BarraInferior, Boton, Encabezado, Icono, Modal } from '../../../componentes'
import { useT } from '../../../i18n/useT'
import { avoidedTotal, levelFor } from '../../../perfil/logros'
import { usePerfil } from '../../../perfil/usePerfil'
import { useVolver } from '../../useVolver'
import { Barra } from '../logros/Logros'
import p from '../Perfil.module.css'
import s from './Premios.module.css'
import { communityMinutes, usePremios, type SampleRewards } from './usePremios'

// Premios de ejemplo (S3, Figma 152:2838). Todo es SIMULADO (CLAUDE.md, regla 1): dice "Ejemplo ·
// simulación", la meta de la comunidad es un total de ejemplo fijo más lo que aportó esta persona, y los
// códigos UMB-EJEMPLO-#### no sirven en comercios reales.

export function Premios() {
  const { t } = useT()
  const volver = useVolver('/perfil/logros')
  const profile = usePerfil()
  const data = usePremios()
  const own = Math.round(avoidedTotal(profile))
  const level = levelFor(own).level
  const [code, setCode] = useState<SampleRewards['beneficios'][number] | null>(null)

  return (
    <div className={p.pantalla}>
      <Encabezado title={t('premios.titulo')} subtitle={t('premios.subtitulo')} onBack={volver} />
      <main className={p.contenido}>
        <p className={`${s.franja} um-etiqueta`}>
          <Icono name="informacion" size={20} />
          {t('premios.franja')}
        </p>
        {data === undefined && <p className="um-cuerpo">{t('premios.cargando')}</p>}
        {data && (
          <>
            <Meta data={data} own={own} />
            <h2 className={`${p.grupo} um-etiqueta`}>{t('premios.beneficios')}</h2>
            <ul className={s.beneficios}>
              {data.beneficios.map((benefit) => {
                const available = level >= benefit.nivel_minimo
                const missing = benefit.nivel_minimo - level
                return (
                  <li key={benefit.id} className={`${s.beneficio} ${available ? '' : s.bloqueado}`}>
                    <p className="um-cuerpo-fuerte">{t(`premios.ejemplo.${benefit.id}.titulo`)}</p>
                    <p className={`${p.secundario} um-etiqueta`}>{t(`premios.ejemplo.${benefit.id}.comercio`)}</p>
                    {available ? (
                      <>
                        <p className={`${s.disponible} um-etiqueta`}>{t('premios.disponible', { n: benefit.nivel_minimo })}</p>
                        <Boton variant="secundario" onClick={() => setCode(benefit)}>
                          {t('premios.verCodigo')}
                        </Boton>
                      </>
                    ) : (
                      <p className={`${p.secundario} um-etiqueta`}>
                        {t('premios.bloqueado', {
                          n: benefit.nivel_minimo,
                          faltan: missing === 1 ? t('premios.faltaUno') : t('premios.faltanVarios', { n: missing }),
                        })}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </main>
      <BarraInferior active="perfil" />
      <Modal
        sheet
        open={!!code}
        onClose={() => setCode(null)}
        title={t('premios.codigoTitulo')}
        actions={
          <Boton variant="secundario" onClick={() => setCode(null)}>
            {t('comun.cerrar')}
          </Boton>
        }
      >
        {code && (
          <>
            <p className={`${s.codigo} um-dato`}>{code.codigo}</p>
            <p className="um-cuerpo-fuerte">{t('premios.codigoNota')}</p>
          </>
        )}
      </Modal>
    </div>
  )
}

/** "Un árbol para el centro": barra con el total de ejemplo más lo que aportó esta persona. */
function Meta({ data, own }: { data: SampleRewards; own: number }) {
  const { t } = useT()
  const total = communityMinutes(data, own)
  const goal = data.meta_comunidad.meta_horas
  const hours = Math.min(goal, Math.floor(total / 60))
  return (
    <section className={s.meta} aria-labelledby="meta-comunidad">
      <div className={s.metaTitulo}>
        <span className={p.icono} aria-hidden="true">
          <Icono name="mango" />
        </span>
        <h2 id="meta-comunidad" className="um-cuerpo-fuerte">
          {t('premios.ejemplo.arbol.nombre')}
        </h2>
      </div>
      <p className={`${p.secundario} um-etiqueta`}>{t('premios.ejemplo.arbol.texto')}</p>
      <Barra fraction={hours / goal} />
      <p className="um-etiqueta">{t('premios.metaAvance', { h: hours, meta: goal, min: own })}</p>
    </section>
  )
}
