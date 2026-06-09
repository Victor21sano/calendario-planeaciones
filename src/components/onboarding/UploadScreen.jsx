import { useState, useRef } from 'react'
import { fileSizeMB } from '../../services/iaPlaneacion'
import BrandMark from '../brand/BrandMark'

function Stepper({ step }) {
  const steps = ['Documentos', 'Generación', 'Listo']
  return (
    <div className="mb-10 flex items-center gap-0">
      {steps.map((label, i) => {
        const n = i + 1
        const done = n < step
        const active = n === step
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-[background-color,color] duration-200
              ${done || active
                ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
              <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold
                ${done || active ? 'bg-brand-600 text-white' : 'bg-slate-300 text-slate-500 dark:bg-slate-600 dark:text-slate-400'}`}>
                {done ? (
                  <svg aria-hidden="true" viewBox="0 0 12 12" fill="none" className="h-3 w-3">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : n}
              </span>
              {label}
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-1 h-px flex-1 transition-colors duration-200 ${done ? 'bg-brand-300 dark:bg-brand-700' : 'bg-slate-200 dark:bg-slate-700'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function DropZone({ label, sublabel, icon, file, onFile, disabled, name }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f?.type === 'application/pdf') onFile(f)
  }

  function handleKeyDown(e) {
    if (disabled) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      inputRef.current?.click()
    }
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={file ? `${label} cargado: ${file.name}` : `Subir ${label}`}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={handleKeyDown}
      className={`pdf-dropzone relative flex min-h-[210px] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8
        ${disabled ? 'is-disabled cursor-not-allowed opacity-50' : ''}
        ${dragging
          ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20'
          : file
            ? 'border-academic-400 bg-academic-50 dark:bg-academic-900/20'
            : 'border-slate-300 bg-white hover:border-brand-400 hover:bg-brand-50/50 dark:border-slate-600 dark:bg-slate-800/30 dark:hover:bg-brand-900/10'
        }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        name={name}
        className="hidden"
        onChange={e => onFile(e.target.files[0])}
        disabled={disabled}
      />

      {file ? (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-academic-100 dark:bg-academic-900/30">
            <svg aria-hidden="true" className="h-7 w-7 text-academic-600 dark:text-academic-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="max-w-[190px] truncate text-sm font-bold text-academic-700 dark:text-academic-300">{file.name}</p>
            <p className="mt-0.5 text-xs text-academic-600 dark:text-academic-400">{fileSizeMB(file).toFixed(1)} MB</p>
          </div>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onFile(null) }}
            aria-label={`Quitar ${label}`}
            className="icon-button absolute right-3 top-3 h-7 w-7 rounded-full bg-danger-100 text-xs font-bold text-danger-500 hover:bg-danger-200 dark:bg-danger-900/40"
          >
            x
          </button>
        </>
      ) : (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700/60">
            {icon}
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{label}</p>
            <p className="mt-1 max-w-[170px] text-xs leading-relaxed text-slate-500 dark:text-slate-400">{sublabel}</p>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">
            Arrastra aquí o presiona Enter para seleccionar
          </p>
        </>
      )}
    </div>
  )
}

export default function UploadScreen({ onGenerate, onFreeGenerate, error, bloqueado = false, modoSoloPlanificador = false }) {
  const [pdfPE, setPdfPE] = useState(null)
  const [pdfGPE, setPdfGPE] = useState(null)
  const canGenerate = pdfPE && pdfGPE && !bloqueado && !modoSoloPlanificador
  const canFreeGenerate = !!(pdfPE && pdfGPE)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 animate-fade-in dark:bg-slate-950">
      <div className="w-full max-w-2xl">
        <Stepper step={1} />

        <div className="mb-10 text-center">
          <div className="mb-5 flex justify-center">
            <BrandMark className="w-14 h-14" />
          </div>
          <h2 className="mb-2 font-display text-2xl font-semibold text-slate-900 dark:text-white">
            Sube PE y GPE del mismo módulo
          </h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Planea-Pro usará estos documentos oficiales para detectar unidades, RAs, horas y la estructura de tu planeación.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DropZone
            label="Programa de Estudios (PE)"
            name="programa-estudios"
            sublabel="Unidades, RAs, horas y contenidos oficiales"
            icon={
              <svg aria-hidden="true" className="h-7 w-7 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            file={pdfPE}
            onFile={setPdfPE}
            disabled={false}
          />
          <DropZone
            label="Guía Pedagógica (GPE)"
            name="guia-pedagogica"
            sublabel="Competencias, atributos y evaluaciones"
            icon={
              <svg aria-hidden="true" className="h-7 w-7 text-academic-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            }
            file={pdfGPE}
            onFile={setPdfGPE}
            disabled={false}
          />
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-800 dark:border-danger-800/40 dark:bg-danger-900/20 dark:text-danger-300" aria-live="polite">
            <p className="mb-1 font-semibold">No pudimos preparar la planeación:</p>
            <p className="break-all font-mono text-xs opacity-80">{error.slice(0, 200)}</p>
          </div>
        )}

        {!modoSoloPlanificador && (
          <button
            onClick={() => onGenerate(pdfPE, pdfGPE)}
            disabled={!canGenerate}
            className={`btn-accent mb-4 w-full justify-center gap-2 py-3.5 text-base disabled:cursor-not-allowed disabled:opacity-40
              ${bloqueado ? 'pointer-events-none opacity-40' : ''}`}
          >
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generar planeación didáctica (100 créditos)
          </button>
        )}

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Horario automático</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>

        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/40">
          <div className="mb-3 flex items-start gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-document-50 dark:bg-document-900/25">
              <svg aria-hidden="true" className="h-5 w-5 text-document-700 dark:text-document-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Solo planificador de horarios (25 créditos)</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Extrae unidades y horas del PE para construir tu planificador de horarios.
              </p>
            </div>
          </div>
          <button
            onClick={() => onFreeGenerate?.(pdfPE, pdfGPE)}
            disabled={!canFreeGenerate}
            className="pressable flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/50"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {canFreeGenerate ? 'Generar horario automático (25 créditos)' : 'Sube PE y GPE para continuar'}
          </button>
        </div>
      </div>
    </div>
  )
}
