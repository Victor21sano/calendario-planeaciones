import {
  Paragraph, TextRun, TableCell, TableRow, Table,
  AlignmentType, WidthType, VerticalAlign,
} from 'docx'
import { COLORES, FUENTES, TAMANOS, ANCHO_CONTENIDO } from './constantes.js'

// ─── Bordes estándar ──────────────────────────────────────────
const bordeLado = { style: 'single', size: 4, color: COLORES.bordeTabla }
const bordes = { top: bordeLado, bottom: bordeLado, left: bordeLado, right: bordeLado }

// ─── Párrafo simple ──────────────────────────────────────────
export function parrafo(texto, opciones = {}) {
  const corrido = Array.isArray(texto)
    ? texto   // array de TextRun pasado directamente
    : [new TextRun({
        text:  String(texto ?? ''),
        font:  FUENTES.cuerpo,
        size:  opciones.tamano || TAMANOS.cuerpo,
        bold:  opciones.negrita || false,
        color: opciones.color || COLORES.texto,
      })]

  return new Paragraph({
    alignment: opciones.alineacion || AlignmentType.LEFT,
    spacing:   { before: 0, after: opciones.after ?? 80, line: 276, lineRule: 'auto' },
    children:  corrido,
  })
}

// ─── Párrafo multilinea (saltos de \n) ───────────────────────
export function parrafoMultilinea(texto, opciones = {}) {
  const lineas = String(texto ?? '').split('\n')
  const runs   = lineas.flatMap((linea, i) => {
    const run = [new TextRun({ text: linea, font: FUENTES.cuerpo, size: TAMANOS.cuerpo, color: COLORES.texto })]
    if (i < lineas.length - 1) run.push(new TextRun({ break: 1 }))
    return run
  })
  return new Paragraph({
    alignment: opciones.alineacion || AlignmentType.LEFT,
    spacing:   { before: 0, after: opciones.after ?? 80, line: 276, lineRule: 'auto' },
    children:  runs,
  })
}

// ─── Párrafo mixto (negrita + normal en la misma línea) ───────
export function parrafoMixto(partes, opciones = {}) {
  return new Paragraph({
    alignment: opciones.alineacion || AlignmentType.LEFT,
    spacing:   { before: 0, after: opciones.after ?? 80, line: 276, lineRule: 'auto' },
    children:  partes.map(p => new TextRun({
      text:  p.texto,
      font:  FUENTES.cuerpo,
      size:  p.tamano || TAMANOS.cuerpo,
      bold:  p.negrita || false,
      color: p.color || COLORES.texto,
    })),
  })
}

// ─── Celda de tabla ───────────────────────────────────────────
export function celda(opciones = {}) {
  const {
    texto,
    partes,
    multilinea,
    anchoTwips,
    columnSpan,
    sombreado,
    negrita    = false,
    alineacion = AlignmentType.LEFT,
    vertAlign  = VerticalAlign.CENTER,
  } = opciones

  let hijo
  if (partes) {
    hijo = parrafoMixto(partes, { alineacion })
  } else if (multilinea) {
    hijo = parrafoMultilinea(texto, { alineacion })
  } else {
    hijo = parrafo(texto ?? '', { negrita, alineacion })
  }

  return new TableCell({
    width:         anchoTwips ? { size: anchoTwips, type: WidthType.DXA } : undefined,
    columnSpan,
    verticalAlign: vertAlign,
    shading:       sombreado ? { type: 'clear', fill: sombreado, color: 'auto' } : undefined,
    margins:       { top: 80, bottom: 80, left: 120, right: 120 },
    borders:       bordes,
    children:      [hijo],
  })
}

// ─── Fila helper ─────────────────────────────────────────────
export function fila(celdas, alturaMinima) {
  return new TableRow({
    height:   alturaMinima ? { value: alturaMinima, rule: 'atLeast' } : undefined,
    children: celdas,
  })
}

// ─── Tabla helper ─────────────────────────────────────────────
export function tabla(filas, anchoTotal = ANCHO_CONTENIDO) {
  return new Table({
    width:   { size: anchoTotal, type: WidthType.DXA },
    borders: {
      top:              bordeLado,
      bottom:           bordeLado,
      left:             bordeLado,
      right:            bordeLado,
      insideHorizontal: bordeLado,
      insideVertical:   bordeLado,
    },
    rows: filas,
  })
}

// ─── Párrafo vacío (espaciado) ────────────────────────────────
export function espacio(after = 120) {
  return new Paragraph({ children: [], spacing: { after } })
}

// ─── Salto de página ─────────────────────────────────────────
export function saltoPagina() {
  return new Paragraph({ pageBreakBefore: true, children: [] })
}
