import { useNavigate } from 'react-router'
import { Boton, Logotipo } from '../../componentes'
import { translateIn } from '../../i18n/diccionarios'
import { LANGUAGES, type Language } from '../../i18n/idioma'
import { useT } from '../../i18n/useT'
import s from './Entrada.module.css'

// Pantalla 02 (nodo 2:9): idioma, solo en el primer uso. Viene marcado el idioma del teléfono; después se
// cambia en Ajustes (Fase 9).

const OTHER: Record<Language, Language> = { es: 'en', en: 'es' }

export function Idioma() {
  const { t, language, setLanguage } = useT()
  const navigate = useNavigate()
  const choose = (next: Language) => {
    setLanguage(next)
    navigate('/ubicacion', { replace: true })
  }
  return (
    <main className={s.pagina}>
      <span className={s.marca}>
        <Logotipo size={44} withWord={false} />
      </span>
      <div>
        <h1 className="um-display" lang={language}>
          {translateIn(language, 'idioma.elige')}
        </h1>
        <p className={`${s.secundario} um-subtitulo`} lang={OTHER[language]}>
          {translateIn(OTHER[language], 'idioma.elige')}
        </p>
      </div>
      <div className={s.botones}>
        {LANGUAGES.map((code) => (
          <Boton key={code} variant={code === language ? 'primario' : 'secundario'} lang={code} onClick={() => choose(code)}>
            {translateIn(code, `idioma.${code}`)}
          </Boton>
        ))}
      </div>
      <p className={`${s.secundario} um-etiqueta`}>{t('idioma.cambiar')}</p>
      <span className={s.relleno} />
    </main>
  )
}
