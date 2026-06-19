import { useState } from 'react'
import { MODELO_2023, MODELO_2025 } from '../../services/materias'

const MODELOS = [
  {
    id: MODELO_2023,
    nombre: 'Modelo 2023',
    desc: 'Formato CONALEP actual (MCCEMS). Organiza momentos de inicio, desarrollo y cierre.',
    badge: 'Activo',
    disponible: true,
    path: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  },
  {
    id: MODELO_2025,
    nombre: 'Modelo 2025',
    desc: 'Nuevo formato en desarrollo. Estará disponible próximamente.',
    badge: 'Próximamente',
    disponible: false,
    path: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
  },
]

const METODOS = [
  {
    id: 'ia',
    nombre: 'Planeación completa',
    desc: 'Sube PE y GPE, Planea-Pro genera todo - 100 créditos',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
  {
    id: 'manual',
    nombre: 'Horario automático',
    desc: 'Extrae unidades y horas del PE — 25 créditos',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
]

export default function ModeloMateriaModal({ onConfirmar, onCerrar, sinCreditosDisponibles }) {
  const [modelo, setModelo] = useState(MODELO_2023)
  const [metodo, setMetodo] = useState(null)
  const puedeContinuar = modelo !== null && metodo !== null

  function handleConfirmar() {
    if (!puedeContinuar) return
    onConfirmar({ modelo, conIA: metodo === 'ia' })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overscroll-contain bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onCerrar}
    >
      <div
        className="card relative w-full max-w-lg space-y-7 p-7 shadow-2xl animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onCerrar}
          aria-label="Cerrar"
          className="icon-button absolute right-4 top-4 h-7 w-7 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Crear nueva planeación</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Elige el modelo y la ruta de trabajo.</p>
        </div>

        {/* Selector de modelo */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            1 — Modelo de planeación
          </p>
          <div className="grid grid-cols-2 gap-3">
            {MODELOS.map(m => (
              <button
                key={m.id}
                onClick={() => m.disponible && setModelo(m.id)}
                disabled={!m.disponible}
                className={`selectable-card relative rounded-2xl border-2 p-4 text-left transition-colors
                  disabled:cursor-not-allowed disabled:opacity-50
                  ${modelo === m.id && m.disponible
                    ? 'border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-900/20'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                  }`}
              >
                {/* Badge */}
                {m.badge && modelo !== m.id && (
                  <span className={`absolute right-2 top-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide
                    ${m.disponible
                      ? 'bg-document-100 text-document-700 dark:bg-document-900/40 dark:text-document-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>
                    {m.badge}
                  </span>
                )}
                {modelo === m.id && (
                  <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600">
                    <svg aria-hidden="true" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl
                  ${modelo === m.id && m.disponible
                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400'}`}>
                  <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={m.path} />
                  </svg>
                </div>
                <p className="mb-1 text-sm font-bold text-slate-900 dark:text-white">{m.nombre}</p>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{m.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Selector de método — solo cuando el modelo seleccionado está disponible */}
        {modelo === MODELO_2023 && (
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              2 — Cómo crearla
            </p>
            <div className="space-y-2">
              {METODOS.map(met => {
                const iaDeshabilitado = met.id === 'ia' && sinCreditosDisponibles
                return (
                  <button
                    key={met.id}
                    onClick={() => !iaDeshabilitado && setMetodo(met.id)}
                    disabled={iaDeshabilitado}
                    className={`selectable-card flex w-full items-center gap-3 rounded-xl border p-3.5 text-left disabled:cursor-not-allowed disabled:opacity-40
                      ${metodo === met.id
                        ? 'border-brand-400 bg-brand-50 dark:border-brand-500 dark:bg-brand-900/20'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                      }`}
                  >
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl
                      ${metodo === met.id ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400'}`}>
                      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={met.icon} />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{met.nombre}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {met.id === 'ia' && sinCreditosDisponibles ? 'Necesitas créditos para la planeación completa' : met.desc}
                      </p>
                    </div>
                    {metodo === met.id && (
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-600">
                        <svg aria-hidden="true" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <button
          onClick={handleConfirmar}
          disabled={!puedeContinuar}
          className="btn-accent w-full justify-center py-2.5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continuar con esta ruta
          <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
