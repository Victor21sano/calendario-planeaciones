import BrandMark from '../brand/BrandMark'

export default function EmptyState({ onCrear, sinCreditosDisponibles }) {
  const steps = [
    { n: '1', label: 'Completa tu perfil', desc: 'Datos oficiales del docente' },
    { n: '2', label: 'Sube PE y GPE', desc: 'Documentos del mismo módulo' },
    { n: '3', label: 'Revisa lo detectado', desc: 'Unidades, RAs y horas' },
    { n: '4', label: 'Exporta a Word', desc: 'Listo para ajustar y entregar' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <div className="mb-5 flex justify-center">
          <BrandMark className="w-16 h-16" />
        </div>
        <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
          Bienvenido a Planea-Pro
        </p>
        <h2 className="font-display text-[2.1rem] font-semibold leading-[1.1] tracking-tight text-slate-950 dark:text-white">
          Empieza tu primera planeación con una ruta clara.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500 dark:text-slate-400">
          Puedes generar una planeación completa con IA o extraer solo el horario automático del módulo.
        </p>
      </div>

      <div className="mx-auto mb-12 grid max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
        <button
          onClick={onCrear}
          disabled={sinCreditosDisponibles}
          className="group card selectable-card relative overflow-hidden p-6 text-left hover:border-brand-300 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:border-brand-700"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-700 to-academic-500" />
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">
            <svg aria-hidden="true" className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
            </svg>
          </div>
          <h3 className="mb-1 text-base font-extrabold text-slate-900 dark:text-white">Planeación completa</h3>
          <p className="mb-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Sube PE y GPE. Planea-Pro propone estructura, sesiones y tablas didácticas para revisar.
          </p>
          <span className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-700 dark:bg-brand-900/30 dark:text-brand-200">
            100 créditos
          </span>
          {sinCreditosDisponibles && (
            <p className="mt-2 text-[11px] font-medium text-warning-700 dark:text-warning-300">
              Necesitas crédito para la generación completa.
            </p>
          )}
        </button>

        <button
          onClick={onCrear}
          className="group card selectable-card p-6 text-left hover:border-document-300 dark:hover:border-document-700"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-document-50 text-document-700 dark:bg-document-900/25 dark:text-document-200">
            <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="mb-1 text-base font-extrabold text-slate-900 dark:text-white">Horario automático</h3>
          <p className="mb-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Extrae unidades y horas para construir tu planificador de horarios.
          </p>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-700/60 dark:text-slate-300">
            25 créditos
          </span>
        </button>
      </div>

      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-slate-900/50">
        <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
          Flujo recomendado
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          {steps.map(step => (
            <div key={step.n} className="rounded-2xl bg-slate-50 p-4 text-center dark:bg-slate-800/60">
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-black text-brand-800 dark:bg-brand-900/40 dark:text-brand-200">
                {step.n}
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{step.label}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
