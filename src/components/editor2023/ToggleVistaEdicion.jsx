export default function ToggleVistaEdicion({ modo, onCambio }) {
  const btnBase = 'flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-all'
  const activo  = `${btnBase} bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm`
  const inactivo = `${btnBase} text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200`

  return (
    <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
      <button onClick={() => onCambio('preview')} className={modo === 'preview' ? activo : inactivo}>
        {/* Eye icon */}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Vista previa
      </button>
      <button onClick={() => onCambio('editor')} className={modo === 'editor' ? activo : inactivo}>
        {/* Edit icon */}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Editar
      </button>
    </div>
  )
}
