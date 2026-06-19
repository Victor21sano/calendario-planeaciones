import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  extraerEstructuraDesdeArchivos,
  generarRAsDesdeEstructura,
  buildUnidadesFromAI,
  getProviderInfo,
  fileSizeMB,
} from '../services/iaPlaneacion'
import { useAuth } from '../contexts/AuthContext'
import { iniciarSesionGeneracion, finalizarSesionGeneracion } from '../services/creditosService'

// ─── DropZone ─────────────────────────────────────────────────
// onBloqueado: si se define, el clic llama a este callback en lugar de abrir el picker.
function DropZone({ label, sublabel, file, onFile, accept = '.pdf', disabled, onBloqueado }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()
  const bloqueado = Boolean(onBloqueado)

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    if (bloqueado) { onBloqueado(); return }
    const f = e.dataTransfer.files[0]
    if (f && f.type === 'application/pdf') onFile(f)
  }

  function handleClick() {
    if (bloqueado) { onBloqueado(); return }
    if (!disabled) inputRef.current?.click()
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200
        ${disabled && !bloqueado ? 'opacity-50 cursor-not-allowed' : ''}
        ${bloqueado ? 'opacity-60 cursor-not-allowed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/30' : ''}
        ${!bloqueado && dragging
          ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20'
          : !bloqueado && file
            ? 'border-success-400 bg-success-50 dark:bg-success-900/20'
            : !bloqueado
              ? 'border-slate-300 dark:border-slate-600 hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10'
              : ''
        }`}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => onFile(e.target.files[0])} disabled={disabled || bloqueado} />

      {file ? (
        <>
          <svg className="w-8 h-8 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-center">
            <p className="text-sm font-semibold text-success-700 dark:text-success-300 truncate max-w-[200px]">{file.name}</p>
            <p className="text-xs text-success-600 dark:text-success-400">{fileSizeMB(file).toFixed(1)} MB</p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onFile(null) }}
            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-danger-100 dark:bg-danger-900/40 text-danger-500 flex items-center justify-center hover:bg-danger-200 transition-colors text-xs font-bold"
          >✕</button>
        </>
      ) : (
        <>
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{sublabel}</p>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-600">Arrastra aquí o haz clic</p>
        </>
      )}
    </div>
  )
}

// ─── Progress Bar ─────────────────────────────────────────────
function ProgressBar({ progress, errors }) {
  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0
  const isConverting = progress.phase === 'converting'
  const isStructure  = progress.phase === 'structure'
  const isRA         = progress.phase === 'ra'
  const isDone       = progress.phase === 'done'
  const isWaiting    = isRA && progress.waitSeconds > 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className={`${isDone ? 'text-success-600 dark:text-success-400' : isWaiting ? 'text-warning-600 dark:text-warning-400' : 'text-primary-600 dark:text-primary-400'}`}>
          {isWaiting
            ? `La API de Google necesita un momento, continuamos en ${progress.waitSeconds}s…`
            : progress.message}
        </span>
        {isRA && !isWaiting && (
          <span className="text-slate-400 dark:text-slate-500">{progress.current}/{progress.total}</span>
        )}
        {isWaiting && (
          <span className="text-2xl font-black text-warning-500 dark:text-warning-400 tabular-nums leading-none">
            {progress.waitSeconds}s
          </span>
        )}
      </div>

      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-500
            ${isDone ? 'bg-success-400 dark:bg-success-500' : 'bg-gradient-to-r from-brand-600 to-academic-600'}
            ${isConverting || isStructure ? 'animate-pulse' : ''}`}
          style={{ width: isConverting || isStructure ? '20%' : `${isDone ? 100 : pct}%` }}
        />
      </div>

      {isRA && (
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: progress.total }, (_, i) => {
            const done    = i < (progress.current - 1)
            const current = i === (progress.current - 1)
            return (
              <span key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all
                ${done    ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300' :
                  current ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 animate-pulse' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                {i + 1}
              </span>
            )
          })}
        </div>
      )}

      {isDone && errors && Object.keys(errors).length > 0 && (
        <div className="p-3 rounded-xl bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800/40 text-xs text-warning-800 dark:text-warning-300">
          <p className="font-semibold mb-1">Algunos RAs tuvieron errores (puedes reintentarlos por pestaña):</p>
          {Object.entries(errors).map(([ra, msg]) => (
            <p key={ra}>• RA {ra}: {msg.slice(0, 80)}</p>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Estructura Preview (paso de confirmación) ─────────────────
function EstructuraPreview({ estructura, hasExisting, onConfirm, onCancel }) {
  const totalRAs = estructura.unidades.flatMap(u => u.resultados || []).length
  return (
    <div className="space-y-4">
      {/* Módulo detectado */}
      <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/40">
        <p className="text-xs font-bold text-primary-700 dark:text-primary-300 uppercase tracking-wide mb-1">Módulo detectado del PE</p>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{estructura.modulo.nombre}</p>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span>Semestre {estructura.modulo.semestre}</span>
          {estructura.modulo.horasTotales > 0 && <span>{estructura.modulo.horasTotales} hrs totales</span>}
          <span>{estructura.unidades.length} unidades · {totalRAs} RAs</span>
        </div>
      </div>

      {/* Lista de RAs detectados */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
        <p className="font-bold text-slate-700 dark:text-slate-200">Resultados de aprendizaje detectados del PDF:</p>
        {estructura.unidades.map(u => (
          <div key={u.numero}>
            <p className="font-semibold text-slate-600 dark:text-slate-300">
              Unidad {u.numero}: {u.nombre} ({u.horas} hrs)
            </p>
            <ul className="ml-3 mt-0.5 space-y-0.5">
              {(u.resultados || []).map(r => (
                <li key={r.raLabel} className="text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-primary-600 dark:text-primary-400">{r.raLabel}</span>
                  {' — '}{r.nombre.slice(0, 70)}{r.nombre.length > 70 ? '…' : ''} · {r.horas} hrs
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Aviso de reemplazo */}
      {hasExisting && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800/40 text-xs text-warning-800 dark:text-warning-300">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span>
            <strong>Se reemplazará la estructura actual.</strong> El contenido existente de los RAs que coincidan se conservará; se eliminarán los que ya no estén en este PE.
          </span>
        </div>
      )}

      {/* Botones */}
      <div className="flex items-center gap-3">
        <button onClick={onConfirm} className="btn-primary gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          Confirmar y generar planeaciones
        </button>
        <button onClick={onCancel} className="btn-secondary">
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function GeneradorIA({ onGenerated, onUpdateUnidades, raList, onSinCreditos = () => {}, modelo = '2023', materiaId = null }) {
  const { creditos, esAdmin, sinCreditosDisponibles: modoGratis } = useAuth()
  const [pdfPE,  setPdfPE]  = useState(null)
  const [pdfGPE, setPdfGPE] = useState(null)

  // Estado del flujo de dos pasos
  // idle → extracting → confirming → generating → done | error
  const [uiStep,    setUiStep]    = useState('idle')
  const [estructura, setEstructura] = useState(null)
  const [progress,  setProgress]  = useState({ phase: 'idle', message: '', current: 0, total: 0 })
  const [lastResult, setLastResult] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [globalError, setGlobalError] = useState('')
  const [open, setOpen] = useState(true)
  const provider = getProviderInfo()

  const isRunning = uiStep === 'extracting' || uiStep === 'generating'

  // Mensaje de error que refleja el reembolso REAL decidido por el servidor.
  // res = { reembolsado } devuelto por finalizarSesionGeneracion (o null).
  function mensajeError(msg, res) {
    if (esAdmin) return msg
    if (res?.reembolsado) return `${msg} — El crédito se reembolsó automáticamente.`
    return `${msg} — La IA ya había generado contenido, así que el crédito se consumió. ` +
           'Si consideras que es un error, contacta al administrador para un reembolso.'
  }

  // ── Paso 1: extraer estructura ──
  // Abre la sesión de generación AQUÍ (descuenta 1 crédito en el servidor).
  // La misma sesión cubre la confirmación del usuario y el Paso 2; si el
  // flujo falla o se cancela, el servidor reembolsa el crédito.
  async function handleExtraer() {
    if (!pdfPE || !pdfGPE) return

    // Gate de UX (el descuento real es atómico en el servidor)
    if (!esAdmin && creditos <= 0) { onSinCreditos(); return }

    let sid
    try {
      sid = await iniciarSesionGeneracion('completa', materiaId)
    } catch (err) {
      if (err.code === 'functions/failed-precondition') onSinCreditos()
      else setGlobalError(err.message || 'No se pudo iniciar la generación. Intenta de nuevo.')
      return
    }
    setSessionId(sid)

    setUiStep('extracting')
    setGlobalError('')
    setProgress({ phase: 'converting', message: 'Preparando PDFs…', current: 0, total: 0 })

    try {
      const est = await extraerEstructuraDesdeArchivos(pdfPE, pdfGPE, p => setProgress(p), sid)
      try { onUpdateUnidades(buildUnidadesFromAI(est.unidades)) } catch {}
      setEstructura(est)
      setUiStep('confirming')
    } catch (err) {
      const res = await finalizarSesionGeneracion(sid, false)
      setSessionId(null)
      setUiStep('error')
      setGlobalError(mensajeError(err.message, res))
      setProgress(p => ({ ...p, phase: 'error', message: 'Error al analizar el PE.' }))
    }
  }

  // ── Paso 2: generar RAs tras confirmación ──
  // Reutiliza la sesión abierta en handleExtraer (no descuenta de nuevo).
  async function handleGenerarRAs() {
    if (!estructura) return
    setUiStep('generating')
    setProgress({ phase: 'ra', message: 'Iniciando generación de planeaciones…', current: 0, total: 0 })

    try {
      const { rasData, errors } = await generarRAsDesdeEstructura(estructura, p => setProgress(p), sessionId)
      await finalizarSesionGeneracion(sessionId, true)
      setSessionId(null)
      const result = { estructura, rasData, errors }
      setLastResult(result)
      setUiStep('done')
      onGenerated(result)
    } catch (err) {
      const res = await finalizarSesionGeneracion(sessionId, false)
      setSessionId(null)
      setUiStep('error')
      setGlobalError(mensajeError(err.message, res))
      setProgress(p => ({ ...p, phase: 'error', message: 'Error durante la generación.' }))
    }
  }

  function handleCancelar() {
    // El usuario canceló tras extraer: cerrar la sesión reembolsa el crédito.
    if (sessionId) {
      finalizarSesionGeneracion(sessionId, false)
      setSessionId(null)
    }
    setEstructura(null)
    setUiStep('idle')
    setProgress({ phase: 'idle', message: '' })
  }

  function handleReset() {
    setEstructura(null)
    setLastResult(null)
    setUiStep('idle')
    setGlobalError('')
    setProgress({ phase: 'idle', message: '' })
  }

  const isDone  = uiStep === 'done'
  const isError = uiStep === 'error'
  const isConfirming = uiStep === 'confirming'

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-info-500 to-primary-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Generar automáticamente con IA</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">Sube los dos PDFs oficiales y {provider.name} genera todas las planeaciones</p>
          </div>
          {isDone && (
            <span className="badge bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 ml-2">Completado</span>
          )}
          {esAdmin && (
            <span className="badge bg-info-100 dark:bg-info-900/30 text-info-700 dark:text-info-300 ml-2">
              MODO ADMIN
            </span>
          )}
        </div>
        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 flex-shrink-0 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-slate-100 dark:border-white/5 px-5 pb-5 pt-4 space-y-5">

          {/* ── Modo gratis: bloqueo con CTA ── */}
          {modoGratis && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-50 to-academic-50 dark:from-brand-900/20 dark:to-academic-900/20 border border-primary-200 dark:border-primary-800/40 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-600 to-academic-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Generación automática con IA</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Sube el PE y la GPE. La IA genera todas tus planeaciones en 1-3 minutos.
                    </p>
                  </div>
                </div>

                <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  {[
                    'Detección automática de módulo, unidades y RAs desde el PDF',
                    'Generación de todas las tablas de planeación didáctica',
                    'Secuencia didáctica completa por sesión',
                    'Exportar y copiar a Word con un clic',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-3 pt-1">
                  <Link to="/comprar-creditos" className="btn-accent gap-2 text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                    Adquirir créditos
                  </Link>
                  <span className="text-xs text-slate-400 dark:text-slate-500">Planeación completa: 100 créditos (75 si ya pagaste el horario)</span>
                </div>
              </div>
            </div>
          )}

          {/* Modo activo */}
          {!modoGratis && provider.mode === 'gemini' ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800/40 text-xs text-success-800 dark:text-success-300">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              <span><strong>Gemini ({provider.model}):</strong> Usando Google AI Studio directamente.</span>
            </div>
          ) : !modoGratis && provider.mode === 'anthropic' ? (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800/40 text-xs text-warning-800 dark:text-warning-300">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <span><strong>Modo de desarrollo (Claude directo):</strong> Solo usar para pruebas locales.</span>
            </div>
          ) : !modoGratis ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800/40 text-xs text-success-800 dark:text-success-300">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
              <span><strong>Modo seguro (Cloud Function):</strong> La API key está protegida en el servidor.</span>
            </div>
          ) : null}

          {/* ── PASO 1: Drop zones (idle / error) — solo en modo pagado ── */}
          {!modoGratis && (uiStep === 'idle' || isError) && (
            <>
              {/* onBloqueado bloquea visualmente el DropZone cuando no hay créditos */}
              {(() => {
                const sinCreditos = !esAdmin && creditos <= 0
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DropZone
                      label="Programa de Estudios"
                      sublabel="Archivo PE oficial (PDF)"
                      file={pdfPE}
                      onFile={setPdfPE}
                      disabled={isRunning}
                      onBloqueado={sinCreditos ? onSinCreditos : undefined}
                    />
                    <DropZone
                      label="Guía Pedagógica y de Evaluación"
                      sublabel="Archivo GPE oficial (PDF)"
                      file={pdfGPE}
                      onFile={setPdfGPE}
                      disabled={isRunning}
                      onBloqueado={sinCreditos ? onSinCreditos : undefined}
                    />
                  </div>
                )
              })()}

              {isError && globalError && (
                <div className="p-4 rounded-xl bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/40 text-xs text-danger-800 dark:text-danger-300 space-y-2">
                  <p className="font-semibold">Error:</p>
                  <pre className="whitespace-pre-wrap break-all font-mono">{globalError}</pre>
                </div>
              )}

              <button
                onClick={handleExtraer}
                disabled={!pdfPE || !pdfGPE}
                className="btn-accent gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Analizar Programa de Estudios
              </button>
            </>
          )}

          {/* ── PASO 1 en progreso (extracting) ── */}
          {uiStep === 'extracting' && (
            <ProgressBar progress={progress} errors={null} />
          )}

          {/* ── PASO 2: Confirmación de estructura ── */}
          {isConfirming && estructura && (
            <EstructuraPreview
              estructura={estructura}
              hasExisting={raList.length > 0}
              onConfirm={handleGenerarRAs}
              onCancel={handleCancelar}
            />
          )}

          {/* ── PASO 2 en progreso (generating) ── */}
          {uiStep === 'generating' && (
            <ProgressBar progress={progress} errors={lastResult?.errors} />
          )}

          {/* ── Completado ── */}
          {isDone && (
            <div className="space-y-4">
              <ProgressBar progress={progress} errors={lastResult?.errors} />

              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={handleReset} className="btn-secondary gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  Regenerar desde nuevos PDFs
                </button>
              </div>

              {/* Estructura generada */}
              {lastResult?.estructura && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                  <p className="font-bold text-slate-700 dark:text-slate-200">
                    {lastResult.estructura.modulo.nombre} · Sem. {lastResult.estructura.modulo.semestre}
                  </p>
                  {lastResult.estructura.unidades.map(u => (
                    <div key={u.numero}>
                      <p className="font-semibold text-slate-600 dark:text-slate-300">Unidad {u.numero}: {u.nombre} ({u.horas} hrs)</p>
                      <ul className="ml-3 mt-0.5 space-y-0.5">
                        {(u.resultados || []).map(r => (
                          <li key={r.raLabel} className={lastResult.rasData[r.raLabel] ? 'text-slate-500 dark:text-slate-400' : 'text-danger-500 dark:text-danger-400'}>
                            {r.raLabel}: {r.nombre.slice(0, 60)}{r.nombre.length > 60 ? '…' : ''} · {r.horas} hrs
                            {!lastResult.rasData[r.raLabel] && ' ⚠ Error'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Instrucciones iniciales */}
          {uiStep === 'idle' && !pdfPE && !pdfGPE && (
            <div className="text-xs text-slate-400 dark:text-slate-500 space-y-1">
              <p className="font-semibold text-slate-500 dark:text-slate-400">¿Cómo funciona?</p>
              <p>1. Sube el PE y la GPE. La app detecta la estructura exacta del módulo (unidades y RAs).</p>
              <p>2. Revisas la estructura detectada y confirmas antes de generar.</p>
              <p>3. La IA genera automáticamente todas las planeaciones didácticas (~1-3 min).</p>
              <p>4. Revisa y edita cada RA en sus pestañas correspondientes.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
