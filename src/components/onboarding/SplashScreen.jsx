import { useEffect, useState } from 'react'

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function SplashScreen({ onComplete }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const duration = reduced() ? 80 : 2200
    const t = setTimeout(handleComplete, duration)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line

  function handleComplete() {
    if (exiting) return
    setExiting(true)
    setTimeout(onComplete, reduced() ? 0 : 320)
  }

  return (
    <div
      onClick={handleComplete}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center
        bg-gradient-to-br from-primary-600 via-primary-700 to-violet-800
        cursor-pointer select-none
        ${exiting ? 'animate-fade-out' : 'animate-fade-in'}`}
    >
      {/* ── Brand mark ── */}
      <div className={reduced() ? '' : 'animate-scale-in'} style={{ animationDelay: '0ms' }}>
        <div className="w-24 h-24 bg-white/15 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl shadow-black/30 mb-8">
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      </div>

      {/* ── Title ── */}
      <div className={`text-center ${reduced() ? '' : 'animate-slide-up'}`} style={{ animationDelay: '80ms' }}>
        <h1 className="text-5xl font-black text-white tracking-tight leading-none mb-3">
          PLANEA<span className="text-primary-200">-</span>PRO
        </h1>
        <p className="text-white/65 text-xl font-medium tracking-wide">
          Tus planeaciones didácticas, automáticas.
        </p>
      </div>

      {/* ── Tagline ── */}
      <div className={`mt-12 ${reduced() ? '' : 'animate-fade-in'}`} style={{ animationDelay: '500ms' }}>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/60 text-xs font-semibold tracking-widest uppercase">
            CONALEP · Planeación Didáctica
          </span>
        </div>
      </div>

      {/* ── Skip hint ── */}
      <p className="absolute bottom-8 text-white/30 text-xs font-medium tracking-wide">
        Toca para continuar
      </p>
    </div>
  )
}
