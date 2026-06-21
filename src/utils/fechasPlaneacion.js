// Asigna fechas a las sesiones/actividades de la planeación a partir de la
// distribución del Planificador de Horarios (calcularPlaneacion), de modo que
// la planeación impresa y la "Distribución por semana" siempre coincidan.
//
// El planificador da un rango de fechas por PF/RA (subunidad). Aquí repartimos
// las sesiones de cada PF/RA DENTRO de ese rango, proporcional a sus horas.

import { calcularPlaneacion, formatDate } from './calculos'

// Reparte las semanas del rango de un PF/RA entre sus sesiones, proporcional a
// las horas de cada sesión (fracción acumulada). Devuelve [{fechaInicio, fechaFin}].
function repartirSemanas(weeks, sesiones, getHoras) {
  const W = weeks.length
  const total = sesiones.reduce((s, x) => s + (Number(getHoras(x)) || 0), 0)
  const totalEfectivo = total > 0 ? total : sesiones.length

  let acum = 0
  return sesiones.map(s => {
    const h = total > 0 ? (Number(getHoras(s)) || 0) : 1
    const cs = acum / totalEfectivo
    acum += h
    const ce = acum / totalEfectivo

    let startIdx = Math.floor(cs * W)
    let endIdx   = Math.ceil(ce * W) - 1
    startIdx = Math.min(Math.max(startIdx, 0), W - 1)
    endIdx   = Math.min(Math.max(endIdx, startIdx), W - 1)

    return {
      fechaInicio: formatDate(weeks[startIdx].lunesEfectivo),
      fechaFin:    formatDate(weeks[endIdx].viernesEfectivo),
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

    const rangos = repartirSemanas(weeks, sesiones, s => (s.duracionHoras ?? s.horas))
    sesiones.forEach((s, k) => {
      s.fechaInicio = rangos[k].fechaInicio
      s.fechaFin    = rangos[k].fechaFin
    })
  })

  return planeacion
}
