import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'
import { schemaModelo2023 } from './schema.js'

const ajv = new Ajv2020({ allErrors: true, strict: false })
addFormats(ajv)

const validateSchema = ajv.compile(schemaModelo2023)

export function normalizarPlaneacion2023(planeacion) {
  if (!planeacion || typeof planeacion !== 'object') return planeacion

  const normalizada = JSON.parse(JSON.stringify(planeacion))

  for (const unidad of (normalizada.unidades || [])) {
    for (const ra of (unidad.ras || [])) {
      if (!ra.nombre && ra.titulo) ra.nombre = ra.titulo
      if (!ra.titulo && ra.nombre) ra.titulo = ra.nombre

      const ev = ra.actividadEvaluacion || {}
      if (!ev.nombre) ev.nombre = ev.descripcion || ev.codigo || 'Actividad de evaluacion'
      if (!ev.instrumento) ev.instrumento = ev.evidencia || 'Rubrica'
      ra.actividadEvaluacion = ev
    }
  }

  return normalizada
}

// ─── Helpers internos ─────────────────────────────────────────
function sumaPor(arr, campo) {
  return (arr || []).reduce((acc, item) => acc + (Number(item[campo]) || 0), 0)
}

/** Convierte los errores de ajv en mensajes legibles. */
function erroresAjv(errors) {
  return (errors || []).map(err => {
    const path = err.instancePath || '(raíz)'
    return `[schema] ${path}: ${err.message}`
  })
}

// ─── Nivel 1: validarEstructura2023 ──────────────────────────
/**
 * Valida la estructura básica (cabecera + unidades + RAs sin actividades).
 * Úsala después del Prompt 1 de generación IA.
 *
 * Valida:
 *   - JSON Schema (tipos, formatos, campos requeridos)
 *   - Suma de horasUnidades === modulo.horasTotales
 *   - Suma de horasRAs por unidad === unidad.duracionHoras
 *   - Suma de ponderaciones de todos los RAs === 100
 *
 * Devuelve { ok: boolean, errores: string[] }
 */
export function validarEstructura2023(planeacion) {
  planeacion = normalizarPlaneacion2023(planeacion)
  const errores = []

  // 1) JSON Schema
  const schemaOk = validateSchema(planeacion)
  if (!schemaOk) {
    return { ok: false, errores: erroresAjv(validateSchema.errors) }
  }

  // 2.a) Suma de horas de unidades === horasTotales del módulo
  const sumaUnidades = sumaPor(planeacion.unidades, 'duracionHoras')
  const horasTotales = planeacion.cabecera.modulo.horasTotales
  if (Math.abs(sumaUnidades - horasTotales) > 0.01) {
    errores.push(
      `Suma de horas de unidades (${sumaUnidades}) ≠ horasTotales del módulo (${horasTotales}).`
    )
  }

  // 2.b) Suma de horas de RAs por unidad === unidad.duracionHoras
  for (const unidad of planeacion.unidades) {
    const sumaRAs = sumaPor(unidad.ras, 'duracionHoras')
    if (Math.abs(sumaRAs - unidad.duracionHoras) > 0.01) {
      errores.push(
        `Unidad ${unidad.numero}: suma de horas de RAs (${sumaRAs}) ≠ duracionHoras de la unidad (${unidad.duracionHoras}).`
      )
    }
  }

  // 2.c) Suma de ponderaciones === 100
  const todasLasRAs = planeacion.unidades.flatMap(u => u.ras)
  const sumaPonderaciones = todasLasRAs.reduce(
    (acc, ra) => acc + (ra.actividadEvaluacion?.ponderacion || 0), 0
  )
  if (Math.abs(sumaPonderaciones - 100) > 0.01) {
    errores.push(
      `Suma de ponderaciones de todos los RAs (${sumaPonderaciones.toFixed(1)}) debe ser exactamente 100.`
    )
  }

  return { ok: errores.length === 0, errores }
}

// ─── Nivel 2: validarPlaneacionCompleta2023 ───────────────────
/**
 * Valida la planeación completa incluyendo actividades específicas y momentos.
 * Úsala después del Prompt 2 (cuando actividadesEspecificas ya están rellenas).
 *
 * Además de todo lo de validarEstructura2023, valida:
 *   - Cada RA tiene al menos 1 actividad específica
 *   - Suma de horas de actividades por RA === ra.duracionHoras
 *   - Suma de horas de momentos por actividad === actividad.duracionHoras
 *   - La última actividad de cada RA menciona rúbrica en el Cierre
 *   - Fechas de actividades dentro del rango del semestre
 *   - Actividades secuenciales sin traslapes
 */
export function validarPlaneacionCompleta2023(planeacion) {
  planeacion = normalizarPlaneacion2023(planeacion)
  // Primero la validación base
  const base = validarEstructura2023(planeacion)
  if (!base.ok) return base

  const errores = []
  const inicioSem = planeacion.cabecera.calendario.fechaInicioSemestre
  const finSem    = planeacion.cabecera.calendario.fechaFinSemestre

  for (const unidad of planeacion.unidades) {
    for (const ra of unidad.ras) {
      const acts = ra.actividadesEspecificas || []

      // RA debe tener al menos 1 actividad cuando la planeación es completa
      if (acts.length === 0) {
        errores.push(`RA ${ra.codigo}: no tiene actividades específicas.`)
        continue
      }

      // Suma de horas de actividades === ra.duracionHoras
      const sumaActividades = sumaPor(acts, 'duracionHoras')
      if (Math.abs(sumaActividades - ra.duracionHoras) > 0.01) {
        errores.push(
          `RA ${ra.codigo}: suma de horas de actividades (${sumaActividades}) ≠ duracionHoras del RA (${ra.duracionHoras}).`
        )
      }

      for (const act of acts) {
        // Suma de horas de momentos === actividad.duracionHoras
        const sumaMomentos =
          (act.momentos?.inicio?.tiempoHoras     || 0) +
          (act.momentos?.desarrollo?.tiempoHoras || 0) +
          (act.momentos?.cierre?.tiempoHoras     || 0)
        if (Math.abs(sumaMomentos - act.duracionHoras) > 0.01) {
          errores.push(
            `RA ${ra.codigo} actividad ${act.numero}: suma de horas de momentos (${sumaMomentos}) ≠ duracionHoras (${act.duracionHoras}).`
          )
        }

        // fechaInicio ≤ fechaFin
        if (act.fechaInicio && act.fechaFin && act.fechaInicio > act.fechaFin) {
          errores.push(
            `RA ${ra.codigo} actividad ${act.numero}: fechaInicio (${act.fechaInicio}) > fechaFin (${act.fechaFin}).`
          )
        }

        // Fechas dentro del semestre
        if (inicioSem && finSem) {
          if (act.fechaInicio && (act.fechaInicio < inicioSem || act.fechaInicio > finSem)) {
            errores.push(`RA ${ra.codigo} actividad ${act.numero}: fechaInicio fuera del semestre.`)
          }
          if (act.fechaFin && (act.fechaFin < inicioSem || act.fechaFin > finSem)) {
            errores.push(`RA ${ra.codigo} actividad ${act.numero}: fechaFin fuera del semestre.`)
          }
        }
      }

      // Actividades sin traslapes (no el orden de fechas, pero sí que no se pisen)
      for (let i = 1; i < acts.length; i++) {
        const prev = acts[i - 1]
        const curr = acts[i]
        if (prev.fechaFin && curr.fechaInicio && curr.fechaInicio < prev.fechaFin) {
          errores.push(
            `RA ${ra.codigo}: la actividad ${curr.numero} inicia (${curr.fechaInicio}) antes de que termine la anterior (${prev.fechaFin}).`
          )
        }
      }

      // Última actividad → el Cierre debe mencionar la rúbrica y el código de evaluación
      const ultima = acts[acts.length - 1]
      const cierreTxt = (ultima?.momentos?.cierre?.estrategiaEvaluacion || '').toLowerCase()
      const codigoEval = ra.actividadEvaluacion?.codigo

      if (!cierreTxt.includes('rúbrica') && !cierreTxt.includes('rubrica')) {
        errores.push(
          `RA ${ra.codigo}: el Cierre de la última actividad debe mencionar la aplicación de la rúbrica oficial.`
        )
      }
      if (codigoEval && !cierreTxt.includes(codigoEval.toLowerCase())) {
        errores.push(
          `RA ${ra.codigo}: el Cierre de la última actividad debe mencionar el código de la actividad de evaluación (${codigoEval}).`
        )
      }
    }
  }

  return { ok: errores.length === 0, errores }
}

/**
 * Alias de compatibilidad: valida estructura + completa si hay actividades.
 */
export function validarPlaneacion2023(planeacion) {
  const tieneActividades = (planeacion?.unidades || [])
    .flatMap(u => u.ras)
    .some(ra => (ra.actividadesEspecificas || []).length > 0)

  return tieneActividades
    ? validarPlaneacionCompleta2023(planeacion)
    : validarEstructura2023(planeacion)
}
