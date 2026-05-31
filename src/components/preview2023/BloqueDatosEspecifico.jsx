import BotonCopiarTabla from './BotonCopiarTabla'
import { formatearRango } from '../../modelos/2023/calendario.js'

const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

/**
 * Bloque "Datos Específico" de una actividad.
 * Contiene: propósito, duración, modalidad, contenido específico y fechas.
 */
export default function BloqueDatosEspecifico({ actividad, bloqueado = false }) {
  const rango = formatearRango(actividad?.fechaInicio, actividad?.fechaFin)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-600 pb-1">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
          Datos Específico
        </h3>
        <BotonCopiarTabla
          bloqueado={bloqueado}
          etiqueta="Datos"
          getHTML={() => `<div style="font-family:Arial;font-size:11pt">
            <h3 style="border-bottom:2px solid #10b981;padding-bottom:4px">Datos Específico</h3>
            <p style="border:1px solid #cbd5e1;padding:6px"><strong>Propósito del Aprendizaje:</strong> ${esc(actividad?.propositoAprendizaje)}</p>
            <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
              <tr><td><strong>Duración:</strong> ${actividad?.duracionHoras ?? '—'} hrs</td><td><strong>Modalidad:</strong> ${esc(actividad?.modalidad)}</td></tr>
            </table>
            <p style="border:1px solid #cbd5e1;padding:6px;white-space:pre-line"><strong>Contenido Específico:</strong><br>${esc(actividad?.contenidoEspecifico)}</p>
            <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;width:100%">
              <tr><td><strong>Fecha Inicio:</strong> ${esc(actividad?.fechaInicio)}</td><td><strong>Fecha Fin:</strong> ${esc(actividad?.fechaFin)}</td></tr>
            </table>
          </div>`}
        />
      </div>
      <div className="space-y-1 text-sm">
        <div className="border border-slate-300 dark:border-slate-600 px-3 py-1.5 bg-white dark:bg-slate-900/50">
          <span className="font-semibold">Propósito del Aprendizaje: </span>
          {actividad?.propositoAprendizaje || '—'}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          <div className="border border-slate-300 dark:border-slate-600 px-3 py-1.5 bg-white dark:bg-slate-900/50">
            <span className="font-semibold">Duración: </span>{actividad?.duracionHoras ?? '—'} hrs
          </div>
          <div className="border border-slate-300 dark:border-slate-600 px-3 py-1.5 bg-white dark:bg-slate-900/50">
            <span className="font-semibold">Modalidad: </span>{actividad?.modalidad || '—'}
          </div>
        </div>
        <div className="border border-slate-300 dark:border-slate-600 px-3 py-1.5 bg-white dark:bg-slate-900/50 whitespace-pre-line">
          <span className="font-semibold">Contenido Específico: </span>
          {actividad?.contenidoEspecifico || '—'}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          <div className="border border-slate-300 dark:border-slate-600 px-3 py-1.5 bg-white dark:bg-slate-900/50">
            <span className="font-semibold">Fecha Inicio: </span>{actividad?.fechaInicio || '—'}
          </div>
          <div className="border border-slate-300 dark:border-slate-600 px-3 py-1.5 bg-white dark:bg-slate-900/50">
            <span className="font-semibold">Fecha Fin: </span>{actividad?.fechaFin || '—'}
          </div>
        </div>
        {rango && (
          <p className="text-xs text-slate-500 dark:text-slate-400 px-1">{rango}</p>
        )}
      </div>
    </div>
  )
}
