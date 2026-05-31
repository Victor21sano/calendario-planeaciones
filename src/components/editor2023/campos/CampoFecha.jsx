export default function CampoFecha({ etiqueta, valor, onCambio, requerido = false }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
        {etiqueta}{requerido && <span className="text-rose-500 ml-0.5">*</span>}
      </span>
      <input
        type="date"
        value={valor || ''}
        onChange={e => onCambio(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600
          bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100
          focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500
          transition-colors"
      />
    </label>
  )
}
