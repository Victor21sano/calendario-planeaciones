export default function CampoNumero({ etiqueta, valor, onCambio, min = 0, max = 9999, paso = 1, sufijo, requerido = false }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
        {etiqueta}{requerido && <span className="text-rose-500 ml-0.5">*</span>}
      </span>
      <div className="relative">
        <input
          type="number"
          value={valor ?? ''}
          onChange={e => onCambio(e.target.value === '' ? null : Number(e.target.value))}
          min={min}
          max={max}
          step={paso}
          className={`w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600
            bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100
            focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500
            transition-colors ${sufijo ? 'pr-12' : ''}`}
        />
        {sufijo && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
            {sufijo}
          </span>
        )}
      </div>
    </label>
  )
}
