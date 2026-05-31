import {
  parseISO,
  format,
  addDays,
  differenceInCalendarDays,
  isWeekend,
  isAfter,
  isEqual,
} from 'date-fns'

// ─── calcularHorasSemana ──────────────────────────────────────
/**
 * Calcula las horas semanales del módulo a partir del calendario real del docente.
 * Garantiza que horasSemana × semanasHábiles === horasTotales por construcción.
 *
 * @param {{ horasTotales, fechaInicio, fechaFin, diasNoLaborables }} args
 * @returns {{ horasSemana: number, semanasHabiles: number }}
 */
export function calcularHorasSemana({ horasTotales, fechaInicio, fechaFin, diasNoLaborables = [] }) {
  if (!horasTotales || !fechaInicio || !fechaFin) {
    return { horasSemana: 0, semanasHabiles: 0 }
  }

  const inicio    = parseISO(fechaInicio)
  const fin       = parseISO(fechaFin)
  const noLab     = diasNoLaborables.map(d => (typeof d === 'string' ? parseISO(d) : d))
  const totalDias = differenceInCalendarDays(fin, inicio) + 1

  let diasHabiles = 0
  for (let i = 0; i < totalDias; i++) {
    const dia = addDays(inicio, i)
    if (isWeekend(dia)) continue
    if (noLab.some(nl => isEqual(nl, dia))) continue
    diasHabiles++
  }

  // Semana hábil CONALEP: lunes a viernes (5 días)
  const semanasHabiles = diasHabiles / 5
  const horasSemana    = semanasHabiles > 0
    ? Math.round((horasTotales / semanasHabiles) * 10) / 10   // 1 decimal
    : 0

  return {
    horasSemana,
    semanasHabiles: Math.round(semanasHabiles * 10) / 10,
  }
}

// ─── Helpers internos ─────────────────────────────────────────
function parseFecha(f) {
  return typeof f === 'string' ? parseISO(f) : f
}

function esDiaNoHabil(fecha, diasNoLaborables) {
  if (isWeekend(fecha)) return true
  return diasNoLaborables.some(d => isEqual(parseFecha(d), fecha))
}

function avanzarHastaDiaHabil(fecha, diasNoLaborables) {
  let actual = fecha
  while (esDiaNoHabil(actual, diasNoLaborables)) {
    actual = addDays(actual, 1)
  }
  return actual
}

function retrocederHastaDiaHabil(fecha, diasNoLaborables) {
  let actual = fecha
  while (esDiaNoHabil(actual, diasNoLaborables)) {
    actual = addDays(actual, -1)
  }
  return actual
}

// ─── calcularFechas ───────────────────────────────────────────
/**
 * Asigna fechaInicio / fechaFin a todas las actividades específicas de la planeación.
 * No muta el objeto original — devuelve una copia profunda con las fechas calculadas.
 *
 * Reglas:
 * - Las actividades son secuenciales dentro de cada RA, y los RAs son secuenciales
 *   dentro del módulo (no se traslapan).
 * - diasNecesariosActividad ≈ ceil(horasActividad / horasSemana) × 7
 * - El cursor avanza al siguiente día hábil si cae en fin de semana o día no laborable.
 * - El primer RA arranca en fechaInicioSemestre.
 * - Si fechaFin calculada excede el fin del semestre, se limita a este.
 *
 * @param {object} planeacion — planeación con cabecera.calendario y actividades
 * @returns {object} copia con fechas asignadas
 */
export function calcularFechas(planeacion) {
  const horasSemana      = planeacion.cabecera.modulo.horasSemana
  const inicioSemestre   = parseFecha(planeacion.cabecera.calendario.fechaInicioSemestre)
  const finSemestre      = parseFecha(planeacion.cabecera.calendario.fechaFinSemestre)
  const diasNoLaborables = (planeacion.cabecera.calendario.diasNoLaborables || [])
    .map(d => parseFecha(d))

  const copia  = JSON.parse(JSON.stringify(planeacion))
  let   cursor = avanzarHastaDiaHabil(inicioSemestre, diasNoLaborables)

  for (const unidad of copia.unidades) {
    for (const ra of unidad.ras) {
      for (const act of (ra.actividadesEspecificas || [])) {
        const fechaInicio = avanzarHastaDiaHabil(cursor, diasNoLaborables)

        // Semanas necesarias × 7 días calendario = duración en días
        const semanasNecesarias = Math.max(1, Math.ceil(act.duracionHoras / horasSemana))
        let   fechaFin = addDays(fechaInicio, semanasNecesarias * 7 - 1)

        // Si la fechaFin cae en no hábil, retroceder al último día hábil
        fechaFin = retrocederHastaDiaHabil(fechaFin, diasNoLaborables)

        // No exceder el fin del semestre
        if (isAfter(fechaFin, finSemestre)) {
          fechaFin = retrocederHastaDiaHabil(finSemestre, diasNoLaborables)
        }

        act.fechaInicio = format(fechaInicio, 'yyyy-MM-dd')
        act.fechaFin    = format(fechaFin,    'yyyy-MM-dd')

        // El siguiente cursor es fechaFin (la próxima actividad inicia el mismo día o después)
        cursor = fechaFin
      }
    }
  }

  return copia
}

// ─── diasHabilesEntre ─────────────────────────────────────────
/**
 * Cuenta los días hábiles entre dos fechas (extremos inclusive).
 * Útil para mostrar "X días hábiles" en la UI.
 */
export function diasHabilesEntre(desde, hasta, diasNoLaborables = []) {
  const inicio  = parseFecha(desde)
  const fin     = parseFecha(hasta)
  const total   = differenceInCalendarDays(fin, inicio) + 1
  const noLab   = diasNoLaborables.map(d => parseFecha(d))
  let   habiles = 0
  for (let i = 0; i < total; i++) {
    if (!esDiaNoHabil(addDays(inicio, i), noLab)) habiles++
  }
  return habiles
}

// ─── formatearRango ───────────────────────────────────────────
/**
 * Formatea un rango de fechas para mostrar en la UI.
 * Ej: "2 feb – 12 feb 2026"
 */
export function formatearRango(fechaInicio, fechaFin, locale = 'es-MX') {
  if (!fechaInicio || !fechaFin) return ''
  // Sumar mediodía para evitar problemas de zona horaria
  const f1 = new Date(fechaInicio + 'T12:00:00')
  const f2 = new Date(fechaFin    + 'T12:00:00')
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' })
  return `${fmt.format(f1)} – ${fmt.format(f2)}`
}

// ─── semanasDelSemestre ───────────────────────────────────────
/**
 * Devuelve la lista de semanas del semestre (lunes → viernes) excluyendo
 * las semanas completamente no laborables.
 * Útil para renderizar el calendario semanal en la UI.
 */
export function semanasDelSemestre(fechaInicioSemestre, fechaFinSemestre, diasNoLaborables = []) {
  const inicio = parseFecha(fechaInicioSemestre)
  const fin    = parseFecha(fechaFinSemestre)
  const noLab  = diasNoLaborables.map(d => parseFecha(d))
  const semanas = []

  // Retroceder al lunes de la semana de inicio
  let cursor = avanzarHastaDiaHabil(inicio, noLab)
  // Ir al lunes de esa semana
  while (cursor.getDay() !== 1) cursor = addDays(cursor, -1)

  while (!isAfter(cursor, fin)) {
    const lunes   = cursor
    const viernes = addDays(cursor, 4)
    semanas.push({
      inicio:  format(lunes,   'yyyy-MM-dd'),
      fin:     format(viernes, 'yyyy-MM-dd'),
      numero:  semanas.length + 1,
    })
    cursor = addDays(cursor, 7)
  }

  return semanas
}
