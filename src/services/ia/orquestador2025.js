/**
 * Orquestador del flujo completo de generación Modelo 2025.
 *
 * Flujo:
 *   1. Validar requisitos previos (perfil docente, semestre, PDF único)
 *   2. Extraer estructura con Prompt 1 → propositosFormativos[]
 *   3. Generar sesiones didácticas para cada PF en lotes de 3 (Prompt 2)
 *   4. calcularFechas2025() distribuye el calendario
 *   5. Devolver resultado + errores
 *
 * Diferencias vs orquestador2023:
 *   - Solo un PDF de entrada (PE integrado, sin GPE).
 *   - La unidad de trabajo es el Propósito Formativo (PF) en lugar del RA.
 *   - Las "sesiones" equivalen a "actividadesEspecificas" del 2023.
 */

import { extraerEstructura2025, generarSesionesParaPF2025, iniciarSesion2025, finalizarSesion2025 } from './gemini2025.js'
import { calcularHorasSemana } from '../../modelos/2023/calendario.js'
import { tieneDatosCompletos2023 } from '../userService.js'

// ─── Helpers privados ─────────────────────────────────────────
function sumarDias(fechaISO, dias) {
  const d = new Date(fechaISO + 'T12:00:00')
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

async function procesarEnLotes(tareas, concurrencia = 3) {
  const resultados = []
  for (let i = 0; i < tareas.length; i += concurrencia) {
    const lote = tareas.slice(i, i + concurrencia)
    const res  = await Promise.all(lote.map(fn => fn()))
    resultados.push(...res)
  }
  return resultados
}

/**
 * Distribuye las horas de un PF en sesiones de máximo 7 horas.
 * Ejemplo: 9 horas → [3, 3, 3]
 */
function distribuirHorasEntreSesiones(horasTotales, maxPorSesion = 7) {
  if (horasTotales <= maxPorSesion) return [horasTotales]
  const numSesiones = Math.ceil(horasTotales / maxPorSesion)
  const base    = Math.floor(horasTotales / numSesiones)
  const resto   = horasTotales % numSesiones
  return Array.from({ length: numSesiones }, (_, i) => (i < resto ? base + 1 : base))
}

// ─── Validación previa ────────────────────────────────────────
/**
 * Verifica requisitos ANTES de descontar el crédito.
 * Devuelve null si todo ok, o string con el mensaje de error.
 */
export function validarRequisitos2025({ perfilDocente, semestre, pdfPE }) {
  if (!tieneDatosCompletos2023(perfilDocente)) {
    return 'El perfil docente está incompleto. Ve a "Mi perfil" y agrega número de empleado y plantel.'
  }
  if (!semestre?.fechaInicio || !semestre?.fechaFin) {
    return 'La materia no tiene fechas de semestre configuradas.'
  }
  if (!pdfPE || pdfPE.type !== 'application/pdf') {
    return 'Debes subir el Programa de Estudios (PE) en formato PDF.'
  }
  const tamanoMB = pdfPE.size / (1024 * 1024)
  if (tamanoMB > 50) {
    return `El PDF pesa ${tamanoMB.toFixed(1)} MB. El límite recomendado es 50 MB.`
  }
  return null
}

// ─── Cálculo de fechas para Modelo 2025 ──────────────────────
/**
 * Asigna fechaInicio / fechaFin a todas las sesiones de cada PF.
 * Equivale a calcularFechas() del 2023 pero opera sobre propositosFormativos[].sesiones[].
 */
function calcularFechas2025(planeacion) {
  const { parseISO, addDays, isWeekend, isEqual, isAfter, format } = require ? {} : {}

  // Importación dinámica no disponible en ESM — usamos implementación propia
  const horasSemana    = planeacion.cabecera?.asignatura?.horasSemana || 2
  const inicioISO      = planeacion.cabecera?.calendario?.fechaInicioSemestre
  const finISO         = planeacion.cabecera?.calendario?.fechaFinSemestre
  const diasNoLabISO   = planeacion.cabecera?.calendario?.diasNoLaborables || []

  if (!inicioISO || !finISO) return planeacion

  function toDate(iso) { return new Date(iso + 'T12:00:00') }
  function toISO(d) { return d.toISOString().slice(0, 10) }
  function esNoHabil(d) {
    const dia = d.getDay()
    if (dia === 0 || dia === 6) return true
    const iso = toISO(d)
    return diasNoLabISO.includes(iso)
  }
  function avanzarHabil(d) {
    const copia = new Date(d)
    while (esNoHabil(copia)) copia.setDate(copia.getDate() + 1)
    return copia
  }
  function retrocederHabil(d) {
    const copia = new Date(d)
    while (esNoHabil(copia)) copia.setDate(copia.getDate() - 1)
    return copia
  }

  const finSemestre = toDate(finISO)
  const copia  = JSON.parse(JSON.stringify(planeacion))
  let   cursor = avanzarHabil(toDate(inicioISO))

  for (const pf of (copia.propositosFormativos || [])) {
    for (const sesion of (pf.sesiones || [])) {
      const fechaInicio = avanzarHabil(cursor)
      const semanasNecesarias = Math.max(1, Math.ceil(sesion.duracionHoras / horasSemana))
      let   fechaFin = new Date(fechaInicio)
      fechaFin.setDate(fechaFin.getDate() + semanasNecesarias * 7 - 1)
      fechaFin = retrocederHabil(fechaFin)
      if (fechaFin > finSemestre) fechaFin = retrocederHabil(finSemestre)

      sesion.fechaInicio = toISO(fechaInicio)
      sesion.fechaFin    = toISO(fechaFin)
      cursor = fechaFin
    }
  }

  return copia
}

// ─── Orquestador principal ────────────────────────────────────
/**
 * Genera una planeación completa del Modelo 2025.
 *
 * @param {{ pdfPE, datosDocente, calendario, materiaId, onProgreso }} input
 * @returns {{ planeacion, errores, pfsConError }}
 */
export async function generarPlaneacion2025Completa({ pdfPE, datosDocente, calendario, materiaId = null, onProgreso = () => {} }) {

  const prog = (phase, message, current = 0, total = 100) =>
    onProgreso({ phase, message, current, total })

  const sessionId = await iniciarSesion2025(materiaId)

  try {
    return await ejecutarGeneracion2025({ pdfPE, datosDocente, calendario, prog, sessionId })
  } catch (err) {
    await finalizarSesion2025(sessionId, false)
    throw err
  }
}

async function ejecutarGeneracion2025({ pdfPE, datosDocente, calendario, prog, sessionId }) {

  // ── Paso 1: Extraer estructura ────────────────────────────
  prog('estructura', 'Extrayendo estructura de la asignatura desde el PE…', 0)

  let estructura
  try {
    estructura = await extraerEstructura2025(pdfPE, datosDocente, calendario, sessionId)
  } catch (err) {
    throw new Error(`No se pudo extraer la estructura: ${err.message}`)
  }

  // Recalcular horasSemana con el calendario real del docente
  const { horasSemana: horasSemanaCalculada } = calcularHorasSemana({
    horasTotales:     estructura.cabecera?.asignatura?.horasTotales || 0,
    fechaInicio:      calendario.fechaInicioSemestre,
    fechaFin:         calendario.fechaFinSemestre,
    diasNoLaborables: calendario.diasNoLaborables || [],
  })

  if (estructura.cabecera?.asignatura) {
    estructura.cabecera.asignatura.horasSemana = horasSemanaCalculada
  }
  estructura.cabecera.calendario = calendario

  const pfs = estructura.propositosFormativos || []
  if (pfs.length === 0) {
    throw new Error('La estructura extraída no contiene Propósitos Formativos. Verifica que el PDF sea el PE correcto del Modelo 2025.')
  }

  prog('estructura', `Estructura extraída: ${pfs.length} Propósitos Formativos.`, 20)

  // ── Paso 2: Generar sesiones para cada PF en paralelo ────
  prog('actividades', `Generando sesiones para ${pfs.length} Propósitos Formativos…`, 20)

  const horasSemana = estructura.cabecera?.asignatura?.horasSemana || 2
  let   fechaCursor = calendario.fechaInicioSemestre

  const tareas = pfs.map((pf, i) => {
    const fechaInicioPF = fechaCursor
    fechaCursor = sumarDias(fechaCursor, Math.ceil(pf.horas / horasSemana) * 7)

    return async () => {
      try {
        const distribucionHoras = distribuirHorasEntreSesiones(pf.horas)
        const sesiones = await generarSesionesParaPF2025({
          pdfPE,
          cabecera:  estructura.cabecera,
          pfObjetivo: pf,
          parametros: {
            sesionesObjetivo:   distribucionHoras.length,
            distribucionHoras,
            horasMaximasPorSesion: 7,
          },
          sessionId,
        })
        pf.sesiones = Array.isArray(sesiones) ? sesiones : []

        prog(
          'actividades',
          `PF ${pf.codigo} listo (${i + 1}/${pfs.length})`,
          20 + Math.round(((i + 1) / pfs.length) * 65)
        )
        return { ok: true, codigo: pf.codigo }
      } catch (err) {
        console.error(`[orquestador2025] Error en PF ${pf.codigo}:`, err)
        pf.sesiones = []
        return { ok: false, codigo: pf.codigo, error: err.message }
      }
    }
  })

  const resultados = await procesarEnLotes(tareas, 3)

  // ── Paso 3: Calcular fechas ───────────────────────────────
  prog('fechas', 'Calculando calendario del semestre…', 88)
  let planeacionConFechas
  try {
    planeacionConFechas = calcularFechas2025(estructura)
  } catch (err) {
    console.error('[orquestador2025] Error calculando fechas:', err)
    planeacionConFechas = estructura
  }

  // ── Paso 4: Resultado ─────────────────────────────────────
  const errores       = []
  const pfsConError   = resultados.filter(r => !r.ok)

  if (pfsConError.length > 0) {
    errores.push(`No se generaron sesiones para: ${pfsConError.map(r => r.codigo).join(', ')}.`)
  }

  prog('done', 'Planeación generada.', 100)
  await finalizarSesion2025(sessionId, true)

  return {
    planeacion:   planeacionConFechas,
    errores,
    pfsConError,
  }
}
