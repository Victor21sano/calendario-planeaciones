import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  isWithinInterval,
  isBefore,
  isAfter,
  parseISO,
  startOfDay,
  format,
  getDay,
  addDays,
  isEqual,
  differenceInCalendarDays,
} from 'date-fns'

/**
 * Parsea una fecha "YYYY-MM-DD" en hora local sin desplazamiento UTC.
 * Evita el bug de new Date("2026-01-15") que se interpreta en UTC.
 */
export function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return startOfDay(new Date(year, month - 1, day))
}

/**
 * Formatea una fecha local a "YYYY-MM-DD".
 */
export function formatDate(date) {
  return format(date, 'yyyy-MM-dd')
}

/**
 * Devuelve el lunes de la semana que contiene la fecha dada.
 */
function lunesDeLaSemana(date) {
  return startOfWeek(date, { weekStartsOn: 1 })
}

/**
 * Determina si un rango de lunes a viernes tiene al menos un día fuera de todos los períodos vacacionales.
 * Una semana es "hábil" si al menos un día Mon-Fri no cae en vacaciones Y está dentro del semestre.
 */
function semanaEsHabil(lunes, viernes, periodosVac, semestreInicio, semestreFin) {
  for (let d = 0; d <= 4; d++) {
    const dia = addDays(lunes, d)
    if (isBefore(dia, semestreInicio) || isAfter(dia, semestreFin)) continue
    if (!diaEnVacaciones(dia, periodosVac)) return true
  }
  return false
}

/**
 * Comprueba si una fecha cae dentro de algún período vacacional.
 */
function diaEnVacaciones(dia, periodosVac) {
  for (const p of periodosVac) {
    if (
      !isBefore(dia, p.inicio) &&
      !isAfter(dia, p.fin)
    ) return true
  }
  return false
}

/**
 * Genera la lista de semanas hábiles del semestre.
 * Cada semana hábil es: { numero, lunes, viernes, lunesSem, viernesSem }
 * donde lunesSem y viernesSem son los límites reales dentro del semestre.
 */
export function calcularSemanasHabiles(semestre, periodosVacacionales) {
  const inicio = parseLocalDate(semestre.fechaInicio)
  const fin = parseLocalDate(semestre.fechaFin)

  const periodosVac = periodosVacacionales
    .filter(p => p.fechaInicio && p.fechaFin)
    .map(p => ({
      inicio: parseLocalDate(p.fechaInicio),
      fin: parseLocalDate(p.fechaFin),
    }))

  const semanas = []
  let lunes = lunesDeLaSemana(inicio)
  let numeroSemana = 0

  // Iterar semana por semana hasta cubrir la fecha fin
  while (!isAfter(lunes, fin)) {
    const viernes = addDays(lunes, 4)

    if (semanaEsHabil(lunes, viernes, periodosVac, inicio, fin)) {
      numeroSemana++
      // Lunes efectivo: max(lunes, inicio semestre)
      const lunesEfectivo = isBefore(lunes, inicio) ? inicio : lunes
      // Viernes efectivo: min(viernes, fin semestre)
      const viernesEfectivo = isAfter(viernes, fin) ? fin : viernes

      semanas.push({
        numero: numeroSemana,
        lunes,
        viernes,
        lunesEfectivo,
        viernesEfectivo,
      })
    }

    lunes = addWeeks(lunes, 1)
  }

  return semanas
}

/**
 * Distribuye las subunidades entre las semanas hábiles.
 * Devuelve la planeación completa con inicio/fin de semana, fechas, duración, porcentaje.
 */
export function calcularPlaneacion(semestre, horasSemana, periodosVacacionales, unidades) {
  if (!semestre.fechaInicio || !semestre.fechaFin || !horasSemana) return null

  const semanasHabiles = calcularSemanasHabiles(semestre, periodosVacacionales)
  const totalHoras = unidades.flatMap(u => u.subunidades).reduce((s, su) => s + (Number(su.horas) || 0), 0)
  const capacidadTotal = semanasHabiles.length * Number(horasSemana)

  const planeacion = []
  let semanaActual = 0       // índice en semanasHabiles (base 0)
  let horasUsadasEnSemana = 0 // cuántas horas del slot actual ya se usaron

  for (const unidad of unidades) {
    for (const subunidad of unidad.subunidades) {
      const horas = Number(subunidad.horas) || 0
      if (horas <= 0) continue
      if (semanaActual >= semanasHabiles.length) {
        // Sin capacidad restante
        planeacion.push({
          unidadId: unidad.id,
          unidadNombre: unidad.nombre,
          subunidadId: subunidad.id,
          subunidadNombre: subunidad.nombre,
          horas,
          semanaInicio: null,
          semanaFin: null,
          fechaInicio: null,
          fechaFin: null,
          duracionSemanas: null,
          porcentaje: totalHoras > 0 ? (horas / totalHoras) * 100 : 0,
          sinCapacidad: true,
        })
        continue
      }

      const semanaInicioIdx = semanaActual
      const semanaInicioNum = semanasHabiles[semanaActual].numero
      const fechaInicioSub = formatDate(semanasHabiles[semanaActual].lunesEfectivo)

      let horasRestantes = horas

      while (horasRestantes > 0 && semanaActual < semanasHabiles.length) {
        const espacioSemana = Number(horasSemana) - horasUsadasEnSemana
        if (horasRestantes <= espacioSemana) {
          horasUsadasEnSemana += horasRestantes
          horasRestantes = 0
          // Si llenamos exactamente la semana, avanzar
          if (horasUsadasEnSemana >= Number(horasSemana)) {
            semanaActual++
            horasUsadasEnSemana = 0
          }
        } else {
          horasRestantes -= espacioSemana
          semanaActual++
          horasUsadasEnSemana = 0
        }
      }

      // La semana fin es la semana donde terminó (puede ser semanaActual si aún hay espacio,
      // o semanaActual - 1 si se llenó exactamente)
      let semanaFinIdx = horasUsadasEnSemana > 0 ? semanaActual : semanaActual - 1
      if (semanaFinIdx < 0) semanaFinIdx = 0
      if (semanaFinIdx >= semanasHabiles.length) semanaFinIdx = semanasHabiles.length - 1

      const semanaFinNum = semanasHabiles[semanaFinIdx].numero
      const fechaFinSub = formatDate(semanasHabiles[semanaFinIdx].viernesEfectivo)
      const duracionSemanas = (semanaFinNum - semanaInicioNum) + 1

      planeacion.push({
        unidadId: unidad.id,
        unidadNombre: unidad.nombre,
        subunidadId: subunidad.id,
        subunidadNombre: subunidad.nombre,
        horas,
        semanaInicio: semanaInicioNum,
        semanaFin: semanaFinNum,
        fechaInicio: fechaInicioSub,
        fechaFin: fechaFinSub,
        duracionSemanas,
        porcentaje: totalHoras > 0 ? (horas / totalHoras) * 100 : 0,
        sinCapacidad: false,
      })
    }
  }

  return {
    planeacion,
    resumen: {
      totalHoras,
      semanasHabiles: semanasHabiles.length,
      capacidadTotal,
      horasSemana: Number(horasSemana),
      horasRestantes: capacidadTotal - totalHoras,
    },
    semanasHabilesDetalle: semanasHabiles,
  }
}

/**
 * Calcula las horas por semana ideales usando la regla de 3:
 * horasSemana = horasTotales / numSemanasHabiles
 *
 * Devuelve null si faltan datos, o:
 * { exact, rounded, isPerfect, sobrantes, requiereManual }
 * donde sobrantes > 0 = sobran horas de capacidad; < 0 = faltan.
 */
export function calcularHorasSemanaAuto(horasTotales, numSemanasHabiles) {
  if (!horasTotales || !numSemanasHabiles || numSemanasHabiles <= 0) return null
  const exact    = horasTotales / numSemanasHabiles
  const requiereManual = !Number.isInteger(exact)
  const rounded  = requiereManual ? Math.ceil(exact) : exact
  const isPerfect = !requiereManual
  const sobrantes = parseFloat((rounded * numSemanasHabiles - horasTotales).toFixed(1))
  return { exact, rounded, isPerfect, sobrantes, requiereManual }
}
