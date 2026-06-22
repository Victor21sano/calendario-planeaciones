// Genera, en el navegador, un .xlsx del registro de calificaciones del semestre
// (3 parciales + hoja de resumen) según la configuración del docente.

function numToCol(n) {
  let s = ''
  while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26) }
  return s
}

const BORDE_COLOR = 'FFCBD5E1'
const borde = () => ({
  top:    { style: 'thin', color: { argb: BORDE_COLOR } },
  bottom: { style: 'thin', color: { argb: BORDE_COLOR } },
  left:   { style: 'thin', color: { argb: BORDE_COLOR } },
  right:  { style: 'thin', color: { argb: BORDE_COLOR } },
})
const centro = { horizontal: 'center', vertical: 'middle', wrapText: true }
const fill = argb => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } })
const dxf = (bg, fg) => ({ fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: bg } }, font: { color: { argb: fg } } })

function header(cell, { bg = 'FF0F766E', color = 'FFFFFFFF', size = 10, bold = true } = {}) {
  cell.font = { bold, color: { argb: color }, size, name: 'Calibri' }
  cell.fill = fill(bg)
  cell.alignment = centro
  cell.border = borde()
}

function semaforo(ws, ref) {
  ws.addConditionalFormatting({
    ref,
    rules: [
      { type: 'cellIs', operator: 'lessThan', formulae: ['6'], style: dxf('FFFFC7CE', 'FF9C0006'), priority: 1 },
      { type: 'cellIs', operator: 'between', formulae: ['6', '7.999999'], style: dxf('FFFFEB9C', 'FF9C6500'), priority: 2 },
      { type: 'cellIs', operator: 'greaterThanOrEqual', formulae: ['8'], style: dxf('FFC6EFCE', 'FF006100'), priority: 3 },
    ],
  })
}

function fechaCorta(iso) {
  if (!iso) return ''
  const [y, m, d] = String(iso).split('-')
  return d && m ? `${d}/${m}` : iso
}

// ── Construye una hoja de parcial; devuelve posiciones clave para el resumen ──
function construirHojaParcial(ws, { titulo, numAlumnos, categorias, alumnos, meta = {} }) {
  const cats = categorias
  let col = 3
  for (const c of cats) { c.cIni = col; c.cFin = col + c.n - 1; col = c.cFin + 1 }
  for (const c of cats) { c.cProm = col; col++ }
  const colNo = 1, colNom = 2, colAcum = col, lastCol = colAcum
  const R_TITLE = 1, R_LEGEND = 2, R_GROUP = 3, R_SUB = 4, R_FIRST = 5
  const R_LAST = R_FIRST + numAlumnos - 1

  ws.mergeCells(R_TITLE, 1, R_TITLE, lastCol)
  const t = ws.getCell(R_TITLE, 1); t.value = titulo
  t.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 15, name: 'Calibri' }
  t.fill = fill('FF0F766E'); t.alignment = centro
  ws.getRow(R_TITLE).height = 24

  ws.mergeCells(R_LEGEND, 1, R_LEGEND, lastCol)
  const pond = cats.map(c => `${c.label.replace(/\s*\(.*/, '')} ${c.peso}%`).join('  ·  ')
  const leg = ws.getCell(R_LEGEND, 1)
  leg.value = `Ponderación:  ${pond}        Escala:  menor a 6 = rojo · 6 a 7 = amarillo · 8 a 10 = verde        (calificaciones de 0 a 10)`
  leg.font = { bold: true, color: { argb: 'FF0F172A' }, size: 10, name: 'Calibri' }
  leg.fill = fill('FFD6EFE9'); leg.alignment = centro
  ws.getRow(R_LEGEND).height = 26

  ws.mergeCells(R_GROUP, colNo, R_SUB, colNo); header(ws.getCell(R_GROUP, colNo)); ws.getCell(R_GROUP, colNo).value = 'No.'
  ws.mergeCells(R_GROUP, colNom, R_SUB, colNom); header(ws.getCell(R_GROUP, colNom)); ws.getCell(R_GROUP, colNom).value = 'Nombre del alumno'
  const bgCat = ['FF0F766E', 'FF1c8d7e', 'FF0c5d57', 'FF0e4a45']
  cats.forEach((c, i) => {
    ws.mergeCells(R_GROUP, c.cIni, R_GROUP, c.cFin)
    header(ws.getCell(R_GROUP, c.cIni), { bg: bgCat[i % bgCat.length], size: 11 })
    ws.getCell(R_GROUP, c.cIni).value = `${c.label} (${c.n})`
  })
  ws.mergeCells(R_GROUP, cats[0].cProm, R_GROUP, colAcum)
  header(ws.getCell(R_GROUP, cats[0].cProm), { bg: 'FFd2452a', size: 11 }); ws.getCell(R_GROUP, cats[0].cProm).value = 'PROMEDIOS'
  ws.getRow(R_GROUP).height = 22

  for (const c of cats) for (let k = 0; k < c.n; k++) {
    header(ws.getCell(R_SUB, c.cIni + k), { bg: 'FFF1F5F9', color: 'FF0F172A', size: 9 })
    const m = meta?.[c.key]?.[k] || {}
    const base = `${c.short}${k + 1}`
    const top = m.t ? `${base}: ${m.t}` : base
    const fch = m.f ? fechaCorta(m.f) : ''
    ws.getCell(R_SUB, c.cIni + k).value = fch ? `${top}\n${fch}` : top
  }
  for (const c of cats) {
    header(ws.getCell(R_SUB, c.cProm), { bg: 'FFfde3db', color: 'FF0F172A', size: 9 })
    ws.getCell(R_SUB, c.cProm).value = `Prom.\n${c.label.replace(/\s*\(.*/, '')}\n(${c.peso}%)`
  }
  header(ws.getCell(R_SUB, colAcum), { bg: 'FFd2452a', size: 10 }); ws.getCell(R_SUB, colAcum).value = 'PROMEDIO\nDEL PARCIAL'
  ws.getRow(R_SUB).height = 40

  const dvGrade = { type: 'decimal', operator: 'between', formulae: ['0', '10'], allowBlank: true, showErrorMessage: true, errorTitle: 'Calificación inválida', error: 'Captura un valor entre 0 y 10.' }

  for (let r = R_FIRST; r <= R_LAST; r++) {
    const a = alumnos[r - R_FIRST]
    const cNo = ws.getCell(r, colNo); cNo.value = r - R_FIRST + 1; cNo.alignment = centro; cNo.border = borde(); cNo.font = { size: 10, name: 'Calibri' }
    const cNom = ws.getCell(r, colNom); cNom.value = a?.nombre || null; cNom.alignment = { horizontal: 'left', vertical: 'middle' }; cNom.border = borde(); cNom.font = { size: 10, name: 'Calibri' }
    for (const c of cats) {
      const valores = a?.g?.[c.key] || []
      for (let k = 0; k < c.n; k++) {
        const cell = ws.getCell(r, c.cIni + k)
        const v = valores[k]
        if (v !== '' && v != null && !isNaN(v)) cell.value = Number(v)
        cell.alignment = centro; cell.border = borde(); cell.numFmt = '0.0'; cell.font = { size: 9, name: 'Calibri' }
        cell.dataValidation = dvGrade
      }
      const rng = `${numToCol(c.cIni)}${r}:${numToCol(c.cFin)}${r}`
      const cp = ws.getCell(r, c.cProm); cp.value = { formula: `IFERROR(AVERAGE(${rng}),"")` }
      cp.alignment = centro; cp.border = borde(); cp.numFmt = '0.0'; cp.font = { size: 10, name: 'Calibri' }
    }
    const refs = cats.map(c => ({ ref: `${numToCol(c.cProm)}${r}`, w: c.peso / 100 }))
    const num = refs.map(x => `IF(ISNUMBER(${x.ref}),${x.ref}*${x.w},0)`).join('+')
    const den = refs.map(x => `IF(ISNUMBER(${x.ref}),${x.w},0)`).join('+')
    const ca = ws.getCell(r, colAcum); ca.value = { formula: `IF((${den})=0,"",(${num})/(${den}))` }
    ca.alignment = centro; ca.border = borde(); ca.numFmt = '0.0'; ca.font = { size: 10, bold: true, name: 'Calibri' }
  }

  for (const c of cats) semaforo(ws, `${numToCol(c.cProm)}${R_FIRST}:${numToCol(c.cProm)}${R_LAST}`)
  semaforo(ws, `${numToCol(colAcum)}${R_FIRST}:${numToCol(colAcum)}${R_LAST}`)

  ws.getColumn(colNo).width = 5
  ws.getColumn(colNom).width = 30
  for (const c of cats) for (let k = 0; k < c.n; k++) {
    const tlen = meta?.[c.key]?.[k]?.t?.length || 0
    ws.getColumn(c.cIni + k).width = tlen ? Math.max(10, Math.min(18, tlen + 3)) : 5.5
  }
  for (const c of cats) ws.getColumn(c.cProm).width = 11
  ws.getColumn(colAcum).width = 13
  ws.views = [{ state: 'frozen', xSplit: 2, ySplit: R_SUB }]

  return { colAcum, colNom, R_FIRST, R_LAST }
}

// ── Hoja de Resumen: referencia los parciales y calcula el promedio final ──
function construirHojaResumen(ws, { numAlumnos, parciales }) {
  const R_TITLE = 1, R_HEAD = 2, R_FIRST = 3
  const R_LAST = R_FIRST + numAlumnos - 1
  const colNo = 1, colNom = 2, colP1 = 3, colFinal = 6
  const lastCol = colFinal

  ws.mergeCells(R_TITLE, 1, R_TITLE, lastCol)
  const t = ws.getCell(R_TITLE, 1); t.value = 'RESUMEN DEL SEMESTRE'
  t.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 15, name: 'Calibri' }
  t.fill = fill('FFd2452a'); t.alignment = centro
  ws.getRow(R_TITLE).height = 24

  header(ws.getCell(R_HEAD, colNo)); ws.getCell(R_HEAD, colNo).value = 'No.'
  header(ws.getCell(R_HEAD, colNom)); ws.getCell(R_HEAD, colNom).value = 'Nombre del alumno'
  header(ws.getCell(R_HEAD, 3), { bg: 'FF0F766E' }); ws.getCell(R_HEAD, 3).value = 'Parcial 1'
  header(ws.getCell(R_HEAD, 4), { bg: 'FF0F766E' }); ws.getCell(R_HEAD, 4).value = 'Parcial 2'
  header(ws.getCell(R_HEAD, 5), { bg: 'FF0F766E' }); ws.getCell(R_HEAD, 5).value = 'Parcial 3'
  header(ws.getCell(R_HEAD, colFinal), { bg: 'FFd2452a' }); ws.getCell(R_HEAD, colFinal).value = 'PROMEDIO FINAL'
  ws.getRow(R_HEAD).height = 22

  const acumL = numToCol(parciales[0].colAcum)
  const nomL  = numToCol(parciales[0].colNom)

  for (let i = 0; i < numAlumnos; i++) {
    const rr = R_FIRST + i
    const pr = parciales[0].R_FIRST + i
    const cNo = ws.getCell(rr, colNo); cNo.value = i + 1; cNo.alignment = centro; cNo.border = borde(); cNo.font = { size: 10, name: 'Calibri' }
    const cNom = ws.getCell(rr, colNom); cNom.value = { formula: `IF('Parcial 1'!${nomL}${pr}=0,"",'Parcial 1'!${nomL}${pr})` }
    cNom.alignment = { horizontal: 'left', vertical: 'middle' }; cNom.border = borde(); cNom.font = { size: 10, name: 'Calibri' }
    for (let p = 0; p < 3; p++) {
      const cell = ws.getCell(rr, colP1 + p)
      cell.value = { formula: `'Parcial ${p + 1}'!${acumL}${pr}` }
      cell.alignment = centro; cell.border = borde(); cell.numFmt = '0.0'; cell.font = { size: 10, name: 'Calibri' }
    }
    const c1 = `${numToCol(colP1)}${rr}`, c2 = `${numToCol(colP1 + 1)}${rr}`, c3 = `${numToCol(colP1 + 2)}${rr}`
    const cf = ws.getCell(rr, colFinal); cf.value = { formula: `IFERROR(AVERAGE(${c1},${c2},${c3}),"")` }
    cf.alignment = centro; cf.border = borde(); cf.numFmt = '0.0'; cf.font = { size: 11, bold: true, name: 'Calibri' }
  }

  for (let c = colP1; c <= colFinal; c++) semaforo(ws, `${numToCol(c)}${R_FIRST}:${numToCol(c)}${R_LAST}`)

  ws.getColumn(colNo).width = 5
  ws.getColumn(colNom).width = 32
  for (let c = colP1; c <= colFinal; c++) ws.getColumn(c).width = 14
  ws.views = [{ state: 'frozen', ySplit: R_HEAD }]
}

/**
 * @param {{ numAlumnos:number, categorias: Array<{key,label,short,n,peso}>,
 *           alumnos: Array<{nombre, p: Array<Record<string, string[]>>}> }} config
 */
export async function generarRegistroSemestreXLSX(config) {
  const [{ default: ExcelJS }, { saveAs }] = await Promise.all([import('exceljs'), import('file-saver')])

  const numAlumnos = Math.max(1, Math.min(200, Number(config.numAlumnos) || 45))
  const catsBase = (config.categorias || []).filter(c => c.n > 0)
  const alumnos = config.alumnos || []
  const metaSem = config.meta || []   // meta[pi] = { trab:[{t,f}], ... }

  const wb = new ExcelJS.Workbook(); wb.creator = 'Planea-Pro'
  const parciales = []
  for (let pi = 0; pi < 3; pi++) {
    const ws = wb.addWorksheet(`Parcial ${pi + 1}`)
    const r = construirHojaParcial(ws, {
      titulo: `REGISTRO DE CALIFICACIONES — PARCIAL ${pi + 1}`,
      numAlumnos,
      categorias: catsBase.map(c => ({ ...c })),
      alumnos: alumnos.map(a => ({ nombre: a.nombre, g: a.p?.[pi] || {} })),
      meta: metaSem[pi] || {},
    })
    parciales.push(r)
  }
  construirHojaResumen(wb.addWorksheet('Resumen'), { numAlumnos, parciales })

  const buf = await wb.xlsx.writeBuffer()
  const slug = String(config.nombreArchivo || '').trim().replace(/[^\p{L}\p{N}_ -]/gu, '').replace(/\s+/g, '_').slice(0, 60)
  const nombre = slug ? `Registro_${slug}.xlsx` : 'Registro_Calificaciones.xlsx'
  saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), nombre)
}
