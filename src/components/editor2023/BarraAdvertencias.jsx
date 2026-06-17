import { useState } from 'react'

export default function BarraAdvertencias({ errores }) {
  const [colapsado, setColapsado] = useState(false)

  if (!errores || errores.length === 0) return null

  return (
    <div className="sticky top-0 z-20 bg-warning-50 dark:bg-warning-950/40 border-b border-warning-200 dark:border-warning-900">
      <button
        onClick={() => setColapsado(c => !c)}
        className="w-full flex items-center justify-between px-4 py-2"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-warning-900 dark:text-warning-200">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {errores.length} advertencia{errores.length > 1 ? 's' : ''} de validación
        </span>
        <span className="text-xs text-warning-700 dark:text-warning-300">
          {colapsado ? 'Mostrar' : 'Ocultar'}
        </span>
      </button>

      {!colapsado && (
        <ul className="px-6 pb-3 space-y-0.5">
          {errores.map((e, i) => (
            <li key={i} className="text-xs text-warning-800 dark:text-warning-200">• {e}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
