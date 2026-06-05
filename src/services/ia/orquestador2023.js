/**
 * Orquestador del flujo completo de generación Modelo 2023.
 *
 * Flujo:
 *   1. Validar requisitos previos (perfil docente, semestre, PDFs)
 *   2. Extraer estructura con Prompt 1 → validarEstructura2023
 *   3. Generar actividadesEspecificas para cada RA en lotes de 3 (Prompt 2)
 *   4. calcularFechas() distribuye el calendario
 *   5. validarPlaneacionCompleta2023 → devolver resultado + errores
 */

import { extraerEstructura2023, generarActividadesParaRA2023, iniciarSesion2023, finalizarSesion2023 } from './gemini2023.js'
import { calcularFechas, validarEstructura2023, validarPlaneacionCompleta2023, actividadesSugeridasPorRA, distribuirHorasEntreActividades, calcularHorasSemana } from '../../modelos/2023/index.js'
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

// ─── Validación previa ────────────────────────────────────────
/**
 * Verifica que todos los requisitos estén completos ANTES de descontar el crédito.
 * Devuelve null si todo ok, o string con el mensaje de error.
 */
// horasSemana ya NO se valida — se calcula automáticamente después de extraer la estructura
export function validarRequisitos2023({ perfilDocente, semestre, pdfPE, pdfGPE }) {
  if (!tieneDatosCompletos2023(perfilDocente)) {
    return 'El perfil docente está incompleto. Ve a "Mi perfil" y agrega número de empleado y plantel.'
  }
  if (!semestre?.fechaInicio || !semestre?.fechaFin) {
    return 'La materia no tiene fechas de semestre configuradas.'
  }
  if (!pdfPE || pdfPE.type !== 'application/pdf') {
    return 'Debes subir el Programa de Estudios (PE) en formato PDF.'
  }
  if (!pdfGPE || pdfGPE.type !== 'application/pdf') {
    return 'Debes subir la Guía Pedagógica y de Evaluación (GPE) en formato PDF.'
  }
  const tamanoMB = (pdfPE.size + pdfGPE.size) / (1024 * 1024)
  if (tamanoMB > 50) {
    return `Los PDFs combinados pesan ${tamanoMB.toFixed(1)} MB. El límite recomendado es 50 MB.`
  }
  return null
}

// ─── Orquestador principal ────────────────────────────────────
/**
 * Genera una planeación completa del Modelo 2023.
 *
 * @param {{ pdfPE, pdfGPE, datosDocente, calendario, onProgreso }} input
 * @returns {{ planeacion, errores, rasConError, advertenciasEstructura }}
 */
export async function generarPlaneacion2023Completa({ pdfPE, pdfGPE, datosDocente, calendario, materiaId = null, onProgreso = () => {} }) {

  const prog = (phase, message, current = 0, total = 100) =>
    onProgreso({ phase, message, current, total })

  // ── Abrir sesión de generación (descuenta el costo en el servidor) ──
  // Todo el costo de la generación queda cubierto por esta única sesión.
  // Si ya se pagó el horario de esta materia, el servidor aplica el anticipo.
  // Si algo falla, finalizarSesion2023(sessionId, false) reembolsa.
  const sessionId = await iniciarSesion2023(materiaId)

  try {
    return await ejecutarGeneracion2023({ pdfPE, pdfGPE, datosDocente, calendario, prog, sessionId })
  } catch (err) {
    await finalizarSesion2023(sessionId, false)
    throw err
  }
}

// Cuerpo real de la generación; la sesión (crédito) la gestiona el wrapper.
async function ejecutarGeneracion2023({ pdfPE, pdfGPE, datosDocente, calendario, prog, sessionId }) {

  // ── Paso 1: Extraer estructura ────────────────────────────
  prog('estructura', 'Extrayendo estructura del módulo desde el PE y GPE…', 0)

  let estructura
  try {
    estructura = await extraerEstructura2023(pdfPE, pdfGPE, datosDocente, calendario, sessionId)
  } catch (err) {
    throw new Error(`No se pudo extraer la estructura del módulo: ${err.message}`)
  }

  // ── Recalcular horasSemana con el calendario REAL del docente ──
  // Sobrescribe lo que Gemini extrajo del PE (que puede ser inexacto).
  // Garantiza que horasSemana × semanasHábiles === horasTotales por construcción.
  const { horasSemana: horasSemanaCalculada, semanasHabiles } = calcularHorasSemana({
    horasTotales:     estructura.cabecera?.modulo?.horasTotales || 0,
    fechaInicio:      calendario.fechaInicioSemestre,
    fechaFin:         calendario.fechaFinSemestre,
    diasNoLaborables: calendario.diasNoLaborables || [],
  })
  console.log('📊 [orquestador2023] Horas calculadas automáticamente:', {
    horasTotales:               estructura.cabecera?.modulo?.horasTotales,
    semanasHabiles,
    horasSemanaCalculada,
    horasSemanaQueVeniaDeLaIA:  estructura.cabecera?.modulo?.horasSemana,
  })
  if (estructura.cabecera?.modulo) {
    estructura.cabecera.modulo.horasSemana = horasSemanaCalculada
  }
  // Siempre sobreescribir el calendario con el que viene del docente
  estructura.cabecera.calendario = calendario

  // Validar estructura (warnings, no abortar)
  const valEstructura = validarEstructura2023(estructura)
  const advertenciasEstructura = valEstructura.errores

  if (advertenciasEstructura.length > 0) {
    console.warn('[orquestador2023] Advertencias de estructura:', advertenciasEstructura)
  }

  prog('estructura', 'Estructura extraída correctamente.', 20)

  // ── Paso 2: Generar actividades para cada RA en paralelo ──
  const todosLosRAs = []
  for (const unidad of (estructura.unidades || [])) {
    for (const ra of (unidad.ras || [])) {
      todosLosRAs.push({ ra, unidad })
    }
  }

  if (todosLosRAs.length === 0) {
    throw new Error('La estructura extraída no contiene Resultados de Aprendizaje. Verifica que el PDF sea el PE correcto.')
  }

  prog('actividades', `Generando actividades de ${todosLosRAs.length} resultados de aprendizaje…`, 20)

  // Calcular fecha de inicio estimada para cada RA (secuencial)
  const horasSemana   = estructura.cabecera?.modulo?.horasSemana || 4
  let   fechaCursor   = calendario.fechaInicioSemestre

  const tareas = todosLosRAs.map(({ ra }, i) => {
    const fechaInicioRA = fechaCursor
    fechaCursor = sumarDias(fechaCursor, Math.ceil(ra.duracionHoras / horasSemana) * 7)

    return async () => {
      try {
        const distribucionHoras = distribuirHorasEntreActividades(ra.duracionHoras)
        const actividades = await generarActividadesParaRA2023({
          pdfPE,
          pdfGPE,
          cabecera:   estructura.cabecera,
          raObjetivo: ra,
          parametros: {
            actividadesObjetivo:       distribucionHoras.length,
            distribucionHoras,          // guía obligatoria de horas por actividad
            horasMaximasPorActividad:  7,
          },
          sessionId,
        })
        ra.actividadesEspecificas = Array.isArray(actividades) ? actividades : []

        prog(
          'actividades',
          `RA ${ra.codigo} listo (${i + 1}/${todosLosRAs.length})`,
          20 + Math.round(((i + 1) / todosLosRAs.length) * 65)
        )
        return { ok: true, codigo: ra.codigo }
      } catch (err) {
        console.error(`[orquestador2023] Error en RA ${ra.codigo}:`, err)
        ra.actividadesEspecificas = []
        return { ok: false, codigo: ra.codigo, error: err.message }
      }
    }
  })

  // Máximo 3 llamadas concurrentes para no saturar la API
  const resultados = await procesarEnLotes(tareas, 3)

  // ── Paso 3: Calcular fechas ───────────────────────────────
  prog('fechas', 'Calculando calendario del semestre…', 88)
  let planeacionConFechas
  try {
    planeacionConFechas = calcularFechas(estructura)
  } catch (err) {
    console.error('[orquestador2023] Error calculando fechas:', err)
    planeacionConFechas = estructura // usar sin fechas antes que fallar
  }

  // ── Paso 4: Validación completa ───────────────────────────
  const valCompleta = validarPlaneacionCompleta2023(planeacionConFechas)

  prog('done', 'Planeación generada.', 100)

  // Generación exitosa: confirma la sesión (consume el crédito definitivamente).
  await finalizarSesion2023(sessionId, true)

  return {
    planeacion:             planeacionConFechas,
    errores:                valCompleta.errores,
    rasConError:            resultados.filter(r => !r.ok),
    advertenciasEstructura,
  }
}
