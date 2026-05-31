import { parseLocalDate } from './calculos'
import { isBefore, isAfter, isEqual } from 'date-fns'

export function validarEntrada(semestre, horasSemana, periodosVacacionales, unidades) {
  const errores = []
  const advertencias = []

  if (!semestre.fechaInicio) errores.push('La fecha de inicio del semestre es obligatoria.')
  if (!semestre.fechaFin) errores.push('La fecha de fin del semestre es obligatoria.')

  if (semestre.fechaInicio && semestre.fechaFin) {
    const inicio = parseLocalDate(semestre.fechaInicio)
    const fin = parseLocalDate(semestre.fechaFin)
    if (!isBefore(inicio, fin)) errores.push('La fecha de inicio debe ser anterior a la fecha de fin.')
  }

  if (!horasSemana || Number(horasSemana) <= 0) {
    errores.push('Las horas semanales deben ser un número mayor a 0.')
  }

  // Validar períodos vacacionales
  for (const p of periodosVacacionales) {
    if (!p.fechaInicio || !p.fechaFin) {
      errores.push(`Período vacacional incompleto (faltan fechas).`)
      continue
    }
    const pI = parseLocalDate(p.fechaInicio)
    const pF = parseLocalDate(p.fechaFin)
    if (!isBefore(pI, pF) && !isEqual(pI, pF)) {
      errores.push(`El período vacacional "${p.nombre || ''}" tiene fecha de inicio posterior a la de fin.`)
    }
    if (semestre.fechaInicio && semestre.fechaFin) {
      const sI = parseLocalDate(semestre.fechaInicio)
      const sF = parseLocalDate(semestre.fechaFin)
      if (isAfter(pI, sF) || isBefore(pF, sI)) {
        advertencias.push(`El período vacacional "${p.nombre || p.fechaInicio}" está fuera del rango del semestre.`)
      }
    }
  }

  // Validar unidades
  const subHoras = []
  for (const u of unidades) {
    if (!u.nombre?.trim()) advertencias.push(`Una unidad no tiene nombre.`)
    for (const s of u.subunidades) {
      if (!s.nombre?.trim()) advertencias.push(`Una subunidad en "${u.nombre}" no tiene nombre.`)
      const h = Number(s.horas)
      if (isNaN(h) || h <= 0) errores.push(`La subunidad "${s.nombre}" tiene horas inválidas.`)
      else subHoras.push(h)
    }
  }

  return { errores, advertencias }
}

// Redondea a 1 decimal y elimina ceros finales (evita 14.400000000000006)
export function fmtHoras(n) {
  return Number(Number(n).toFixed(1))
}

export function validarCapacidad(resumen) {
  const msgs = []
  let esValido = true

  if (resumen.totalHoras > resumen.capacidadTotal) {
    esValido = false
    msgs.push(`Las horas del programa (${fmtHoras(resumen.totalHoras)}h) exceden la capacidad del semestre (${fmtHoras(resumen.capacidadTotal)}h). Faltan ${fmtHoras(resumen.totalHoras - resumen.capacidadTotal)}h de capacidad.`)
  } else if (resumen.horasRestantes > 0) {
    msgs.push(`Quedan ${fmtHoras(resumen.horasRestantes)}h disponibles (${(resumen.horasRestantes / resumen.horasSemana).toFixed(1)} semanas sin asignar).`)
  }

  if (resumen.semanasHabiles === 0) {
    esValido = false
    msgs.push('No hay semanas hábiles en el semestre configurado. Revisa las fechas y los períodos vacacionales.')
  }

  return { esValido, mensajes: msgs }
}
