// Helpers de maquetación para el formato oficial de impresión del Modelo 2025.
// A diferencia del 2023 (cuadrícula tabular), el 2025 es una lista vertical de
// cajas etiquetadas, una debajo de otra.

import { Paragraph, TextRun, TableCell, WidthType, VerticalAlign } from 'docx'
import { tabla, fila } from '../exportar2023/utiles/helpers.js'
import { FUENTES, TAMANOS, COLORES, ANCHO_CONTENIDO, COL } from '../exportar2023/utiles/constantes.js'

// ─── Tiempo: enteros en horas, fracciones en minutos (igual que el formato oficial)
export function formatTiempo(horas) {
  const h = Number(horas) || 0
  if (h === 0) return ''
  if (Number.isInteger(h)) return `${h} Horas`
  return `${Math.round(h * 60)} Minutos`
}

// ─── tipoCurriculum → etiqueta oficial
export function etiquetaCurriculum(tipo) {
  const map = {
    fundamental: 'Currículum fundamental',
    ampliado:    'Currículum ampliado',
    laboral:     'Currículum laboral',
  }
  return map[String(tipo || '').toLowerCase()] || (tipo || '')
}

// ─── Párrafo "Etiqueta: valor" (valor admite saltos \n) ───────
function paraEtiquetaValor(label, value) {
  const runs = []
  if (label) {
    runs.push(new TextRun({ text: `${label}: `, font: FUENTES.cuerpo, size: TAMANOS.cuerpo, color: COLORES.texto }))
  }
  const lineas = String(value ?? '').split('\n')
  lineas.forEach((linea, i) => {
    if (i > 0) runs.push(new TextRun({ break: 1 }))
    runs.push(new TextRun({ text: linea, font: FUENTES.cuerpo, size: TAMANOS.cuerpo, color: COLORES.texto }))
  })
  return new Paragraph({ spacing: { before: 0, after: 40, line: 276, lineRule: 'auto' }, children: runs })
}

function celdaEV(label, value, anchoTwips) {
  return new TableCell({
    width:         anchoTwips ? { size: anchoTwips, type: WidthType.DXA } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    margins:       { top: 60, bottom: 60, left: 120, right: 120 },
    children:      [paraEtiquetaValor(label, value)],
  })
}

// ─── Caja de una sola celda a todo lo ancho ───────────────────
export function cajaSimple(label, value) {
  return tabla([fila([celdaEV(label, value, ANCHO_CONTENIDO)])])
}

// ─── Caja de dos celdas (ej. Duración | Modalidad, Fecha Inicio | Fecha Fin) ──
export function cajaDoble(label1, value1, label2, value2) {
  return tabla([fila([
    celdaEV(label1, value1, COL.datosEq[0]),
    celdaEV(label2, value2, COL.datosEq[1]),
  ])])
}

// ─── Encabezado de sección (Datos Específico, Inicio, Desarrollo, Cierre…) ──
export function cajaSeccion(titulo) {
  return new Paragraph({
    spacing: { before: 200, after: 80, line: 276, lineRule: 'auto' },
    border:  { bottom: { style: 'single', size: 8, color: COLORES.texto, space: 3 } },
    children: [new TextRun({ text: titulo, bold: true, font: FUENTES.encabezado, size: TAMANOS.cuerpo, color: COLORES.texto })],
  })
}
