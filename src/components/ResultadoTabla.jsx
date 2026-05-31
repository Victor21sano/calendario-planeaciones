import { exportarCSV } from '../utils/exportar'
import { validarCapacidad, fmtHoras } from '../utils/validaciones'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// ─── Color palette (matches EstructuraForm) ───────────────────
const COLORES = [
  { bg: 'bg-indigo-50/60 dark:bg-indigo-900/10', text: 'text-indigo-800 dark:text-indigo-300', badge: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300', bar: 'bg-indigo-400 dark:bg-indigo-500', border: 'border-l-indigo-400 dark:border-l-indigo-500' },
  { bg: 'bg-violet-50/60 dark:bg-violet-900/10', text: 'text-violet-800 dark:text-violet-300', badge: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300', bar: 'bg-violet-400 dark:bg-violet-500', border: 'border-l-violet-400 dark:border-l-violet-500' },
  { bg: 'bg-emerald-50/60 dark:bg-emerald-900/10', text: 'text-emerald-800 dark:text-emerald-300', badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300', bar: 'bg-emerald-400 dark:bg-emerald-500', border: 'border-l-emerald-400 dark:border-l-emerald-500' },
  { bg: 'bg-amber-50/60 dark:bg-amber-900/10', text: 'text-amber-800 dark:text-amber-300', badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', bar: 'bg-amber-400 dark:bg-amber-500', border: 'border-l-amber-400 dark:border-l-amber-500' },
  { bg: 'bg-rose-50/60 dark:bg-rose-900/10', text: 'text-rose-800 dark:text-rose-300', badge: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300', bar: 'bg-rose-400 dark:bg-rose-500', border: 'border-l-rose-400 dark:border-l-rose-500' },
  { bg: 'bg-cyan-50/60 dark:bg-cyan-900/10', text: 'text-cyan-800 dark:text-cyan-300', badge: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300', bar: 'bg-cyan-400 dark:bg-cyan-500', border: 'border-l-cyan-400 dark:border-l-cyan-500' },
]

function formatFechaLegible(dateStr) {
  if (!dateStr) return '—'
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return format(date, "d 'de' MMM", { locale: es })
}

// ─── Donut Chart (pure CSS conic-gradient) ────────────────────
function DonutChart({ pct, color }) {
  const safeP = Math.min(100, Math.max(0, pct))
  const colorMap = {
    green:  ['#10b981', '#d1fae5'],
    amber:  ['#f59e0b', '#fef3c7'],
    red:    ['#ef4444', '#fee2e2'],
    indigo: ['#6366f1', '#e0e7ff'],
  }
  const [fill, track] = colorMap[color] || colorMap.indigo

  return (
    <div className="relative w-24 h-24 flex-shrink-0">
      <div
        className="w-24 h-24 rounded-full"
        style={{
          background: `conic-gradient(${fill} ${safeP * 3.6}deg, ${track} 0deg)`,
          transition: 'background 600ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
      {/* Center hole */}
      <div className="absolute inset-3 rounded-full bg-white dark:bg-slate-900 flex flex-col items-center justify-center">
        <span className="text-base font-black leading-none" style={{ color: fill }}>{safeP.toFixed(0)}%</span>
        <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 leading-none mt-0.5">usado</span>
      </div>
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, highlight }) {
  const colorMap = {
    red:    'text-rose-600 dark:text-rose-400',
    green:  'text-emerald-600 dark:text-emerald-400',
    indigo: 'text-primary-600 dark:text-primary-400',
    amber:  'text-amber-600 dark:text-amber-400',
  }
  return (
    <div className="flex flex-col gap-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
      <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-2xl font-black leading-none ${highlight ? colorMap[highlight] : 'text-slate-800 dark:text-slate-100'}`}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{sub}</p>}
    </div>
  )
}

// ─── Capacity Summary Panel ───────────────────────────────────
function Resumen({ resumen }) {
  const { esValido, mensajes } = validarCapacidad(resumen)
  const pct = resumen.capacidadTotal > 0
    ? Math.min(100, (resumen.totalHoras / resumen.capacidadTotal) * 100)
    : 0

  const gaugeColor = pct > 100 ? 'red' : pct === 100 ? 'green' : pct > 85 ? 'amber' : 'indigo'
  const barColor = pct > 100
    ? 'bg-rose-400 dark:bg-rose-500'
    : pct === 100
      ? 'bg-emerald-400 dark:bg-emerald-500'
      : pct > 85
        ? 'bg-amber-400 dark:bg-amber-500'
        : 'bg-primary-400 dark:bg-primary-500'

  const statusConfig = esValido && mensajes.length === 0
    ? { bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40', text: 'text-emerald-800 dark:text-emerald-300', icon: 'M5 13l4 4L19 7' }
    : !esValido
      ? { bg: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/40', text: 'text-rose-800 dark:text-rose-300', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' }
      : { bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40', text: 'text-blue-800 dark:text-blue-300', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }

  return (
    <div className="card p-5 animate-fade-in">
      <h3 className="section-title mb-4">Resumen de capacidad</h3>

      {/* Donut + Stats — apilados en móvil para más aire */}
      <div className="flex flex-col items-center gap-4 mb-4 sm:flex-row">
        <DonutChart pct={pct} color={gaugeColor} />
        <div className="grid grid-cols-2 gap-2.5 w-full flex-1 min-w-0">
          <StatCard
            icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>}
            label="Programa"
            value={`${fmtHoras(resumen.totalHoras)}h`}
          />
          <StatCard
            icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>}
            label="Semanas"
            value={resumen.semanasHabiles}
            sub="semanas hábiles"
          />
          <StatCard
            icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>}
            label="Capacidad"
            value={`${fmtHoras(resumen.capacidadTotal)}h`}
            sub={`${fmtHoras(resumen.horasSemana)}h × ${resumen.semanasHabiles} sem`}
          />
          <StatCard
            icon={<svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>}
            label={resumen.horasRestantes >= 0 ? 'Disponibles' : 'Déficit'}
            value={`${fmtHoras(Math.abs(resumen.horasRestantes))}h`}
            highlight={resumen.horasRestantes < 0 ? 'red' : resumen.horasRestantes === 0 ? 'green' : 'indigo'}
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-1.5">
          <span>Ocupación del semestre</span>
          <span>{pct.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-2.5 rounded-full transition-all duration-700 ease-spring ${barColor}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>

      {/* Status message */}
      {(mensajes.length > 0 || (esValido && mensajes.length === 0)) && (
        <div className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs ${statusConfig.bg} ${statusConfig.text}`}>
          <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={statusConfig.icon} />
          </svg>
          <div>
            {mensajes.length === 0
              ? <p className="font-medium">La planeación cuadra perfectamente con el semestre.</p>
              : mensajes.map((m, i) => <p key={i} className="font-medium">{m}</p>)
            }
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Table ───────────────────────────────────────────────
export default function ResultadoTabla({ resultado }) {
  if (!resultado) return (
    <div className="card p-10 flex flex-col items-center text-center animate-fade-in">
      <div className="relative mb-5">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-50 to-violet-50 dark:from-primary-900/20 dark:to-violet-900/20 rounded-2xl flex items-center justify-center">
          <svg className="w-8 h-8 text-primary-300 dark:text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
        </div>
        {/* Animated sparkle dots */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-200 dark:bg-primary-800 rounded-full animate-pulse" />
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-violet-200 dark:bg-violet-800 rounded-full animate-pulse delay-300" />
      </div>
      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Aún no hay planeación</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
        Completa los pasos <span className="font-semibold text-primary-500">1</span> y <span className="font-semibold text-violet-500">2</span> para ver la distribución calculada de tu semestre.
      </p>
    </div>
  )

  const { planeacion, resumen } = resultado
  const unidadesUnicas = [...new Set(planeacion.map(r => r.unidadId))]
  const colorPorUnidad = {}
  unidadesUnicas.forEach((id, i) => { colorPorUnidad[id] = COLORES[i % COLORES.length] })

  function imprimir() { window.print() }

  return (
    <div className="space-y-4 animate-slide-up">
      <Resumen resumen={resumen} />

      <div className="card overflow-hidden">
        {/* Table header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/5">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Distribución por semana</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{planeacion.length} registros</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportarCSV(planeacion, resumen)}
              className="btn-secondary text-xs py-1.5 gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              CSV
            </button>
            <button
              onClick={imprimir}
              className="btn-secondary text-xs py-1.5 gap-1.5 no-print">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Imprimir
            </button>
          </div>
        </div>

        {/* Table — overflow-x-auto para scroll horizontal en pantallas angostas */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: '500px' }}>
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-white/5">
                <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-200 uppercase tracking-wider min-w-[160px]">Unidad / Subunidad</th>
                <th className="text-center px-3 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-200 uppercase tracking-wider w-16">Horas</th>
                <th className="text-center px-3 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-200 uppercase tracking-wider w-24">Semana</th>
                <th className="text-left px-3 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-200 uppercase tracking-wider hidden sm:table-cell w-24">Inicio</th>
                <th className="text-left px-3 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-200 uppercase tracking-wider hidden sm:table-cell w-24">Fin</th>
                <th className="text-center px-3 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-200 uppercase tracking-wider hidden md:table-cell w-20">Duración</th>
                <th className="text-left px-3 py-3 text-[10px] font-bold text-slate-600 dark:text-slate-200 uppercase tracking-wider w-24">% total</th>
              </tr>
            </thead>
            <tbody>
              {planeacion.map((row, i) => {
                const c = colorPorUnidad[row.unidadId]
                return (
                  <tr
                    key={`${row.subunidadId}-${i}`}
                    className={`border-l-2 ${c.border} ${c.bg} hover:brightness-[0.97] dark:hover:brightness-110 transition-all duration-150 border-b border-slate-50 dark:border-white/3`}>
                    <td className="px-4 py-3">
                      {/* Badge con rounded-lg en lugar de rounded-full: fluye naturalmente en varias líneas */}
                      <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-semibold mb-1 ${c.badge}`}>
                        {row.unidadNombre}
                      </span>
                      <p className={`text-xs font-semibold ${c.text}`}>{row.subunidadNombre || row.subunidadId}</p>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{row.horas}</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {row.sinCapacidad ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold">Sin cap.</span>
                      ) : row.semanaInicio === row.semanaFin ? (
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Sem. {row.semanaInicio}</span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Sem. {row.semanaInicio}–{row.semanaFin}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400 hidden sm:table-cell">{formatFechaLegible(row.fechaInicio)}</td>
                    <td className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400 hidden sm:table-cell">{formatFechaLegible(row.fechaFin)}</td>
                    <td className="px-3 py-3 text-center hidden md:table-cell">
                      {row.duracionSemanas != null
                        ? <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">{row.duracionSemanas} sem</span>
                        : <span className="text-slate-300 dark:text-slate-600">—</span>
                      }
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 min-w-[70px]">
                        <div className="flex-1 bg-white/60 dark:bg-slate-900/40 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${c.bar}`}
                            style={{ width: `${row.porcentaje}%`, transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)' }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 w-8 text-right flex-shrink-0">
                          {row.porcentaje.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
