import { useEffect, useState } from 'react'
import BrandMark from '../brand/BrandMark'

const TIPS = [
  'Leyendo documentos oficiales y ubicando la estructura del módulo.',
  'Identificando unidades, resultados de aprendizaje y horas asignadas.',
  'Revisando que PE y GPE correspondan al mismo módulo.',
  'Organizando sesiones para que puedas revisar antes de exportar.',
  'Preparando una base editable, no un documento cerrado.',
  'Una buena planeación deja claro qué hará el docente y qué hará el alumno.',
  'La evaluación formativa ayuda a corregir a tiempo, no solo a calificar al final.',
  'El cierre de sesión es clave para detectar dudas antes de avanzar.',
  'Relacionar el contenido con el contexto del grupo mejora la participación.',
  'Documentar tus planeaciones te permite mejorarlas ciclo tras ciclo.',
]

function ProgressBar({ progress }) {
  const isRA = progress.phase === 'ra'
  const isDone = progress.phase === 'done'
  const pct = isRA && progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : isDone ? 100 : null

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-2 flex justify-between text-xs font-semibold text-slate-400 dark:text-slate-500">
        <span>{progress.message || 'Preparando planeación...'}</span>
        {pct !== null && <span className="tabular-nums">{pct}%</span>}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        {pct !== null ? (
          <div
            className="h-2 rounded-full bg-gradient-to-r from-brand-600 to-academic-500 transition-[width] duration-700 ease-spring"
            style={{ width: `${pct}%` }}
          />
        ) : (
          <div
            className="h-2 rounded-full bg-gradient-to-r from-brand-600 to-academic-500"
            style={{
              animation: 'indeterminate 1.5s ease-in-out infinite',
              width: '40%',
            }}
          />
        )}
      </div>
    </div>
  )
}

export default function LoadingTips({ progress, onCancel }) {
  const [tipIdx, setTipIdx] = useState(() => Math.floor(Math.random() * TIPS.length))
  const [tipVisible, setTipVisible] = useState(true)
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    if (reduced) return
    const interval = setInterval(() => {
      setTipVisible(false)
      setTimeout(() => {
        setTipIdx(i => (i + 1) % TIPS.length)
        setTipVisible(true)
      }, 250)
    }, 5000)
    return () => clearInterval(interval)
  }, [reduced])

  const isRA = progress.phase === 'ra'
  const isEstructura = progress.phase === 'estructura'
  const isActividades = progress.phase === 'actividades'
  const isFechas = progress.phase === 'fechas'
  const is2023 = isEstructura || isActividades || isFechas
  const tip = TIPS[tipIdx]

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 animate-fade-in dark:bg-slate-950">
      <div className="w-full max-w-lg text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-brand-200 bg-white shadow-sm dark:border-brand-900 dark:bg-slate-900" />
            <div className="absolute inset-2 rounded-full border-4 border-slate-200 dark:border-slate-700" />
            <div className="absolute inset-2 rounded-full border-4 border-b-transparent border-l-transparent border-r-transparent border-t-brand-500 animate-spin" />
            <BrandMark className="w-14 h-14" compact />
          </div>
        </div>

        {is2023 && (
          <div className="mb-6">
            <p className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">
              {isEstructura ? 'Leyendo estructura del módulo...' : ''}
              {isActividades ? 'Organizando actividades didácticas...' : ''}
              {isFechas ? 'Calculando calendario del semestre...' : ''}
            </p>
            <div className="mx-auto w-full max-w-md">
              {progress.message && (
                <div className="mb-2 flex justify-between text-xs font-semibold text-slate-400 dark:text-slate-500">
                  <span>{progress.message}</span>
                  {progress.current > 0 && (
                    <span className="tabular-nums">{Math.min(100, Math.round(progress.current))}%</span>
                  )}
                </div>
              )}
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                {progress.current > 0 ? (
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-brand-600 to-academic-500 transition-[width] duration-700"
                    style={{ width: `${Math.min(100, progress.current)}%` }}
                  />
                ) : (
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-brand-600 to-academic-500"
                    style={{ animation: 'indeterminate 1.5s ease-in-out infinite', width: '40%' }}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {isRA && progress.total > 0 && (
          <div className="mb-6">
            <p className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">
              Preparando {progress.current} de {progress.total} resultados de aprendizaje
            </p>
            <div className="mb-4 flex flex-wrap justify-center gap-1.5">
              {Array.from({ length: progress.total }, (_, i) => (
                <span key={i} className={`flex h-6 w-6 items-center justify-center rounded-lg text-[9px] font-bold
                  ${i < progress.current - 1 ? 'bg-academic-100 text-academic-700 dark:bg-academic-900/30 dark:text-academic-300' :
                    i === progress.current - 1 ? 'bg-brand-100 text-brand-700 animate-pulse dark:bg-brand-900/30 dark:text-brand-300' :
                    'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                  {i + 1}
                </span>
              ))}
            </div>

            {progress.waitSeconds > 0 && (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-document-200 bg-document-50 px-4 py-3 dark:border-document-800/40 dark:bg-document-900/20">
                <span className="text-xs font-semibold text-document-700 dark:text-document-300">
                  Respetando el límite de la API de Google
                </span>
                <div className="text-3xl font-black leading-none text-document-700 tabular-nums dark:text-document-300">
                  {progress.waitSeconds}s
                </div>
                <p className="text-center text-[10px] text-document-700/70 dark:text-document-300/70">
                  Esto es normal. La generación continúa automáticamente.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Barra genérica solo para fases que NO son del Modelo 2023
            (el bloque is2023 ya muestra su propia barra → evita duplicarla). */}
        {!is2023 && (
          <div className="mb-10">
            <ProgressBar progress={progress} />
          </div>
        )}

        <div className="relative flex h-28 items-center justify-center">
          <div
            className={`transition-[opacity,transform] duration-200 ${tipVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
            style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-black text-brand-700 dark:bg-brand-900/30 dark:text-brand-200" aria-hidden="true">
                  i
                </span>
                <p className="text-left text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                  {tip}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 mt-4 flex justify-center gap-1.5">
          {TIPS.slice(0, 8).map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-[width,background-color] duration-300
              ${i === tipIdx % 8 ? 'w-3 bg-brand-500' : 'w-1.5 bg-slate-300 dark:bg-slate-600'}`} />
          ))}
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="pressable text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            Cancelar y volver a la subida de archivos
          </button>
        )}
      </div>

      <style>{`
        @keyframes indeterminate {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="indeterminate"] { animation: none; width: 60% !important; }
        }
      `}</style>
    </div>
  )
}
