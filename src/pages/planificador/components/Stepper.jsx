// Indicador de pasos del PlanificadorPage. Presentacional puro.
export default function Stepper({ step1Done, step2Done, step3Done }) {
  const steps = [
    { label: 'Semestre', done: step1Done },
    { label: 'Estructura', done: step2Done },
    { label: 'Planeación', done: step3Done },
  ]
  return (
    <div className="hidden sm:flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300
            ${s.done
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
              : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
            }`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold
              ${s.done
                ? 'bg-primary-500 text-white'
                : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
              }`}>
              {s.done ? (
                <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : i + 1}
            </span>
            {s.label}
          </div>
          {i < steps.length - 1 && (
            <div className={`w-5 h-px transition-colors duration-500 ${s.done ? 'bg-primary-300 dark:bg-primary-700' : 'bg-slate-200 dark:bg-slate-700'}`} />
          )}
        </div>
      ))}
    </div>
  )
}
