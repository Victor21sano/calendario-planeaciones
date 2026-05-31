import { useNavigate } from 'react-router-dom'

/**
 * PerfilIncompletoModal — Se muestra cuando el usuario quiere crear una
 * planeación Modelo 2023 pero le faltan datos en su perfil (numEmpleado, plantel).
 */
export default function PerfilIncompletoModal({ onCerrar }) {
  const navigate = useNavigate()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overscroll-contain"
      onClick={onCerrar}
    >
      <div
        className="relative w-full max-w-sm card p-7 space-y-5 animate-scale-in shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* X */}
        <button
          onClick={onCerrar}
          aria-label="Cerrar"
          className="icon-button absolute top-4 right-4 w-7 h-7 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        {/* Icono */}
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>

        {/* Texto */}
        <div className="text-center space-y-2">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
            Completa tu perfil primero
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Para crear planeaciones del <strong>Modelo 2023</strong> necesitamos tu número de empleado y plantel.
            Estos datos aparecen en tus planeaciones oficiales.
          </p>
        </div>

        {/* Botones */}
        <div className="space-y-2">
          <button
            onClick={() => { onCerrar(); navigate('/perfil') }}
            className="btn-primary w-full justify-center py-2.5 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Ir a mi perfil
          </button>
          <button
            onClick={onCerrar}
            className="btn-secondary w-full justify-center py-2.5 text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
