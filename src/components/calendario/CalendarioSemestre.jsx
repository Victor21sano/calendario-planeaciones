import { useMemo } from 'react'
import {
  parseISO, addDays, format, isWeekend, isEqual,
  differenceInCalendarDays, startOfWeek,
} from 'date-fns'

const PALETA = ['#8b5cf6','#10b981','#f59e0b','#ec4899','#06b6d4','#f43f5e','#84cc16','#6366f1']

function construirDatos(planeacion) {
  if (!planeacion?.cabecera?.calendario) return null
  const { fechaInicioSemestre, fechaFinSemestre, diasNoLaborables = [] } = planeacion.cabecera.calendario
  if (!fechaInicioSemestre || !fechaFinSemestre) return null

  const inicio = parseISO(fechaInicioSemestre)
  const fin    = parseISO(fechaFinSemestre)
  const vacaciones = diasNoLaborables.map(d => parseISO(d))

  // Actividades con colores
  const actividades = []
  let colorIdx = 0
  for (const unidad of (planeacion.unidades || [])) {
    for (const ra of (unidad.ras || [])) {
      const color = PALETA[colorIdx % PALETA.length]; colorIdx++
      for (const act of (ra.actividadesEspecificas || [])) {
        if (!act.fechaInicio || !act.fechaFin) continue
        actividades.push({ raCodigo: ra.codigo, numero: act.numero, fechaInicio: act.fechaInicio, fechaFin: act.fechaFin, horas: act.duracionHoras, color })
      }
    }
  }

  // Celdas del grid (acolchado al lunes anterior al inicio)
  const primerLunes  = startOfWeek(inicio, { weekStartsOn: 1 })
  const totalDias    = differenceInCalendarDays(fin, primerLunes) + 1
  const totalCeldas  = Math.ceil(totalDias / 7) * 7
  const celdas = []

  for (let i = 0; i < totalCeldas; i++) {
    const fecha = addDays(primerLunes, i)
    const dentroSemestre = fecha >= inicio && fecha <= fin
    if (!dentroSemestre) { celdas.push({ vacio: true }); continue }

    const fechaISO     = format(fecha, 'yyyy-MM-dd')
    const esVacacion   = vacaciones.some(v => isEqual(v, fecha))
    const esFinSemana  = isWeekend(fecha)
    const actividad    = (!esVacacion && !esFinSemana)
      ? actividades.find(a => fechaISO >= a.fechaInicio && fechaISO <= a.fechaFin)
      : null

    celdas.push({ vacio: false, fecha: fechaISO, dia: fecha.getDate(), esVacacion, esFinSemana, actividad })
  }

  const diasHabiles    = celdas.filter(c => !c.vacio && !c.esFinSemana && !c.esVacacion).length
  const semanasHabiles = Math.round((diasHabiles / 5) * 10) / 10
  const totalSemanas   = Math.ceil(totalCeldas / 7)

  return { celdas, diasHabiles, semanasHabiles, totalSemanas, actividades }
}

function CeldaDia({ celda }) {
  const base = 'aspect-square flex items-center justify-center text-[11px] font-medium rounded select-none'
  if (celda.vacio) return <div className={base} />

  let cls = base + ' '
  if (celda.esVacacion)  cls += 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
  else if (celda.esFinSemana) cls += 'bg-slate-100 dark:bg-slate-800/60 text-slate-400'
  else if (celda.actividad)   cls += 'text-white'
  else                         cls += 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'

  return (
    <div className={cls}
      style={celda.actividad ? { background: celda.actividad.color } : undefined}
      title={celda.actividad ? `RA ${celda.actividad.raCodigo} · Actividad ${celda.actividad.numero}` : celda.esVacacion ? 'No laborable' : celda.fecha}
    >
      {celda.dia}
    </div>
  )
}

export default function CalendarioSemestre({ planeacion, compacto = false }) {
  const datos = useMemo(() => construirDatos(planeacion), [planeacion])
  if (!datos) return null

  if (compacto) {
    const pct = datos.totalSemanas > 0 ? Math.round((datos.semanasHabiles / datos.totalSemanas) * 100) : 0
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-300">{datos.semanasHabiles} semanas hábiles</span>
          <span className="text-slate-500">{pct}% del calendario</span>
        </div>
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-500 to-primary-600 rounded-full" style={{ width: `${pct}%` }} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Calendario del semestre</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {datos.semanasHabiles} semanas hábiles · {datos.totalSemanas} semanas calendario · {datos.actividades.length} actividades
          </p>
        </div>
        {/* Leyenda */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-200 dark:bg-amber-700" />Vacaciones</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700" />Fin de semana</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-violet-500" />Actividades RA</span>
        </div>
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7 gap-0.5 text-xs">
        {['L','M','M','J','V','S','D'].map((d, i) => (
          <div key={i} className="text-center text-slate-400 dark:text-slate-500 font-semibold pb-1">{d}</div>
        ))}
        {datos.celdas.map((celda, i) => <CeldaDia key={i} celda={celda} />)}
      </div>

      {/* Lista de actividades */}
      {datos.actividades.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Actividades</p>
          <ul className="space-y-0.5">
            {datos.actividades.map((a, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="w-3 h-3 rounded flex-shrink-0" style={{ background: a.color }} />
                RA {a.raCodigo} · Actividad {a.numero}: {a.fechaInicio} → {a.fechaFin} ({a.horas}h)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
