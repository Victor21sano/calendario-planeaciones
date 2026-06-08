import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'

/**
 * Menú de usuario del header: botón avatar con dropdown (Perfil/Admin/Salir).
 * Solo presentación: el estado abrir/cerrar es de UI; la acción de salir y la
 * navegación vienen del padre (sin lógica de negocio aquí).
 */
export default function MenuUsuario({ inicial, esAdmin, onLogout }) {
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!abierto) return
    function onClickFuera(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false)
    }
    function onEsc(e) {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', onClickFuera)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClickFuera)
      document.removeEventListener('keydown', onEsc)
    }
  }, [abierto])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto(v => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label="Menú de cuenta"
        className="icon-button h-9 w-9 rounded-full bg-brand-600 text-sm font-bold text-white hover:bg-brand-500"
      >
        {inicial}
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-44 origin-top-right animate-scale-in rounded-xl border border-brand-100/70 bg-[var(--surface-primary)] p-1.5 shadow-xl dark:border-white/10"
        >
          <Link
            to="/perfil"
            role="menuitem"
            onClick={() => setAbierto(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Mi perfil
          </Link>

          {esAdmin && (
            <Link
              to="/admin"
              role="menuitem"
              onClick={() => setAbierto(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900/20"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Admin
            </Link>
          )}

          <div className="my-1 border-t border-slate-100 dark:border-white/5" />

          <button
            type="button"
            role="menuitem"
            onClick={() => { setAbierto(false); onLogout() }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-danger-600 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/20"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Salir
          </button>
        </div>
      )}
    </div>
  )
}
