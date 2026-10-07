import type { AnswerRecord } from '../recorrido/preferencias'

// Exportación de las respuestas de "¿Te sirvió esta ruta?" (pantalla 22) para la validación del prototipo.
// El archivo se arma y se descarga en el teléfono: no se envía a ningún lado.

const COLUMNS: (keyof AnswerRecord)[] = ['fecha', 'hora', 'destino', 'nivel', 'respuesta', 'simulado']

function cell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** CSV con encabezado, separado por comas y con fin de línea CRLF (RFC 4180). */
export function answersToCsv(records: readonly AnswerRecord[]): string {
  const rows = [COLUMNS.join(','), ...records.map((r) => COLUMNS.map((c) => cell(c === 'simulado' ? (r.simulado ? 'si' : 'no') : r[c])).join(','))]
  return rows.join('\r\n') + '\r\n'
}

/** Descarga el CSV. La marca BOM hace que Excel lea bien las tildes. */
export function downloadCsv(csv: string, fileName: string): void {
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
