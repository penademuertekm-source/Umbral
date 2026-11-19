// Capturas reales de Umbral para el Reel 1 (Etapa 1 del prompt del reel).
// Requiere la app corriendo: npx vite --port 5179 --strictPort
// Uso: node reels/scripts/capturar-reel1.cjs [carpeta-de-salida]
//
// - Celular de 390 × 844 a ×3, en español, zona horaria de Bogotá.
// - Reloj del navegador fijado al 19 de noviembre de 2026, 11:30 a. m. (page.clock).
// - Ubicación simulada a 180 m al sur de la Plaza Alfonso López (punto de partida de las rutas).
// - Antes de cada captura se oculta la palabra "provisional" en la pantalla. La app no cambia.

const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const BASE = 'http://localhost:5179'
const OUT = path.resolve(process.argv[2] || path.join(__dirname, '..', 'capturas', 'reel-1'))
const CLOCK = new Date('2026-11-19T11:30:00-05:00')
const ORIGIN = { latitude: 10.476851, longitude: -73.244632, accuracy: 8 }
const DEST = 'plaza-alfonso-lopez'
const QUERY = 'Plaza Alfonso'

const ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']

/** Quita "· provisional" del chip y "· Datos provisionales" de las notas, solo en la captura. */
async function hideProvisional(page) {
  await page.evaluate(() => {
    const style = document.getElementById('reel-ocultar') || document.createElement('style')
    style.id = 'reel-ocultar'
    style.textContent = '[class*="provisional"]{display:none!important}'
    document.head.appendChild(style)
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (/provisional/i.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/\s*·\s*Datos provisionales/gi, '')
    }
    // Clima faltante (Open-Meteo sin respuesta): se ocultan el aviso "Sin datos de clima" y la línea
    // "Sensación térmica: — al sol · — a la sombra". No se pone ningún valor en su lugar.
    for (const el of document.querySelectorAll('body *')) {
      if (el.children.length) continue
      const text = (el.textContent || '').trim()
      if (/^(Sin datos de clima|Cargando clima…?)$/.test(text)) {
        let box = el
        while (box.parentElement) {
          const r = box.parentElement.getBoundingClientRect()
          if (r.width > 240 || r.height > 64) break
          box = box.parentElement
        }
        box.style.visibility = 'hidden'
      } else if (/^Sensación térmica:/.test(text) && text.includes('—')) {
        el.style.display = 'none'
      }
    }
  })
}

async function settle(page, ms) {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(ms)
}

async function shot(page, name) {
  await hideProvisional(page)
  await page.screenshot({ path: path.join(OUT, name) })
  console.log('ok', name)
}

const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

;(async () => {
  fs.mkdirSync(path.join(OUT, 'barrido'), { recursive: true })
  fs.mkdirSync(path.join(OUT, 'tecleo'), { recursive: true })
  const browser = await chromium.launch({ args: ARGS })
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    geolocation: ORIGIN,
    permissions: ['geolocation'],
  })
  const page = await ctx.newPage()
  // Reloj quieto en las 11:30 (los temporizadores siguen corriendo, la hora no avanza).
  await page.clock.setFixedTime(CLOCK)
  const solo = process.env.SOLO // p. ej. SOLO=recorrido para repetir una sola pantalla
  const run = (name) => !solo || solo === name

  if (run('barrido')) {
  // Barrido del mapa de 07:00 a 15:30 cada 15 min (incluye 07:00, 11:30 y 15:30).
  for (let m = 7 * 60; m <= 15 * 60 + 30; m += 15) {
    await page.goto(`${BASE}/mapa?hora=${hhmm(m)}`)
    await settle(page, 3500)
    await shot(page, `barrido/mapa-${hhmm(m).replace(':', '')}.png`)
  }
  for (const h of ['0700', '1130', '1530']) fs.copyFileSync(path.join(OUT, 'barrido', `mapa-${h}.png`), path.join(OUT, `mapa-${h}.png`))
  }

  if (run('rutas')) {
  // Rutas a la Plaza Alfonso López a las 11:30.
  await page.goto(`${BASE}/rutas?destino=${DEST}&hora=11:30`)
  await settle(page, 4000)
  await shot(page, 'rutas-1130.png')
  }

  if (run('recorrido')) {
  // Recorrido (sigue el reloj fijado a las 11:30).
  await page.goto(`${BASE}/recorrido?destino=${DEST}`)
  await settle(page, 4000)
  await shot(page, 'recorrido.png')
  }

  if (run('tecleo')) {
  // Tecleo en el buscador: una captura vacía y una por letra.
  await page.goto(`${BASE}/buscar?hora=11:30`)
  await settle(page, 3000)
  const input = page.locator('input[type="search"], input[type="text"], input').first()
  await input.click()
  await page.waitForTimeout(300)
  await shot(page, 'tecleo/tecleo-00.png')
  for (let i = 0; i < QUERY.length; i++) {
    await page.keyboard.type(QUERY[i])
    await page.waitForTimeout(450)
    await shot(page, `tecleo/tecleo-${String(i + 1).padStart(2, '0')}.png`)
  }
  }

  await browser.close()
})()
