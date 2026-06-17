import { useState } from 'react'
import { generarActividadesParaRA2023 } from '../../services/ia/gemini2023'
import { iniciarSesionGeneracion, finalizarSesionGeneracion } from '../../services/creditosService'

export default function BotonRegenerarRA({ ra, cabecera, pdfPE, pdfGPE, onRegenerado }) {
  const [generando,  setGenerando]  = useState(false)
  const [confirmar,  setConfirmar]  = useState(false)
  const [errorLocal, setErrorLocal] = useState('')

  async function handleRegenerar() {
    if (generando) return
    setGenerando(true)
    setErrorLocal('')

    // Sesión propia para esta regeneración (gratis: el flujo regenRA no cobra créditos).
    let sessionId
    try {
      sessionId = await iniciarSesionGeneracion('regenRA')
    } catch (err) {
      setErrorLocal(err.code === 'functions/failed-precondition'
        ? 'Sin créditos. Adquiere créditos para regenerar.'
        : (err.message || 'Error al iniciar la regeneración.'))
      setGenerando(false)
      return
    }

    try {
      const actividades = await generarActividadesParaRA2023({
        pdfPE,
        pdfGPE,
        cabecera,
        raObjetivo:   ra,
        parametros:   { actividadesObjetivo: ra.actividadesEspecificas?.length || 2 },
        sessionId,
      })

      await finalizarSesionGeneracion(sessionId, true)
      onRegenerado(Array.isArray(actividades) ? actividades : [])
    } catch (err) {
      await finalizarSesionGeneracion(sessionId, false)
      setErrorLocal(err.message || 'Error al regenerar.')
      console.error('[BotonRegenerarRA]', err)
    } finally {
      setGenerando(false)
      setConfirmar(false)
    }
  }

  // Sin PDFs → mostrar aviso en lugar del botón
  if (!pdfPE || !pdfGPE) {
    return (
      <p className="text-xs text-slate-500 dark:text-slate-400 italic">
        Para regenerar con IA, vuelve a la pantalla de subida de PDFs y procesa nuevamente el módulo.
      </p>
    )
  }

  if (confirmar) {
    return (
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-warning-50 dark:bg-warning-950/30 border border-warning-200 dark:border-warning-900">
        {/* Warning icon */}
        <svg className="w-4 h-4 text-warning-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <span className="text-xs text-slate-700 dark:text-slate-300 flex-1">
          Reemplazará todas las actividades del RA {ra.codigo}. ¿Continuar?
        </span>
        <button
          onClick={handleRegenerar}
          disabled={generando}
          className="text-xs px-3 py-1 rounded-lg bg-info-600 text-white hover:opacity-90 disabled:opacity-50"
        >
          {generando ? 'Regenerando…' : 'Sí, regenerar'}
        </button>
        <button
          onClick={() => setConfirmar(false)}
          className="text-xs px-3 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          Cancelar
        </button>
        {errorLocal && <p className="w-full text-xs text-danger-600 dark:text-danger-400">{errorLocal}</p>}
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirmar(true)}
      className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg
                 bg-info-50 dark:bg-info-900/30 text-info-700 dark:text-info-300
                 hover:bg-info-100 dark:hover:bg-info-900/50 transition"
    >
      {/* Sparkles icon */}
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
      Regenerar
    </button>
  )
}
