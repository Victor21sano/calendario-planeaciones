// Banner de errores/advertencias del PlanificadorPage. Presentacional puro.
export default function AlertBanner({ type, items, onDismiss }) {
  const config = {
    error: {
      bg:    'bg-danger-50 dark:bg-danger-900/20',
      border:'border-danger-200 dark:border-danger-800/40',
      text:  'text-danger-800 dark:text-danger-300',
      sub:   'text-danger-600 dark:text-danger-400',
      icon:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
      label: 'Errores de validación',
    },
    warning: {
      bg:    'bg-warning-50 dark:bg-warning-900/20',
      border:'border-warning-200 dark:border-warning-800/40',
      text:  'text-warning-800 dark:text-warning-300',
      sub:   'text-warning-700 dark:text-warning-400',
      icon:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
      label: 'Advertencias',
    },
  }
  const c = config[type]
  return (
    <div className={`flex gap-3 p-4 rounded-2xl border ${c.bg} ${c.border} animate-slide-down`}>
      <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {c.icon}
      </svg>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${c.text}`}>{c.label}</p>
        <ul className="mt-1 space-y-0.5">
          {items.map((e, i) => <li key={i} className={`text-xs ${c.sub}`}>{e}</li>)}
        </ul>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className={`${c.text} hover:opacity-70 transition-opacity flex-shrink-0`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      )}
    </div>
  )
}
