import { useState } from 'react'
import { BarraInferior, Encabezado, Icono } from '../../../componentes'
import { ACHIEVEMENTS, LEVELS } from '../../../config/logros'
import { useT } from '../../../i18n/useT'
import {
  avoidedThisWeek,
  avoidedTotal,
  challengeProgress,
  earnedAchievements,
  levelFor,
  weeklyChallenges,
} from '../../../perfil/logros'
import { usePerfil } from '../../../perfil/usePerfil'
import { useVolver } from '../../useVolver'
import p from '../Perfil.module.css'
import s from './Logros.module.css'
import { ACHIEVEMENT_ICON, CHALLENGE_ICON, challengeText } from './textos'

// Logros (S3, Figma 150:2601): sol evitado de la semana, nivel, retos y logros. Colecciones y premios llegan
// en el paso P3b. Todo sale de lo guardado en el teléfono; nada premia distancia ni salir entre 11 y 3.

export function Logros() {
  const i18n = useT()
  const { t } = i18n
  const volver = useVolver('/perfil')
  const profile = usePerfil()
  const [now] = useState(() => new Date())
  const week = Math.round(avoidedThisWeek(profile, now))
  const total = Math.round(avoidedTotal(profile))
  const level = levelFor(total)
  const challenges = weeklyChallenges(now).map((c) => challengeProgress(c, profile, now))
  const earned = earnedAchievements(profile)
  const simulated = profile.arrivals.filter((a) => a.simulated).length

  return (
    <div className={p.pantalla}>
      <Encabezado title={t('logros.titulo')} subtitle={t('logros.subtitulo')} onBack={volver} />
      <main className={p.contenido}>
        <section className={s.tarjeta} aria-labelledby="sol-semana">
          <h2 id="sol-semana" className={`${p.secundario} um-etiqueta`}>
            {t('logros.semana')}
          </h2>
          <p className={`${s.cifra} um-dato`}>{t('logros.minutos', { n: week })}</p>
          <p className={`${p.secundario} um-etiqueta`}>{t('logros.total', { n: total })}</p>
          <p className={`${s.nivel} um-cuerpo-fuerte`}>
            {t('logros.nivel', { n: level.level, nombre: t(`logros.niveles.n${level.level as 1 | 2 | 3 | 4 | 5}`) })}
          </p>
          <Barra fraction={level.fraction} />
          <p className={`${p.secundario} um-etiqueta`}>
            {level.toNext === null
              ? t('logros.maximo')
              : t('logros.faltan', { n: level.toNext, siguiente: Math.min(level.level + 1, LEVELS.length) })}
          </p>
          {simulated > 0 && (
            <p className={`${p.secundario} um-etiqueta`}>
              {simulated === 1 ? t('logros.simuladaUna') : t('logros.simuladas', { n: simulated })}
            </p>
          )}
        </section>

        <h2 className={`${p.grupo} um-etiqueta`}>{t('logros.retosTitulo')}</h2>
        <ul className={p.tarjeta}>
          {challenges.map(({ challenge, value, done }) => (
            <li key={challenge.id} className={`${s.reto} ${done ? s.hecho : ''}`}>
              <span className={s.iconoReto} aria-hidden="true">
                <Icono name={CHALLENGE_ICON[challenge.kind]} />
              </span>
              <span className={p.textos}>
                <span className="um-cuerpo">{challengeText(i18n, challenge)}</span>
                <span className={`${done ? s.textoHecho : p.secundario} um-etiqueta`}>
                  {done
                    ? t('logros.hecho')
                    : challenge.target > 1
                      ? t('logros.avance', { v: value, t: challenge.target })
                      : t('logros.todavia')}
                </span>
                {!done && challenge.target > 1 && <Barra fraction={value / challenge.target} />}
              </span>
            </li>
          ))}
        </ul>
        <p className={`${p.secundario} um-etiqueta`}>{t('logros.retosNota')}</p>

        <h2 className={`${p.grupo} um-etiqueta`}>{t('logros.colecciones')}</h2>
        <div className={s.colecciones}>
          {(['logros.pasaporte', 'logros.album'] as const).map((key) => (
            <div key={key} className={s.coleccion}>
              <span className="um-cuerpo-fuerte">{t(key)}</span>
              <span className={`${p.secundario} um-etiqueta`}>{t('logros.proximamente')}</span>
            </div>
          ))}
        </div>

        <h2 className={`${p.grupo} um-etiqueta`}>{t('logros.cuenta', { n: earned.size, total: ACHIEVEMENTS.length })}</h2>
        <ul className={s.insignias}>
          {ACHIEVEMENTS.map(({ id }) => {
            const got = earned.has(id)
            return (
              <li key={id} className={s.insignia}>
                <span className={`${s.circulo} ${got ? s.conseguida : s.pendiente}`} aria-hidden="true">
                  <Icono name={ACHIEVEMENT_ICON[id]} />
                </span>
                <span className={`${got ? '' : p.secundario} um-etiqueta`}>{t(`logros.insignias.${id}`)}</span>
                <span className="sr-only">{got ? t('logros.conseguido') : t('logros.porConseguir')}</span>
              </li>
            )
          })}
        </ul>

        <h2 className={`${p.grupo} um-etiqueta`}>{t('logros.premios')}</h2>
        <ul className={p.tarjeta}>
          {(['logros.beneficios', 'logros.meta'] as const).map((key) => (
            <li key={key}>
              <div className={`${p.fila} ${p.inactiva}`}>
                <span className={p.textos}>
                  <span className="um-cuerpo">{t(key)}</span>
                  <span className={`${p.secundario} um-etiqueta`}>{t('logros.proximamente')}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
        <p className={`${p.nota} um-etiqueta`}>{t('logros.estimado')}</p>
      </main>
      <BarraInferior active="perfil" />
    </div>
  )
}

/** Barra de avance (decorativa: el número va en el texto de al lado). */
export function Barra({ fraction }: { fraction: number }) {
  return (
    <span className={s.barra} aria-hidden="true">
      <span className={s.relleno} style={{ width: `${Math.round(Math.min(1, Math.max(0, fraction)) * 100)}%` }} />
    </span>
  )
}
