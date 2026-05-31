import { useState } from 'react'
import { copiarTablaHTML } from '../../utils/copiarTabla'

/**
 * Botón pequeño que copia HTML al portapapeles.
 * Al pegarlo en Word/Google Docs conserva tablas y formato.
 * Reutiliza copiarTablaHTML del mismo helper que usa el Modelo 2018.
 */
export default function BotonCopiarTabla({ getHTML, etiqueta = 'Copiar', bloqueado = false, ariaLabel }) {
  const [copiado, setCopiado] = useState(false)
  const [bloqAnimado, setBloqAnimado] = useState(false)

  async function handleCopiar() {
    if (bloqueado) {
      setBloqAnimado(true)
      setTimeout(() => setBloqAnimado(false), 600)
      return
    }
    try {
      const html = typeof getHTML === 'function' ? getHTML() : getHTML
      await copiarTablaHTML(html)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch (err) {
      console.error('Error al copiar tabla:', err)
    }
  }

  const base = 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors no-print'

  if (bloqueado) {
    return (
      <button
        onClick={handleCopiar}
        aria-label={ariaLabel || `Copiar ${etiqueta}`}
        className={`${base} bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed
          ${bloqAnimado ? 'scale-95' : ''}`}
      >
        {/* Lock icon */}
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Bloqueado
      </button>
    )
  }

  if (copiado) {
    return (
      <button className={`${base} bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700`}>
        {/* Check icon */}
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        Copiado
      </button>
    )
  }

  return (
    <button
      onClick={handleCopiar}
      aria-label={ariaLabel || `Copiar ${etiqueta}`}
      className={`${base} bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400`}
    >
      {/* Copy icon */}
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      {etiqueta}
    </button>
  )
}
