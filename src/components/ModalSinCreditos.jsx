import BrandMark from './brand/BrandMark'

export default function ModalSinCreditos({ onComprar, onModoGratuito, onCerrar }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overscroll-contain bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onCerrar}
    >
      <div
        className="card relative w-full max-w-md space-y-6 p-7 shadow-2xl animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onCerrar}
          className="icon-button absolute right-4 top-4 h-7 w-7 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          aria-label="Cerrar"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex justify-center">
          <BrandMark className="w-16 h-16" />
        </div>

        <div className="space-y-2 text-center">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Tus créditos no son suficientes
          </h2>
          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            La planeación completa cuesta 75 créditos y el horario automático 25. También puedes capturar todo manualmente sin gastar créditos.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={onComprar}
            className="btn-accent w-full justify-center gap-2 py-3 text-sm"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Adquirir créditos
          </button>

          <button
            onClick={onModoGratuito}
            className="btn-secondary w-full justify-center gap-2 py-3 text-sm"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Capturar manualmente (gratis)
          </button>

          <p className="px-2 text-center text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
            Puedes generar la planeación didáctica completa cuando tengas créditos disponibles.
          </p>
        </div>
      </div>
    </div>
  )
}
