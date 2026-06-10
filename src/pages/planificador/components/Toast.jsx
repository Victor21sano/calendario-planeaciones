// Toast de "Progreso guardado" del PlanificadorPage. Presentacional puro.
export default function Toast({ visible, message = 'Progreso guardado' }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      <div className="flex items-center gap-2.5 px-5 py-3 bg-success-700 text-white rounded-2xl shadow-xl shadow-success-900/20">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm font-semibold">{message}</span>
      </div>
    </div>
  )
}
