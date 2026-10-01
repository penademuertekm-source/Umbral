// @vitest-environment node
// Carga los datos reales de public/datos (Fase 2) y mide el tiempo de cálculo.
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { loadModel } from './cargar'
import { computeShade, dayProfile, shadeUntil } from './modelo'
import { localDate } from './tiempo'

const DATOS = new URL('../../public/datos/', import.meta.url)

async function fetchLocal(url: string): Promise<Response> {
  return new Response(await readFile(new URL(url, DATOS)))
}

describe('datos reales de public/datos', () => {
  it('carga muestras.json y los perfiles comprimidos', async () => {
    const model = await loadModel('', fetchLocal)
    expect(model.sampleCount).toBeGreaterThan(1000)
    expect(model.sides.length).toBeGreaterThan(100)
    expect(model.sides.reduce((sum, s) => sum + s.count, 0)).toBe(model.sampleCount)
    expect(model.lat).toBeCloseTo(10.478, 2)
    expect(model.lon).toBeCloseTo(-73.245, 2)
  })

  it('calcula todo el centro muy por debajo de 150 ms', async () => {
    const model = await loadModel('', fetchLocal)
    const tiempos: number[] = []
    for (let minuto = 6 * 60; minuto <= 18 * 60; minuto += 15) {
      const inicio = performance.now()
      computeShade(model, localDate(2026, 8, 15, Math.floor(minuto / 60), minuto % 60))
      tiempos.push(performance.now() - inicio)
    }
    const mediodia = computeShade(model, localDate(2026, 8, 15, 12))
    const tarde = computeShade(model, localDate(2026, 8, 15, 16))
    const lado = Array.from(tarde.state).findIndex((s) => s === 0)
    const inicio = performance.now()
    shadeUntil(model, lado, localDate(2026, 8, 15, 16))
    dayProfile(model, lado, localDate(2026, 8, 15, 16))
    const auxiliares = performance.now() - inicio

    const promedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length
    console.info(
      `[medición] calcular: promedio ${promedio.toFixed(2)} ms, máximo ${Math.max(...tiempos).toFixed(2)} ms ` +
        `(49 horas, ${model.sampleCount} muestras, ${model.sides.length} lados); ` +
        `sombraHasta + perfilDelDia: ${auxiliares.toFixed(2)} ms\n` +
        `[medición] 12:00 ${JSON.stringify(mediodia.counts)} · 16:00 ${JSON.stringify(tarde.counts)}`,
    )
    expect(Math.max(...tiempos)).toBeLessThan(150)
    // A las 4 p. m. las fachadas dan más sombra que al mediodía (verificación de la Fase 4).
    expect(tarde.counts.sombra).toBeGreaterThan(mediodia.counts.sombra)
  })
})
