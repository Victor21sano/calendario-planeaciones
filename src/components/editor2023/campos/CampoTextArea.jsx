const claseInput = `w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600
  bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100
  focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500
  transition-colors resize-y`

export default function CampoTextArea({ etiqueta, valor, onCambio, placeholder, requerido = false, ayuda, rows = 4 }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
        {etiqueta}{requerido && <span className="text-danger-500 ml-0.5">*</span>}
      </span>
      <textarea
        value={valor || ''}
        onChange={e => onCambio(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={claseInput}
        style={{ minHeight: '5rem' }}
      />
      {ayuda && <span className="text-xs text-slate-500 dark:text-slate-400">{ayuda}</span>}
    </label>
  )
}
