// "Añadir a mi calendario" (S2): un archivo .ics con un evento a la hora de salida. El teléfono lo abre con
// su calendario; no hace falta servidor ni permisos. Formato iCalendar (RFC 5545).

export interface CalendarEvent {
  /** Identificador estable de la salida (el mismo evento si se descarga dos veces). */
  id: string
  title: string
  description: string
  start: Date
  end: Date
  /** Enlace a la ruta en la app. */
  url: string
  /** Minutos antes de la salida para la alarma. */
  alarmMin: number
}

/** 2026-10-16T19:48:00Z → "20261016T194800Z" (siempre en UTC). */
export function icsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

/** Escapa un texto para iCalendar: barra invertida, punto y coma, coma y saltos de línea. */
export function icsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** Corta una línea en pedazos de 75 bytes como pide el formato (las siguientes empiezan con un espacio). */
export function foldLine(line: string): string {
  const encoder = new TextEncoder()
  const parts: string[] = []
  let current = ''
  let bytes = 0
  for (const char of line) {
    const size = encoder.encode(char).length
    const limit = parts.length === 0 ? 75 : 74
    if (bytes + size > limit) {
      parts.push(current)
      current = ''
      bytes = 0
    }
    current += char
    bytes += size
  }
  parts.push(current)
  return parts.join('\r\n ')
}

export function buildIcs(event: CalendarEvent, now = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Umbral//Agenda de salidas//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@umbral`,
    `DTSTAMP:${icsDate(now)}`,
    `DTSTART:${icsDate(event.start)}`,
    `DTEND:${icsDate(event.end)}`,
    `SUMMARY:${icsText(event.title)}`,
    `DESCRIPTION:${icsText(`${event.description}\n${event.url}`)}`,
    `URL:${event.url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${icsText(event.title)}`,
    `TRIGGER:-PT${event.alarmMin}M`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(foldLine).join('\r\n') + '\r\n'
}

/** Descarga el archivo; en el celular se abre con la app de calendario. */
export function downloadIcs(ics: string, fileName: string): void {
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
