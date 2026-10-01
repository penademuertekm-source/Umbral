import { useEffect, useId, useMemo, useState } from 'react'
import { HojaInferior, Icono } from '../../componentes'
import { laHora } from '../../i18n/hora'
import { useT } from '../../i18n/useT'
import type { MapData, Species } from '../../mapa/datos'
import { protectedSide, segmentName, type EdgeIndex, type TreeCounts } from '../../mapa/tramos'
import type { ResultadoSombra } from '../../sombra/cliente'
import type { ShadeUntil, SideLetter, SideState } from '../../sombra/modelo'
import { motorSombra } from '../../sombra/cliente'
import niveles from '../../estilos/niveles.module.css'
import s from './FichaTramo.module.css'

// Pantalla 07 (nodo 5:2): ficha del tramo tocado en el mapa. Todos los valores son estimados
// para la hora del deslizador; el UTCI llega en la Fase 5.

interface FichaTramoProps {
  edge: number
  data: MapData
  index: EdgeIndex
  trees: Map<number, TreeCounts>
  resultado: ResultadoSombra
  onClose: () => void
}

interface Extra {
  key: string
  until: ShadeUntil | null
  svf: number
  /** Estado del lado sin hojas en los cañaguates (temporada seca), si aplica. */
  dry?: SideState
}

/** Color de la píldora: verde con sombra plena, ámbar expuesto y neutro en los demás casos. */
const PILL_LEVEL: Record<SideState, 'comodo' | 'precaucion' | 'nublado'> = {
  sombra: 'comodo',
  parcial: 'nublado',
  expuesto: 'precaucion',
  sin_sol: 'nublado',
}

const SPECIES: Species[] = ['mango', 'canaguate', 'otro']

export function FichaTramo({ edge, data, index, trees, resultado, onClose }: FichaTramoProps) {
  const i18n = useT()
  const { t, language } = i18n
  const explanationId = useId()
  const [explanationOpen, setExplanationOpen] = useState(false)
  const [extra, setExtra] = useState<Extra | null>(null)
  const time = useMemo(() => new Date(resultado.time), [resultado.time])

  const edgeProps = data.red.features.find((f) => f.properties.id === edge)?.properties
  const shadeA = resultado.lado(edge, 'a')
  const shadeB = resultado.lado(edge, 'b')
  const protectedOne = protectedSide(shadeA?.fraction, shadeB?.fraction)
  // Lado que describe la píldora y el SVF: el protegido o, si no hay uno, el de más sombra.
  const side: SideLetter =
    protectedOne === 'a' || protectedOne === 'b'
      ? protectedOne
      : !shadeA || (shadeB && shadeB.fraction > shadeA.fraction)
        ? 'b'
        : 'a'
  const shade = side === 'a' ? shadeA : shadeB
  const orientation = (letter: SideLetter) => {
    const value = edgeProps?.lados.find((l) => l.lado === letter)?.orientacion
    return value ? t(`ficha.orientaciones.${value}`) : ''
  }
  const counts = trees.get(edge)
  const hasCanaguates = (counts?.canaguate ?? 0) > 0
  const key = `${edge}|${side}|${resultado.time}`

  useEffect(() => {
    if (!shade) return
    let vigente = true
    Promise.all([
      shade.state === 'sombra' ? motorSombra.sombraHasta(edge, side, time) : Promise.resolve(null),
      motorSombra.svf(edge, side),
      hasCanaguates && resultado.deciduousActive
        ? motorSombra.calcular(time, { season: 'seca' }).then((r) => r.lado(edge, side)?.state)
        : Promise.resolve(undefined),
    ])
      .then(([until, svf, dry]) => {
        if (vigente) setExtra({ key, until, svf, dry })
      })
      .catch(() => undefined)
    return () => {
      vigente = false
    }
  }, [key, edge, side, time, shade, hasCanaguates, resultado.deciduousActive])

  const current = extra?.key === key ? extra : null

  const name = segmentName(edge, index)
  const [a, b] = name.crossings
  const title = !name.street
    ? t('ficha.sinNombre')
    : b
      ? t('ficha.entre', { calle: name.street, a, b })
      : a
        ? t('ficha.esquina', { calle: name.street, a })
        : name.street

  let pill = ''
  if (shade?.state === 'sombra') {
    pill = !current
      ? t('tramo.sombra')
      : current.until?.untilSunset
        ? t('ficha.hastaAtardecer')
        : t('ficha.hasta', { laHora: laHora(i18n, new Date(current.until?.until ?? time)) })
  } else if (shade?.state === 'parcial') pill = t('ficha.parcialAhora')
  else if (shade?.state === 'expuesto') pill = t('ficha.expuestoAhora')
  else if (shade?.state === 'sin_sol') pill = t('ficha.sinSolAhora')

  const protectedText =
    protectedOne === 'ambas'
      ? t('ficha.ambas')
      : protectedOne === 'ninguna'
        ? t('ficha.ninguna')
        : t('ficha.costado', { orientacion: orientation(protectedOne) })

  const svfText = current
    ? new Intl.NumberFormat(language === 'es' ? 'es-CO' : 'en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(current.svf)
    : t('comun.sinDato')

  const treeParts = SPECIES.filter((sp) => (counts?.[sp] ?? 0) > 0).map((sp) => {
    const n = counts?.[sp] ?? 0
    return t(n === 1 ? `ficha.especies.${sp}.uno` : `ficha.especies.${sp}.varios`, { n })
  })
  const treeText = treeParts.length
    ? new Intl.ListFormat(language === 'es' ? 'es' : 'en', { type: 'conjunction' }).format(treeParts)
    : t('ficha.sinArboles')

  let phenology = ''
  if (hasCanaguates) {
    if (!resultado.deciduousActive) phenology = t('ficha.fenologiaSinHojas')
    else if (current?.dry && shade && current.dry !== shade.state) {
      phenology = t('ficha.fenologiaCambia', { estado: t(`ficha.estadoMinuscula.${current.dry}`) })
    } else if (current) phenology = t('ficha.fenologiaIgual')
  }

  return (
    <HojaInferior open onClose={onClose} title={title}>
      <p className={`${s.estimado} um-etiqueta`}>{t('ficha.estimadoA', { laHora: laHora(i18n, time) })}</p>
      {shade && <p className={`${s.pildora} ${niveles[PILL_LEVEL[shade.state]]} um-etiqueta`}>{pill}</p>}
      <dl className={s.filas}>
        <div className={s.fila}>
          <dt className="um-etiqueta">{t('ficha.aceraProtegida')}</dt>
          <dd className={`${s.valor} um-etiqueta`}>{protectedText}</dd>
        </div>
        <div className={s.fila}>
          <dt className="um-etiqueta">{t('ficha.svf')}</dt>
          <dd>
            <button
              type="button"
              className={`${s.desplegar} um-etiqueta`}
              aria-expanded={explanationOpen}
              aria-controls={explanationId}
              onClick={() => setExplanationOpen((open) => !open)}
            >
              <span className={s.valor}>{svfText}</span>
              <span className={s.flecha} data-abierto={explanationOpen} aria-hidden="true">
                <Icono name="avanzar" size={20} />
              </span>
            </button>
          </dd>
          <dd id={explanationId} className={`${s.explicacion} um-etiqueta`} hidden={!explanationOpen}>
            {t('ficha.svfExplicacion', { orientacion: orientation(side) })}
          </dd>
        </div>
        <div className={s.fila}>
          <dt className="um-etiqueta">{t('ficha.utci')}</dt>
          <dd className={`${s.valor} um-etiqueta`}>{t('ficha.utciPendiente')}</dd>
        </div>
        <div className={s.fila}>
          <dt className="um-etiqueta">{t('ficha.arbolado')}</dt>
          <dd className={`${s.valor} um-etiqueta`}>{treeText}</dd>
        </div>
      </dl>
      {phenology && <p className={`${s.nota} ${niveles.precaucion} um-etiqueta`}>{phenology}</p>}
    </HojaInferior>
  )
}
