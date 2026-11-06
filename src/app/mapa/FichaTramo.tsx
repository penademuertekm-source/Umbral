import { useEffect, useId, useMemo, useState } from 'react'
import type { UtciEstimate } from '../../clima/utci'
import { HojaInferior, Icono, MuestraTramo } from '../../componentes'
import niveles from '../../estilos/niveles.module.css'
import { laHora } from '../../i18n/hora'
import { useT } from '../../i18n/useT'
import { sideReferences, type SideReference } from '../../mapa/andenes'
import type { MapData, Species } from '../../mapa/datos'
import { blockTitle, protectedSide, segmentName, type EdgeIndex, type TreeCounts } from '../../mapa/tramos'
import type { ResultadoSombra } from '../../sombra/cliente'
import { motorSombra } from '../../sombra/cliente'
import type { ShadeUntil, SideLetter, SideShade, SideState } from '../../sombra/modelo'
import s from './FichaTramo.module.css'

// Ficha de la cuadra (07-1 y 07-2, Figma 113:329): sale en la hoja media del mapa al tocar un andén. Todos
// los valores son estimados para la hora elegida (el chip "Estimado" del mapa lo dice). La sensación
// térmica es la general del centro a esa hora.

interface FichaTramoProps {
  edge: number
  data: MapData
  index: EdgeIndex
  trees: Map<number, TreeCounts>
  resultado: ResultadoSombra
  /** Sensación térmica (UTCI) estimada a la sombra y al sol a la misma hora, o null si no hay clima. */
  utci: UtciEstimate | null
  onClose: () => void
}

interface Extra {
  key: string
  until: ShadeUntil | null
  svf: number
  /** Estado del andén sin hojas en los cañaguates (temporada seca), si aplica. */
  dry?: SideState
}

const SPECIES: Species[] = ['mango', 'canaguate', 'otro']
const SIDES: SideLetter[] = ['a', 'b']

export function FichaTramo({ edge, data, index, trees, resultado, utci, onClose }: FichaTramoProps) {
  const i18n = useT()
  const { t, language } = i18n
  const detailsId = useId()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [extra, setExtra] = useState<Extra | null>(null)
  const time = useMemo(() => new Date(resultado.time), [resultado.time])

  const shades: Partial<Record<SideLetter, SideShade>> = { a: resultado.lado(edge, 'a'), b: resultado.lado(edge, 'b') }
  const protectedOne = protectedSide(shades.a?.fraction, shades.b?.fraction)
  // El andén que da el estado general y el SVF: el protegido o, si no hay uno, el de más sombra.
  const side: SideLetter =
    protectedOne === 'a' || protectedOne === 'b'
      ? protectedOne
      : !shades.a || (shades.b && shades.b.fraction > shades.a.fraction)
        ? 'b'
        : 'a'
  const shade = shades[side]
  const counts = trees.get(edge)
  const hasCanaguates = (counts?.canaguate ?? 0) > 0
  const key = `${edge}|${side}|${resultado.time}`
  const refs = useMemo(() => sideReferences(edge, data), [edge, data])

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

  // 07-1: el título es la calle; sin nombre, las calles de sus esquinas. Debajo, la referencia.
  const named = blockTitle(segmentName(edge, index))
  const title =
    named.kind === 'calle'
      ? named.street
      : named.kind === 'entre'
        ? t('ficha.cuadraEntre', { a: named.a, b: named.b })
        : named.kind === 'junto'
          ? t('ficha.cuadraJunto', { a: named.a })
          : t('ficha.sinNombre')
  const space = Object.values(refs).find((ref) => ref.kind === 'espacio')
  const reference = [
    named.kind === 'calle' && named.a && named.b ? t('ficha.refEntre', { a: named.a, b: named.b }) : '',
    named.kind === 'calle' && named.a && !named.b ? t('ficha.refCon', { a: named.a }) : '',
    space?.kind === 'espacio' ? t(space.space === 'plaza' ? 'ficha.frentePlaza' : 'ficha.frenteParque') : '',
  ]
    .filter(Boolean)
    .join(' · ')

  // Estado general: con sombra plena, hasta cuándo dura; si no, el estado a la hora elegida.
  let general = ''
  if (shade?.state === 'sombra') {
    general = !current
      ? t('ficha.estadoA', { estado: t('ficha.estado.sombra'), laHora: laHora(i18n, time) })
      : current.until?.untilSunset
        ? t('ficha.hastaAtardecer')
        : t('ficha.hasta', { laHora: laHora(i18n, new Date(current.until?.until ?? time)) })
  } else if (shade?.state === 'sin_sol') general = t('ficha.sinSolAhora')
  else if (shade) general = t('ficha.estadoA', { estado: t(`ficha.estado.${shade.state}`), laHora: laHora(i18n, time) })

  const sideName = (ref: SideReference | undefined, letter: SideLetter): string => {
    if (!ref) return t('ficha.andenCostado', { orientacion: orientationOf(letter) })
    switch (ref.kind) {
      case 'espacio':
        return t(ref.space === 'plaza' ? 'ficha.andenPlaza' : 'ficha.andenParque')
      case 'enfrente':
        return t('ficha.andenEnfrente')
      case 'calle':
        return t('ficha.andenCalle', { calle: ref.street })
      case 'costado':
        return t('ficha.andenCostado', { orientacion: t(`ficha.orientaciones.${ref.orientation}`) })
    }
  }
  function orientationOf(letter: SideLetter): string {
    const value = data.red.features.find((f) => f.properties.id === edge)?.properties.lados.find((l) => l.lado === letter)?.orientacion
    return value ? t(`ficha.orientaciones.${value}`) : ''
  }
  // Orden: el andén junto a la plaza o el de más sombra primero (Figma 113:329).
  const ordered = SIDES.filter((letter) => shades[letter]).sort((x, y) => {
    const first = (letter: SideLetter) => (refs[letter]?.kind === 'espacio' ? 2 : letter === side ? 1 : 0)
    return first(y) - first(x)
  })
  const percent = new Intl.NumberFormat(language === 'es' ? 'es-CO' : 'en-US', { maximumFractionDigits: 0 })

  const svfText = current
    ? new Intl.NumberFormat(language === 'es' ? 'es-CO' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(current.svf)
    : t('comun.sinDato')

  const treeParts = SPECIES.filter((sp) => (counts?.[sp] ?? 0) > 0).map((sp) => {
    const n = counts?.[sp] ?? 0
    return t(n === 1 ? `ficha.especies.${sp}.uno` : `ficha.especies.${sp}.varios`, { n })
  })
  const treeText = treeParts.length
    ? t('ficha.arbolesEnCuadra', { lista: new Intl.ListFormat(language === 'es' ? 'es' : 'en', { type: 'conjunction' }).format(treeParts) })
    : t('ficha.sinArboles')

  let phenology = ''
  if (hasCanaguates) {
    if (!resultado.deciduousActive) phenology = t('ficha.fenologiaSinHojas')
    else if (current?.dry && shade && current.dry !== shade.state) {
      phenology = t('ficha.fenologiaCambia', { estado: t(`ficha.estadoMinuscula.${current.dry}`) })
    } else if (current) phenology = t('ficha.fenologiaIgual')
  }

  const degrees = (value: number) => t('comun.grados', { valor: Math.round(value) })
  const bestName = sideName(refs[side], side)

  return (
    <HojaInferior open embedded height="media" onClose={onClose} title={title}>
      <div className={s.ficha}>
        {reference && <p className={`${s.secundario} ${s.referencia} um-etiqueta`}>{reference}</p>}

        {shade && (
          <p className={`${s.estado} um-cuerpo-fuerte`}>
            {shade.state !== 'sin_sol' && <MuestraTramo state={shade.state} label={null} size="compacta" />}
            {general}
          </p>
        )}

        {ordered.length > 0 && (
          <ul className={s.andenes}>
            {ordered.map((letter) => {
              const sideShade = shades[letter]!
              const best = protectedOne === letter
              return (
                <li key={letter} className={s.anden}>
                  {sideShade.state !== 'sin_sol' && <MuestraTramo state={sideShade.state} label={null} size="compacta" />}
                  <span className={s.andenTextos}>
                    <span className="um-cuerpo">{sideName(refs[letter], letter)}</span>
                    <span className={`${s.secundario} um-etiqueta`}>
                      {sideShade.state === 'sin_sol'
                        ? t('ficha.sinSolAhora')
                        : t('ficha.andenEstado', { estado: t(`ficha.estado.${sideShade.state}`), p: percent.format(sideShade.fraction * 100) })}
                    </span>
                  </span>
                  {best && <span className={`${s.mejor} ${niveles.comodo} um-etiqueta`}>{t('ficha.mejor')}</span>}
                </li>
              )
            })}
          </ul>
        )}

        <p className={`${s.secundario} um-etiqueta`}>
          {utci
            ? t('ficha.sensacion', { sombra: degrees(utci.shade), sol: degrees(utci.sun) })
            : t('ficha.sensacion', { sombra: t('comun.sinDato'), sol: t('comun.sinDato') })}
        </p>

        <p className={`${s.arboles} um-etiqueta`}>
          <span className={s.iconoArbol} aria-hidden="true">
            <Icono name="mango" size={16} />
          </span>
          {treeText}
        </p>

        {phenology && <p className={`${s.nota} ${niveles.precaucion} um-etiqueta`}>{phenology}</p>}

        {/* G5: lo técnico va plegado. */}
        <div className={s.detalles}>
          <button
            type="button"
            className={`${s.desplegar} um-cuerpo`}
            aria-expanded={detailsOpen}
            aria-controls={detailsId}
            onClick={() => setDetailsOpen((open) => !open)}
          >
            {t('ficha.detalles')}
            <span className={s.flecha} data-abierto={detailsOpen} aria-hidden="true">
              <Icono name="avanzar" size={20} />
            </span>
          </button>
          <div id={detailsId} className={s.detallesTexto} hidden={!detailsOpen}>
            <p className="um-etiqueta">{t('ficha.svf', { valor: svfText })}</p>
            <p className={`${s.secundario} um-etiqueta`}>{t('ficha.svfExplicacion', { anden: lowerFirst(bestName) })}</p>
          </div>
        </div>
      </div>
    </HojaInferior>
  )
}

/** "Andén hacia la Calle 15" → "andén hacia la Calle 15", para usarlo dentro de una frase. */
function lowerFirst(text: string): string {
  return text.charAt(0).toLocaleLowerCase() + text.slice(1)
}
