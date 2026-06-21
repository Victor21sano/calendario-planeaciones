import { useState } from 'react'
import { generarActividadesParaRA2023 } from '../../services/ia/gemini2023'
import { generarSesionesParaPF2025 } from '../../services/ia/gemini2025'
import { distribuirHorasEntreSesiones } from '../../services/ia/orquestador2025'
import { iniciarSesionGeneracion, finalizarSesionGeneracion } from '../../services/creditosService'
import { PDFS_KEY, base64ToFile } from '../../pages/planificador/utils'

/**
 * Botón para (re)generar las sesiones/actividades de un RA (2023) o PF (2025).
 * Pensado para mostrarse SOLO cuando ese RA/PF quedó sin sesiones (fallo de
 * generación). La regeneración es gratuita (flujo 'regenRA').
 */
export default function BotonRegenerarRA({ ra, cabecera, pdfPE, pdfGPE, onRegenerado, modelo = '2023', materiaId, terminologia }) {
  const [generando,  setGenerando]  = useState(false)
  const [errorLocal, setErrorLocal] = useState('')
  const es2025 = String(modelo) === '2025'
  const t = { raCorto: 'RA', ...terminologia }

  // ¿Hay fuente disponible para regenerar?
  let fuenteLista = false
  if (es2025) {
    try { fuenteLista = !!JSON.parse(sessionStorage.getItem(PDFS_KEY(materiaId)) || '{}').pe } catch { fuenteLista = false }
  } else {
    fuenteLista = !!(pdfPE && pdfGPE)
  }

  async function handleRegenerar() {
    if (generando) return
    setGenerando(true)
    setErrorLocal('')

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
      let sesiones
      if (es2025) {
        const stored = JSON.parse(sessionStorage.getItem(PDFS_KEY(materiaId)) || '{}')
        const pe = base64ToFile(stored.pe, 'PE.pdf')
        const distribucionHoras = distribuirHorasEntreSesiones(ra.duracionHoras || 0)
        sesiones = await generarSesionesParaPF2025({
          pdfPE: pe,
          cabecera,
          pfObjetivo: {
            codigo:                 ra.codigo,
            texto:                  ra.titulo,
            horas:                  ra.duracionHoras,
            ponderacion:            ra.ponderacion,
            actividadEvaluacion:    ra.actividadEvaluacion,
            contenidosFormativos:   ra.contenidosFormativos,
            estrategiasAprendizaje: ra.estrategiasAprendizaje,
            rubrica:                ra.rubrica,
          },
          parametros: { sesionesObjetivo: distribucionHoras.length, distribucionHoras, horasMaximasPorSesion: 7 },
          sessionId,
        })
      } else {
        sesiones = await generarActividadesParaRA2023({
          pdfPE,
          pdfGPE,
          cabecera,
          raObjetivo: ra,
          parametros: { actividadesObjetivo: ra.actividadesEspecificas?.length || 2 },
          sessionId,
        })
      }

      await finalizarSesionGeneracion(sessionId, true)
      onRegenerado(Array.isArray(sesiones) ? sesiones : [])
    } catch (err) {
      await finalizarSesionGeneracion(sessionId, false)
      setErrorLocal(err.message || 'Error al regenerar.')
      console.error('[BotonRegenerarRA]', err)
    } finally {
      setGenerando(false)
    }
  }

  if (!fuenteLista) {
    return (
      <p className="text-xs text-slate-500 dark:text-slate-400 italic">
        Para regenerar, vuelve a la pantalla de subida y procesa nuevamente el archivo.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleRegenerar}
        disabled={generando}
        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg
                   bg-info-600 text-white hover:opacity-90 transition disabled:opacity-50"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        {generando ? 'Generando…' : `Regenerar ${t.raCorto} ${ra.codigo}`}
      </button>
      {errorLocal && <p className="text-xs text-danger-600 dark:text-danger-400">{errorLocal}</p>}
    </div>
  )
}
