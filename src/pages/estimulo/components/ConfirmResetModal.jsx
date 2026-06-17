import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function ConfirmResetModal({ onConfirm, onCancel }) {
  const cancelRef = useRef(null)

  useEffect(() => {
    cancelRef.current?.focus()
    function onEsc(e) { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [onCancel])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="card w-full max-w-sm p-6 shadow-2xl animate-scale-in space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
          ¿Reiniciar todo el avance?
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Se borrará todo el avance guardado en este navegador. Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-3 justify-end">
          <button ref={cancelRef} type="button" onClick={onCancel} className="btn-secondary text-sm h-9 px-4">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-9 px-4 rounded-xl text-sm font-semibold bg-danger-600 text-white hover:bg-danger-700 active:scale-95 transition-all"
          >
            Sí, reiniciar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
