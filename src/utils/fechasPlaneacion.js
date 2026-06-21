// Asigna fechas a las sesiones/actividades de la planeación a partir de la
// distribución del Planificador de Horarios (calcularPlaneacion), de modo que
// la planeación impresa y la "Distribución por semana" siempre coincidan.
//
// El planificador da un rango de fechas por PF/RA (subunidad). Aquí repartimos
// las sesiones de cada PF/RA DENTRO de ese rango, proporcional a sus horas.

import { calcularPlaneacion, formatDate } from './calculos'

// Días hábiles (Lun-Vie) dentro de las semanas del rango de un PF/RA.
function diasHabilesDeWeeks(weeks) {
  const dias = []
  for (const w of weeks) {
    const ini = new Date(w.lunesEfectivo)
    const fin = new Date(w.viernesEfectivo)
    for (let d = new Date(ini); d <= fin; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay()
      if (dow >= 1 && dow <= 5) dias.push(new Date(d))
    }
  }
  return dias
}

// Reparte las sesiones de un PF/RA en bloques de días hábiles SECUENCIALES y
// SIN TRASLAPE, proporcional a las horas de cada sesión. Devuelve
// [{fechaInicio, fechaFin}] en el mismo orden que `sesiones`.
function repartirEnDias(weeks, sesiones, getHoras) {
  const dias = diasHabilesDeWeeks(weeks)
  const D = dias.length
  const N = sesiones.length
  if (D === 0 || N === 0) return sesiones.map(() => ({ fechaInicio: '', fechaFin: '' }))

  const total = sesiones.reduce((s, x) => s + (Number(getHoras(x)) || 0), 0)

  let cursor = 0
  return sesiones.map((s, k) => {
    const restantes = N - k - 1
    let count
    if (k === N - 1) {
      count = Math.max(1, D - cursor)                       // la última absorbe el resto
    } else {
      const h = total > 0 ? (Number(getHoras(s)) || 0) : 1
      count = total > 0 ? Math.round((h / total) * D) : Math.round(D / N)
      if (count < 1) count = 1
      const maxCount = D - cursor - restantes               // dejar ≥1 día a cada sesión restante
      if (count > maxCount) count = Math.max(1, maxCount)
    }
    const iniIdx = Math.min(cursor, D - 1)
    const finIdx = Math.min(cursor + count - 1, D - 1)
    cursor = Math.min(cursor + count, D)
    return {
      fechaInicio: formatDate(dias[iniIdx]),
      fechaFin:    formatDate(dias[finIdx]),
    }
  })
}

/**
 * Asigna fechaInicio/fechaFin a cada sesión/actividad usando el reparto del
 * Planificador de Horarios. Muta `planeacion` (pásala clonada si necesitas
 * conservar el original).
 *
 * @param {{ semestre, horasSemana, periodosVacacionales, unidades, planeacion, modelo }} args
 *   - unidades: forma del planificador ({ subunidades: [{ horas }] }), en el MISMO
 *     orden que los PF/RA de la planeación (usar extraerUnidadesDesde2023/2025).
 *   - modelo: '2025' → planeacion.propositosFormativos[].sesiones;
 *             '2023' → planeacion.unidades[].ras[].actividadesEspecificas.
 * @returns {Object} la misma planeación, con fechas asignadas.
 */
export function aplicarFechasDesdeHorario({ semestre, horasSemana, periodosVacacionales = [], unidades, planeacion, modelo }) {
  if (!semestre?.fechaInicio || !semestre?.fechaFin || !horasSemana) return planeacion

  const dist = calcularPlaneacion(semestre, horasSemana, periodosVacacionales, unidades)
  if (!dist) return planeacion
  const { planeacion: subs, semanasHabilesDetalle: semanas } = dist

  // Grupos de sesiones en el MISMO orden que las subunidades del planificador.
  const grupos = []
  if (String(modelo) === '2025') {
    for (const pf of (planeacion.propositosFormativos || [])) grupos.push(pf.sesiones || [])
  } else {
    for (const u of (planeacion.unidades || [])) for (const ra of (u.ras || [])) grupos.push(ra.actividadesEspecificas || [])
  }

  subs.forEach((sub, i) => {
    const sesiones = grupos[i] || []
    if (sesiones.length === 0) return

    if (sub.sinCapacidad || sub.semanaInicio == null) {
      sesiones.forEach(s => { s.fechaInicio = ''; s.fechaFin = '' })
      return
    }

    const weeks = semanas.filter(w => w.numero >= sub.semanaInicio && w.numero <= sub.semanaFin)
    if (weeks.length === 0) return

    const rangos = repartirEnDias(weeks, sesiones, s => (s.duracionHoras ?? s.horas))
    sesiones.forEach((s, k) => {
      s.fechaInicio = rangos[k].fechaInicio
      s.fechaFin    = rangos[k].fechaFin
    })
  })

  return planeacion
}
