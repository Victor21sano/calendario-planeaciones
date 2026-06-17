export default function StatusBar({ totalProgress, scoreResult, onPrint, onExport, onReset }) {
  const { done, total, pct } = totalProgress
  const { total: scoreTotal, level } = scoreResult

  return (
    <div className="sticky top-14 z-30 border-b border-slate-200/80 dark:border-white/5 bg-[#fffdf8]/90 dark:bg-[#182420]/90 backdrop-blur-xl"
         data-no-print>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">

        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div
            role="progressbar"
            aria-label="Progreso total"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden w-32 sm:w-44 shrink-0"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-700 to-brand-400 transition-[width] duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="hidden sm:block min-w-0">
            <p className="text-xs font-bold text-brand-700 dark:text-brand-300 truncate" aria-live="polite">
              {done} de {total} completos ({pct}%)
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Puntos: {scoreTotal} / 800 · {level}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={onPrint} className="btn-secondary text-xs h-8 px-3 hidden sm:flex">
            Imprimir
          </button>
          <button type="button" onClick={onExport} className="btn-secondary text-xs h-8 px-3">
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={onReset}
            className="h-8 px-3 rounded-xl text-xs font-semibold bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400 border border-danger-200 dark:border-danger-800 hover:bg-danger-100 dark:hover:bg-danger-900/30 transition-colors"
          >
            Reiniciar
          </button>
        </div>

      </div>
    </div>
  )
}
