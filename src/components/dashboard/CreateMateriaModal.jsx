/**
 * CreateMateriaModal — Selección IA vs Manual al crear una materia adicional.
 * Se muestra cuando el usuario ya tiene materias y hace clic en "Nueva Materia".
 */
export default function CreateMateriaModal({ onIA, onManual, onCerrar, sinCreditosDisponibles }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in overscroll-contain"
      onClick={onCerrar}
    >
      <div
        className="relative w-full max-w-md card p-7 space-y-5 animate-scale-in shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* X */}
        <button
          onClick={onCerrar}
          aria-label="Cerrar"
          className="icon-button absolute top-4 right-4 w-7 h-7 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Nueva materia</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            ¿Cómo quieres crear esta planeación?
          </p>
        </div>

        <div className="space-y-3">
          {/* IA */}
          <button
            onClick={onIA}
            disabled={sinCreditosDisponibles}
            className="selectable-card w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-info-300 dark:hover:border-info-700 hover:bg-info-50/50 dark:hover:bg-info-900/10 text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-info-500 to-primary-600 flex items-center justify-center flex-shrink-0">
              <svg aria-hidden="true" className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Generar con IA</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {sinCreditosDisponibles
                  ? 'Sin créditos disponibles — adquiere para usar'
                  : 'Sube PE y GPE, la IA hace el resto · 1 crédito'}
              </p>
            </div>
            <svg aria-hidden="true" className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Manual */}
          <button
            onClick={onManual}
            className="selectable-card w-full flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center flex-shrink-0">
              <svg aria-hidden="true" className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Llenar manualmente</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tú escribes cada campo a tu ritmo</p>
            </div>
            <svg aria-hidden="true" className="w-4 h-4 text-slate-300 dark:text-slate-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
