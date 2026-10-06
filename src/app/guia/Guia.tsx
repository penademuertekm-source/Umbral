import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import isotipoNegativo from '../../../design/marca/isotipo-negativo.svg'
import isotipoPositivo from '../../../design/marca/isotipo-positivo.svg'
import indiceIconos from '../../../design/iconos/indice.json'
import {
  BarraSuperior,
  Boton,
  Encabezado,
  HojaInferior,
  Icono,
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
import { CURRENT_PHASE, SCREENS } from '../pantallas'
import s from './Guia.module.css'
import { PanelSombra } from './PanelSombra'
import { SimuladorSemaforo } from './SimuladorSemaforo'

// Página /guia: réplica de la guía de estilo de Figma (página 03, nodo 44:41) hecha con los
// componentes reales, más las secciones que solo existen en código (botones, componentes de
// pantalla e índice de rutas). Los nombres de las muestras siguen los de Figma.

const COLOR_GROUPS: { titleKey: TranslationKey; swatches: [token: string, name: string][] }[] = [
  {
    titleKey: 'guia.color.base',
    swatches: [
      ['--um-base-fondo', 'fondo'],
      ['--um-base-superficie', 'superficie'],
      ['--um-base-borde', 'borde'],
      ['--um-base-texto', 'texto'],
      ['--um-base-texto-secundario', 'texto-secundario'],
      ['--um-base-texto-inverso', 'texto-inverso'],
      ['--um-base-velo', 'velo'],
      ['--um-marca-canaguate', 'cañaguate'],
    ],
  },
  {
    titleKey: 'guia.color.termico',
    swatches: [
      ['--um-termico-sombra-plena', 'sombra-plena'],
      ['--um-termico-sombra-parcial', 'sombra-parcial'],
      ['--um-termico-exposicion', 'exposición'],
      ['--um-termico-riesgo-alto', 'riesgo-alto'],
    ],
  },
  {
    // Figma muestra solo los 10 valores que no repiten un color térmico.
    titleKey: 'guia.color.semaforo',
    swatches: [
      ['--um-semaforo-comodo-fondo', 'cómodo/fondo'],
      ['--um-semaforo-comodo-forma', 'cómodo/forma'],
      ['--um-semaforo-precaucion-fondo', 'precaución/fondo'],
      ['--um-semaforo-precaucion-forma', 'precaución/forma'],
      ['--um-semaforo-precaucion-texto', 'precaución/texto'],
      ['--um-semaforo-evitar-fondo', 'evitar/fondo'],
      ['--um-semaforo-evitar-texto', 'evitar/texto'],
      ['--um-semaforo-no-recomendado-fondo', 'no-recomendado/fondo'],
      ['--um-semaforo-nublado-fondo', 'nublado/fondo'],
      ['--um-semaforo-nublado-texto', 'nublado/texto'],
    ],
  },
  {
    titleKey: 'guia.color.mapa',
    swatches: [
      ['--um-mapa-fondo', 'fondo'],
      ['--um-mapa-manzana', 'manzana'],
      ['--um-mapa-via-neutra', 'vía-neutra'],
      ['--um-mapa-marca-expuesto', 'marca-expuesto'],
      ['--um-mapa-usuario', 'usuario'],
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
  { className: 'um-micro', nameKey: 'guia.tipografia.micro', spec: 'Medium · 15/20 px', sampleKey: 'guia.tipografia.muestraMicro' },
]

const ICON_CATEGORIES = indiceIconos as Record<string, IconName[]>

// Panel de Figma (nodo 45:54): sobre fondo de color, el ícono toma el color de texto del nivel.
const TINTED_ICONS: [IconName, ThermalLevel][] = [
  ['sombra-plena', 'comodo'],
  ['sombra-parcial', 'comodo'],
  ['expuesto', 'evitar'],
  ['canaguate-en-flor', 'precaucion'],
  ['sin-conexion', 'nublado'],
]

// Valores de muestra para ver la barra superior en cada estado (no son cálculos).
const SAMPLE_UTCI: Record<ThermalLevel, [number, number]> = {
  comodo: [29, 26],
  precaucion: [35, 31],
  evitar: [41, 35],
  no_recomendado: [47, 40],
  nublado: [30, 29],
}

const MARKERS: MarkerKind[] = ['usuario', 'destino', 'refugio', 'agua', 'placa', 'arbol', 'grupo']

const SPACING = ['xs', 'sm', 'md', 'lg', 'xl'] as const

// Íconos de la PWA (nodo 45:225): radio del 22 % e isotipo al 56 %; los dos grandes muestran
// la zona segura del 80 % que respeta Android.
const PWA_ICONS = [
  { size: 192, label: '512 / 192', safeZone: true },
  { size: 96, label: '96', safeZone: true },
  { size: 48, label: '48', safeZone: false },
  { size: 32, label: '32', safeZone: false },
]

/** Lee el valor real de un token desde tokens.css (así la guía nunca repite valores a mano). */
function tokenValue(token: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim()
}

/** Muestra el color como lo rotula Figma: #F7F6F2, o #14171A · 45 % si tiene transparencia. */
function formatColor(value: string): string {
  const rgba = value.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+))?\s*\)$/)
  if (!rgba) return value.toUpperCase()
  const [r, g, b] = rgba.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, '0'))
  const hex = `#${r}${g}${b}`.toUpperCase()
  const alpha = rgba[4] === undefined ? 1 : Number(rgba[4])
  return alpha < 1 ? `${hex} · ${Math.round(alpha * 100)} %` : hex
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

function Muestra({ token, name }: { token: string; name: string }) {
  return (
    <figure className={s.muestraColor}>
      <span className={s.color} style={{ background: `var(${token})` }} />
      <figcaption className="um-micro">
        <strong>{name}</strong>
        <span className={s.secundario}>{formatColor(tokenValue(token))}</span>
        <code className={s.secundario}>{token}</code>
      </figcaption>
    </figure>
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
          <img src={isotipoPositivo} width={72} height={72} alt="" />
          <div className={s.marcaTextos}>
            <h1 className="um-display">{t('guia.titulo')}</h1>
            <p className={`${s.secundario} um-cuerpo`}>{t('guia.subtitulo')}</p>
          </div>
        </div>
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
              <h3 className={`${s.fuerte} um-cuerpo-fuerte`}>{t(`guia.principios.${key}Titulo`)}</h3>
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
              {group.swatches.map(([token, name]) => (
                <Muestra key={token} token={token} name={name} />
              ))}
            </div>
          </div>
        ))}
      </Seccion>

      <Seccion title={t('guia.tipografia.titulo')} text={t('guia.tipografia.texto')}>
        <div className={`${s.panel} ${s.tipografia}`}>
          {TEXT_STYLES.map((style) => (
            <div key={style.className} className={s.filaTexto}>
              <div className={s.nombreEstilo}>
                <p className={`${s.fuerte} um-etiqueta`}>{t(style.nameKey)}</p>
                <p className={`${s.secundario} ${s.regular} um-micro`}>{style.spec}</p>
              </div>
              <p className={style.className}>{t(style.sampleKey)}</p>
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion title={t('guia.iconografia.titulo')} text={t('guia.iconografia.texto')}>
        <div className={s.iconografia}>
          <ul className={`${s.panel} ${s.reglas} um-etiqueta`}>
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <li key={n}>{t(`guia.iconografia.regla${n}`)}</li>
            ))}
          </ul>
          <div className={`${s.panel} ${s.tamanos}`}>
            {[20, 24, 28].map((size) => (
              <Icono key={size} name="mango" size={size} />
            ))}
            <span className={s.divisor} />
            {TINTED_ICONS.map(([name, level]) => (
              <span key={name} className={`${s.iconoTinte} ${niveles[level]}`}>
                <Icono name={name} />
              </span>
            ))}
          </div>
        </div>
        <div className={`${s.panel} ${s.catalogo}`}>
          <h3 className="um-titulo">{t('guia.iconografia.componentes')}</h3>
          <p className={`${s.secundario} um-etiqueta`}>{t('guia.iconografia.componentesTexto')}</p>
          {Object.entries(ICON_CATEGORIES).map(([category, names]) => (
            <div key={category} className={s.grupo}>
              <h4 className="um-subtitulo">{t(`guia.iconografia.${category}` as TranslationKey)}</h4>
              <ul className={s.iconos}>
                {names.map((name) => (
                  <li key={name} className={s.icono} title={name}>
                    <Icono name={name} />
                    <span className={`${s.secundario} ${s.regular} um-micro`}>{t(`iconos.${name}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion title={t('guia.semaforo.titulo')} text={t('guia.semaforo.texto')}>
        <div className={s.rejillaSemaforo}>
          {THERMAL_LEVELS.map((level) => (
            <article key={level} className={s.tarjetaSemaforo}>
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
          </div>
          <div className={`${s.panelMapa} ${s.marcadores}`}>
            {MARKERS.map((kind) => (
              <figure key={kind} className={s.marcador}>
                <Marcador kind={kind} count={kind === 'grupo' ? 12 : undefined} />
                <figcaption className="um-micro">{t(`guia.mapa.marcadores.${kind}`)}</figcaption>
              </figure>
            ))}
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
            <p className={`${s.secundario} um-micro`}>
              {t('guia.botones.primario')} · {t('guia.botones.deshabilitado')}
            </p>
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
            <p className="um-cuerpo-fuerte">{t('guia.espaciado.multiplos')}</p>
            <ul className={s.espacios}>
              {SPACING.map((size) => (
                <li key={size} className={`${s.espacio} um-micro`}>
                  <span className={s.barraEspacio} style={{ width: `calc(var(--um-esp-${size}) * 4)` }} />
                  esp/{size} · {tokenValue(`--um-esp-${size}`).replace('px', ' px')}
                </li>
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
          {PWA_ICONS.map(({ size, label, safeZone }) => (
            <figure key={size} className={s.iconoPwa}>
              <span className={s.fondoPwa} style={{ width: size, height: size }}>
                {safeZone && <span className={s.zonaSegura} />}
                <img src={isotipoNegativo} width={size * 0.56} height={size * 0.56} alt="" />
              </span>
              <figcaption className={`${s.secundario} ${s.regular} um-micro`}>
                {size === 192 ? t('guia.pwa.adaptable', { n: label }) : t('guia.pwa.tamano', { n: label })}
              </figcaption>
            </figure>
          ))}
        </div>
      </Seccion>

      <Seccion title={t('guia.sombra.titulo')} text={t('guia.sombra.texto')}>
        <PanelSombra />
      </Seccion>

      <Seccion title={t('guia.simulador.titulo')} text={t('guia.simulador.texto')}>
        <SimuladorSemaforo />
        <Link to="/semaforo" className="um-cuerpo-fuerte">
          {t('guia.simulador.verReferencia')}
        </Link>
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
                  <code>{screen.path}</code> ·{' '}
                  {screen.paused
                    ? t('pantallas.enPausa')
                    : screen.phase <= CURRENT_PHASE
                      ? t('pantallas.lista', { fase: screen.phase })
                      : t('pantallas.pendiente', { fase: screen.phase })}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Seccion>
    </div>
  )
}
