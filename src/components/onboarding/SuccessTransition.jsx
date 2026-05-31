import { useEffect, useState } from 'react'

export default function SuccessTransition({ errors, onComplete }) {
  const [phase, setPhase] = useState('entering')  // 'entering' | 'visible' | 'exiting'
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const hasErrors = errors && Object.keys(errors).length > 0
  const errorCount = hasErrors ? Object.keys(errors).length : 0

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('visible'), reduced ? 0 : 600)
    const t2 = setTimeout(() => {
      setPhase('exiting')
      setTimeout(onComplete, reduced ? 0 : 350)
    }, reduced ? 100 : 3000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, []) // eslint-disable-line

  return (
    <div
      onClick={onComplete}
      className={`min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 cursor-pointer
        ${phase === 'entering' ? 'animate-fade-in' : phase === 'exiting' ? 'animate-fade-out' : ''}`}
    >
      <div className={`text-center transition-all duration-500 ${reduced ? '' : phase === 'entering' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>

        {/* ── Check circle ── */}
        <div className={`flex justify-center mb-8 ${reduced ? '' : 'animate-scale-in'}`}>
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <svg className="w-14 h-14 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            {/* Pulse ring */}
            {!reduced && (
              <div className="absolute inset-0 rounded-full border-4 border-emerald-400/30 animate-ping" />
            )}
          </div>
        </div>

        {/* ── Message ── */}
        <div className={reduced ? '' : 'animate-slide-up'} style={{ animationDelay: '150ms' }}>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">
            {hasErrors
              ? `Planeaciones generadas (${errorCount} con advertencia)`
              : '¡Listo! Planeaciones generadas.'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
            {hasErrors
              ? `Se generaron la mayoría de las planeaciones. Algunos RAs (${Object.keys(errors).join(', ')}) pueden reintentarse desde sus pestañas.`
              : 'Revisa y ajusta lo que necesites. Puedes editar cada resultado de aprendizaje en sus pestañas correspondientes.'}
          </p>
        </div>

        {/* ── Stats chips ── */}
        <div className={`flex flex-wrap justify-center gap-2 mt-6 ${reduced ? '' : 'animate-fade-in'}`}
          style={{ animationDelay: '300ms' }}>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Estructura del PE detectada
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Planeaciones generadas con IA
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Listo para revisar
          </span>
        </div>

        <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-8">
          Toca para entrar a la planeación
        </p>
      </div>
    </div>
  )
}
