import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import isotipoNegativo from '../../../design/marca/isotipo-negativo.svg'
import indiceIconos from '../../../design/iconos/indice.json'
import {
  BarraSuperior,
  Boton,
  Encabezado,
  HojaInferior,
  Icono,
  Logotipo,
  Marcador,
  Modal,
  MuestraTramo,
  Semaforo,
  TarjetaOpcion,
  type IconName,
  type MarkerKind,
} from '../../componentes'
import { SEGMENT_STATES, THERMAL_LEVELS, type ThermalLevel } from '../../config/niveles'
import niveles from '../../estilos/niveles.module.css'
import { LANGUAGES } from '../../i18n/idioma'
import type { TranslationKey } from '../../i18n/traducir'
import { useT } from '../../i18n/useT'
import { SCREENS } from '../pantallas'
import s from './Guia.module.css'

// Página /guia: todos los componentes y estados, ordenados como la guía de estilo de Figma (nodo 44:41).

const COLOR_GROUPS: { titleKey: TranslationKey; tokens: string[] }[] = [
  {
    titleKey: 'guia.color.base',
    tokens: [
      '--um-base-fondo',
      '--um-base-superficie',
      '--um-base-borde',
      '--um-base-texto',
      '--um-base-texto-secundario',
      '--um-base-texto-inverso',
      '--um-base-velo',
      '--um-marca-canaguate',
    ],
  },
  {
    titleKey: 'guia.color.termico',
    tokens: [
      '--um-termico-sombra-plena',
      '--um-termico-sombra-parcial',
      '--um-termico-exposicion',
      '--um-termico-riesgo-alto',
    ],
  },
  {
    titleKey: 'guia.color.semaforo',
    tokens: ['comodo', 'precaucion', 'evitar', 'no-recomendado', 'nublado'].flatMap((level) =>
      ['fondo', 'texto', 'forma'].map((part) => `--um-semaforo-${level}-${part}`),
    ),
  },
  {
    titleKey: 'guia.color.mapa',
    tokens: [
      '--um-mapa-fondo',
      '--um-mapa-manzana',
      '--um-mapa-via-neutra',
      '--um-mapa-marca-expuesto',
      '--um-mapa-usuario',
    ],
  },
]

const TEXT_STYLES: { className: string; nameKey: TranslationKey; spec: string; sampleKey: TranslationKey }[] = [
  { className: 'um-display', nameKey: 'guia.tipografia.display', spec: 'Semi Bold · 34/40 px', sampleKey: 'guia.tipografia.muestraDisplay' },
  { className: 'um-titulo', nameKey: 'guia.tipografia.tituloEstilo', spec: 'Semi Bold · 24/30 px', sampleKey: 'guia.tipografia.muestraTitulo' },
  { className: 'um-dato', nameKey: 'guia.tipografia.dato', spec: 'Semi Bold · 28/32 px', sampleKey: 'guia.tipografia.muestraDato' },
  { className: 'um-subtitulo', nameKey: 'guia.tipografia.subtitulo', spec: 'Medium · 20/26 px', sampleKey: 'guia.tipografia.muestraSubtitulo' },
  { className: 'um-cuerpo', nameKey: 'guia.tipografia.cuerpo', spec: 'Regular · 17/25 px', sampleKey: 'guia.tipografia.muestraCuerpo' },
  { className: 'um-cuerpo-fuerte', nameKey: 'guia.tipografia.cuerpoFuerte', spec: 'Medium · 17/25 px', sampleKey: 'guia.tipografia.muestraCuerpoFuerte' },
  { className: 'um-etiqueta', nameKey: 'guia.tipografia.etiqueta', spec: 'Medium · 15/20 px', sampleKey: 'guia.tipografia.muestraEtiqueta' },
  { className: 'um-micro', nameKey: 'guia.tipografia.micro', spec: 'Medium · 13/18 px', sampleKey: 'guia.tipografia.muestraMicro' },
]

const ICON_CATEGORIES = indiceIconos as Record<string, IconName[]>

// Valores de muestra para ver la barra superior en cada estado (no son cálculos).
const SAMPLE_UTCI: Record<ThermalLevel, [number, number]> = {
  comodo: [29, 26],
  precaucion: [35, 31],
  evitar: [41, 35],
  no_recomendado: [47, 40],
  nublado: [30, 29],
}

const MARKERS: MarkerKind[] = ['usuario', 'destino', 'refugio', 'agua', 'placa', 'arbol', 'grupo']

const SPACING = ['--um-esp-xs', '--um-esp-sm', '--um-esp-md', '--um-esp-lg', '--um-esp-xl']

/** Lee el valor real de un token desde tokens.css (así la guía nunca repite valores a mano). */
function tokenValue(token: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim()
}

function Seccion({ title, text, children }: { title: string; text?: string; children: ReactNode }) {
  return (
    <section className={s.seccion}>
      <h2 className="um-titulo">{title}</h2>
      {text && <p className={`${s.secundario} um-etiqueta`}>{text}</p>}
      {children}
    </section>
  )
}

function Muestra({ token }: { token: string }) {
  const value = tokenValue(token)
  const name = token.replace(/^--um-(base|termico|semaforo|mapa|marca)-/, '')
  return (
    <figure className={s.muestraColor}>
      <span className={s.color} style={{ background: `var(${token})` }} />
      <figcaption className="um-micro">
        <strong>{name}</strong>
        <span className={s.secundario}>{value}</span>
        <code className={s.secundario}>{token}</code>
      </figcaption>
    </figure>
  )
}

function Espacio({ token }: { token: string }) {
  const value = tokenValue(token)
  return (
    <li className={`${s.espacio} um-micro`}>
      <span className={s.barraEspacio} style={{ width: `calc(var(${token}) * 3)` }} />
      <code>{token}</code> · {value}
    </li>
  )
}

export function Guia() {
  const { t, language, setLanguage } = useT()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className={s.guia}>
      <header className={s.cabecera}>
        <div className={s.marca}>
          <Logotipo size={48} />
          <h1 className="um-titulo">· {t('guia.titulo')}</h1>
        </div>
        <p className={`${s.secundario} um-etiqueta`}>{t('guia.subtitulo')}</p>
        <p className={`${s.nota} um-etiqueta`}>
          <Icono name="informacion" size={20} />
          {t('guia.nota')}
        </p>
        <div className={s.idiomas} role="group" aria-label={t('guia.idioma')}>
          {LANGUAGES.map((lang) => (
            <Boton
              key={lang}
              variant={lang === language ? 'primario' : 'secundario'}
              fullWidth={false}
              icon="idioma"
              aria-pressed={lang === language}
              lang={lang}
              onClick={() => setLanguage(lang)}
            >
              {t(`idioma.${lang}`)}
            </Boton>
          ))}
        </div>
      </header>

      <Seccion title={t('guia.principios.titulo')}>
        <div className={s.rejilla}>
          {(['legible', 'izquierda', 'color', 'honesto'] as const).map((key) => (
            <article key={key} className={s.tarjeta}>
              <h3 className="um-cuerpo-fuerte">{t(`guia.principios.${key}Titulo`)}</h3>
              <p className={`${s.secundario} um-etiqueta`}>{t(`guia.principios.${key}Texto`)}</p>
            </article>
          ))}
        </div>
      </Seccion>

      <Seccion title={t('guia.color.titulo')} text={t('guia.color.texto')}>
        {COLOR_GROUPS.map((group) => (
          <div key={group.titleKey} className={s.grupo}>
            <h3 className="um-cuerpo-fuerte">{t(group.titleKey)}</h3>
            <div className={s.colores}>
              {group.tokens.map((token) => (
                <Muestra key={token} token={token} />
              ))}
            </div>
          </div>
        ))}
      </Seccion>

      <Seccion title={t('guia.tipografia.titulo')} text={t('guia.tipografia.texto')}>
        <div className={s.panel}>
          {TEXT_STYLES.map((style) => (
            <div key={style.className} className={s.filaTexto}>
              <div>
                <p className="um-etiqueta">{t(style.nameKey)}</p>
                <p className={`${s.secundario} um-micro`}>
                  {style.spec} · <code>.{style.className}</code>
                </p>
              </div>
              <p className={style.className}>{t(style.sampleKey)}</p>
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion title={t('guia.iconografia.titulo')} text={t('guia.iconografia.texto')}>
        <div className={s.dosColumnas}>
          <ul className={`${s.panel} ${s.reglas} um-etiqueta`}>
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <li key={n}>{t(`guia.iconografia.regla${n}`)}</li>
            ))}
          </ul>
          <div className={`${s.panel} ${s.tamanos}`}>
            {[20, 24, 28].map((size) => (
              <span key={size} className={s.tamanoIcono}>
                <Icono name="mango" size={size} />
                <span className="um-micro">{t('guia.pwa.tamano', { n: size })}</span>
              </span>
            ))}
            {THERMAL_LEVELS.map((level) => (
              <span key={level} className={`${s.iconoTinte} ${niveles[level]}`}>
                <Icono name={level === 'nublado' ? 'nublado' : 'sombra-plena'} />
              </span>
            ))}
          </div>
        </div>
        {Object.entries(ICON_CATEGORIES).map(([category, names]) => (
          <div key={category} className={s.grupo}>
            <h3 className="um-cuerpo-fuerte">{t(`guia.iconografia.${category}` as TranslationKey)}</h3>
            <ul className={s.iconos}>
              {names.map((name) => (
                <li key={name} className={s.icono}>
                  <Icono name={name} />
                  <code className="um-micro">{name}</code>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Seccion>

      <Seccion title={t('guia.semaforo.titulo')} text={t('guia.semaforo.texto')}>
        <div className={s.rejillaSemaforo}>
          {THERMAL_LEVELS.map((level) => (
            <article key={level} className={s.tarjeta}>
              <Semaforo level={level} />
              <p className={`${s.secundario} um-micro`}>{t(`guia.semaforo.${level}`)}</p>
            </article>
          ))}
        </div>
        <h3 className="um-cuerpo-fuerte">{t('guia.semaforo.barraTitulo')}</h3>
        <div className={s.barras}>
          {THERMAL_LEVELS.map((level) => (
            <div key={level} className={s.telefono}>
              <BarraSuperior
                time={t('guia.tipografia.muestraDato')}
                level={level}
                levelLabel={level === 'nublado' ? t('guia.semaforo.nubladoChip') : undefined}
                utciSun={SAMPLE_UTCI[level][0]}
                utciShade={SAMPLE_UTCI[level][1]}
              />
            </div>
          ))}
          <div className={s.telefono}>
            <BarraSuperior time={t('guia.tipografia.muestraDato')} level="comodo" />
          </div>
        </div>
      </Seccion>

      <Seccion title={t('guia.mapa.titulo')} text={t('guia.mapa.texto')}>
        <div className={s.dosColumnas}>
          <div className={`${s.panelMapa} ${s.leyenda}`}>
            {SEGMENT_STATES.map((state) => (
              <MuestraTramo key={state} state={state} label={t(`guia.mapa.${state}`)} />
            ))}
            <div className={s.leyendaCompacta}>
              {SEGMENT_STATES.map((state) => (
                <MuestraTramo key={state} state={state} width={44} />
              ))}
            </div>
          </div>
          <div className={`${s.panelMapa} ${s.marcadores}`}>
            {MARKERS.map((kind) => (
              <figure key={kind} className={s.marcador}>
                <Marcador kind={kind} count={kind === 'grupo' ? 12 : undefined} />
                <figcaption className="um-micro">
                  {kind === 'grupo' ? t('marcador.grupo', { n: 12 }) : t(`marcador.${kind}`)}
                </figcaption>
              </figure>
            ))}
            <figure className={s.marcador}>
              <Marcador kind="arbol" icon="canaguate-en-flor" />
              <figcaption className="um-micro">canaguate-en-flor</figcaption>
            </figure>
          </div>
        </div>
      </Seccion>

      <Seccion title={t('guia.botones.titulo')} text={t('guia.botones.texto')}>
        <div className={s.columnaTelefono}>
          {(['primario', 'secundario', 'advertencia'] as const).map((variant) => (
            <div key={variant} className={s.grupo}>
              <p className={`${s.secundario} um-micro`}>{t(`guia.botones.${variant}`)}</p>
              <Boton variant={variant}>{t('guia.botones.muestra')}</Boton>
            </div>
          ))}
          <div className={s.grupo}>
            <p className={`${s.secundario} um-micro`}>{t('guia.botones.primario')} · {t('guia.botones.deshabilitado')}</p>
            <Boton icon="caminar" disabled>
              {t('guia.botones.muestra')}
            </Boton>
          </div>
        </div>
      </Seccion>

      <Seccion title={t('guia.componentes.titulo')}>
        <div className={s.rejillaComponentes}>
          <div className={s.grupo}>
            <h3 className="um-cuerpo-fuerte">{t('guia.componentes.barra')}</h3>
            <div className={s.telefono}>
              <BarraSuperior time={t('guia.tipografia.muestraDato')} level="evitar" utciSun={41} utciShade={35} />
            </div>
          </div>
          <div className={s.grupo}>
            <h3 className="um-cuerpo-fuerte">{t('guia.componentes.encabezado')}</h3>
            <div className={s.telefono}>
              <Encabezado title={t('guia.componentes.encabezadoMuestra')} onBack={() => undefined} />
            </div>
          </div>
          <div className={s.grupo}>
            <h3 className="um-cuerpo-fuerte">{t('guia.componentes.tarjeta')}</h3>
            <TarjetaOpcion
              icon="reloj"
              tone="comodo"
              title={t('guia.componentes.tarjetaEsperarTitulo')}
              text={t('guia.componentes.tarjetaEsperarTexto')}
            />
            <TarjetaOpcion
              icon="transporte"
              tone="precaucion"
              title={t('guia.componentes.tarjetaTransporteTitulo')}
              text={t('guia.componentes.tarjetaTransporteTexto')}
            />
            <TarjetaOpcion
              icon="gorra"
              tone="evitar"
              title={t('guia.componentes.tarjetaProteccionTitulo')}
              text={t('guia.componentes.tarjetaProteccionTexto')}
            />
            <TarjetaOpcion
              icon="ajustes"
              tone="nublado"
              title={t('guia.componentes.tarjetaNeutraTitulo')}
              text={t('guia.componentes.tarjetaNeutraTexto')}
              onClick={() => undefined}
            />
          </div>
          <div className={s.grupo}>
            <h3 className="um-cuerpo-fuerte">
              {t('guia.componentes.hoja')} · {t('guia.componentes.modal')}
            </h3>
            <Boton variant="secundario" onClick={() => setSheetOpen(true)}>
              {t('guia.componentes.abrirHoja')}
            </Boton>
            <Boton variant="secundario" onClick={() => setModalOpen(true)}>
              {t('guia.componentes.abrirModal')}
            </Boton>
          </div>
        </div>
        <HojaInferior open={sheetOpen} onClose={() => setSheetOpen(false)} title={t('guia.componentes.hojaTitulo')}>
          <MuestraTramo state="sombra" />
          <p className="um-cuerpo">{t('guia.componentes.hojaTexto')}</p>
          <Boton onClick={() => setSheetOpen(false)}>{t('comun.cerrar')}</Boton>
        </HojaInferior>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={t('guia.componentes.modalTitulo')}
          actions={
            <>
              <Boton onClick={() => setModalOpen(false)}>{t('guia.componentes.modalAceptar')}</Boton>
              <Boton variant="secundario" onClick={() => setModalOpen(false)}>
                {t('guia.componentes.modalAlternativa')}
              </Boton>
            </>
          }
        >
          <p>{t('guia.componentes.modalTexto')}</p>
        </Modal>
      </Seccion>

      <Seccion title={t('guia.espaciado.titulo')}>
        <div className={s.dosColumnas}>
          <div className={s.panel}>
            <p className="um-etiqueta">{t('guia.espaciado.multiplos')}</p>
            <ul className={s.espacios}>
              {SPACING.map((token) => (
                <Espacio key={token} token={token} />
              ))}
            </ul>
            <p className={`${s.secundario} um-micro`}>{t('guia.espaciado.radios')}</p>
          </div>
          <div className={`${s.panel} ${s.elevaciones}`}>
            {(['flotante', 'hoja', 'modal'] as const).map((key) => (
              <div key={key} className={s.elevacion} style={{ boxShadow: `var(--um-elevacion-${key})` }}>
                <p className="um-etiqueta">{t(`guia.espaciado.${key}`)}</p>
                <p className={`${s.secundario} um-micro`}>{t(`guia.espaciado.${key}Texto`)}</p>
              </div>
            ))}
          </div>
        </div>
      </Seccion>

      <Seccion title={t('guia.pwa.titulo')} text={t('guia.pwa.texto')}>
        <div className={s.pwa}>
          {[
            { size: 160, caption: '512 / 192' },
            { size: 96, caption: '96' },
            { size: 48, caption: '48' },
            { size: 32, caption: '32' },
          ].map(({ size, caption }) => (
            <figure key={size} className={s.iconoPwa}>
              <img src={isotipoNegativo} width={size} height={size} alt="" />
              <figcaption className="um-micro">{t('guia.pwa.tamano', { n: caption })}</figcaption>
            </figure>
          ))}
        </div>
      </Seccion>

      <Seccion title={t('guia.pantallas.titulo')} text={t('guia.pantallas.texto')}>
        <ol className={s.pantallas}>
          {SCREENS.map((screen) => (
            <li key={screen.number}>
              <Link to={screen.examplePath ?? screen.path} className={s.enlacePantalla}>
                <span className="um-cuerpo-fuerte">
                  {screen.number} · {t(screen.nameKey)}
                </span>
                <span className={`${s.secundario} um-micro`}>
                  <code>{screen.path}</code> · {t('pantallas.pendiente', { fase: screen.phase })}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Seccion>
    </div>
  )
}
