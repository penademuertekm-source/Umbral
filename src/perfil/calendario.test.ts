import { describe, expect, it } from 'vitest'
import { buildIcs, foldLine, icsDate, icsText } from './calendario'

const EVENT = {
  id: 'abc123',
  title: 'Salir hacia Trabajo · Umbral',
  description: 'Ruta con más sombra (estimado)',
  start: new Date('2026-10-16T19:45:00Z'),
  end: new Date('2026-10-16T19:52:00Z'),
  url: 'https://penademuertekm-source.github.io/Umbral/rutas?destino=plaza-alfonso-lopez&hora=14:45',
  alarmMin: 10,
}

describe('archivo de calendario (.ics)', () => {
  it('escribe fechas en UTC y escapa el texto', () => {
    expect(icsDate(new Date('2026-10-16T19:45:00.123Z'))).toBe('20261016T194500Z')
    expect(icsText('a, b; c\\d\ne')).toBe('a\\, b\; c\\\\d\\ne')
  })

  it('tiene un evento con la hora de salida, el título, la alarma de 10 minutos y el enlace', () => {
    const ics = buildIcs(EVENT, new Date('2026-10-16T12:00:00Z'))
    const unfolded = ics.replace(/\r\n /g, '')
    expect(unfolded.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true)
    expect(unfolded).toContain('\r\nUID:abc123@umbral\r\n')
    expect(unfolded).toContain('\r\nDTSTART:20261016T194500Z\r\n')
    expect(unfolded).toContain('\r\nDTEND:20261016T195200Z\r\n')
    expect(unfolded).toContain('\r\nSUMMARY:Salir hacia Trabajo · Umbral\r\n')
    expect(unfolded).toContain('\r\nTRIGGER:-PT10M\r\n')
    expect(unfolded).toContain(`\r\nURL:${EVENT.url}\r\n`)
    expect(ics.endsWith('END:VEVENT\r\nEND:VCALENDAR\r\n')).toBe(true)
  })

  it('corta las líneas largas en 75 bytes sin partir caracteres', () => {
    const line = `SUMMARY:${'á'.repeat(60)}`
    const folded = foldLine(line)
    for (const part of folded.split('\r\n')) expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75)
    expect(folded.replace(/\r\n /g, '')).toBe(line)
  })
})
