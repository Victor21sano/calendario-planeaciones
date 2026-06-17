import { factorMeta } from '../data'

export default function ScorePanel({ scoreResult }) {
  const { total, factors, level, umas } = scoreResult
  const pct = Math.min(100, Math.round((total / 800) * 100))

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">Estimador de puntaje</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">
            Selecciona el nivel de evidencia en cada rubro puntuable. El resultado es orientativo y debe validarse con la Comisión Evaluadora.
          </p>
        </div>
        <div className="shrink-0 rounded-xl bg-brand-50 dark:bg-brand-900/20 px-4 py-2.5 text-right">
          <p className="text-xs font-semibold text-brand-600 dark:text-brand-300" aria-live="polite">{level}</p>
          <p className="text-sm font-bold text-brand-700 dark:text-brand-200">
            {umas} UMA{umas !== 1 ? 'S' : ''} mensuales
          </p>
        </div>
      </div>

      <div>
        <p className="text-3xl font-black text-brand-700 dark:text-brand-300 tabular-nums" aria-live="polite">
          {total} <span className="text-lg font-semibold text-slate-400 dark:text-slate-500">/ 800</span>
        </p>
        <div
          role="progressbar"
          aria-label="Puntaje estimado"
          aria-valuemin={0}
          aria-valuemax={800}
          aria-valuenow={total}
          className="mt-2 w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-700 to-brand-400 transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {Object.entries(factorMeta).map(([factor, meta]) => (
          <div key={factor} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-2.5">
            <p className="text-sm font-bold text-brand-700 dark:text-brand-300 tabular-nums">
              Factor {factor}: {factors[factor] ?? 0}
              <span className="font-normal text-slate-400 dark:text-slate-500"> / {meta.max}</span>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{meta.label}</p>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        Rangos de la convocatoria: 301–400 nivel I · 401–500 nivel II · 501–600 nivel III · 601–700 nivel IV · 701–800 nivel V
      </p>
    </div>
  )
}
