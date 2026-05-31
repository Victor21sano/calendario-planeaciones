import BotonCopiarTabla from './BotonCopiarTabla'

const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

/**
 * Bloque "Resultado y Actividad de Aprendizaje".
 * Aparece arriba de cada actividad específica.
 * El campo "Evidencia a recopilar" se muestra solo en la primera actividad del RA.
 */
export default function BloqueRA({ ra, mostrarEvidencia = true, bloqueado = false }) {
  const campos = [
    { label: 'Resultado de Aprendizaje',          valor: ra?.titulo },
    { label: 'Duración del Resultado (en horas)',  valor: `${ra?.duracionHoras ?? '—'} hrs` },
    { label: 'Actividad de Evaluación',            valor: ra?.actividadEvaluacion?.descripcion },
  ]
  if (mostrarEvidencia) {
    campos.push({ label: 'Evidencia a recopilar', valor: ra?.actividadEvaluacion?.evidencia })
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-600 pb-1">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
          Resultado y Actividad de Aprendizaje
        </h3>
        <BotonCopiarTabla
          bloqueado={bloqueado}
          etiqueta="RA"
          getHTML={() => `<div style="font-family:Arial;font-size:11pt">
            <h3 style="border-bottom:2px solid #10b981;padding-bottom:4px">Resultado y Actividad de Aprendizaje</h3>
            ${campos.map(c => `<p style="border:1px solid #cbd5e1;padding:6px"><strong>${c.label}:</strong> ${esc(c.valor)}</p>`).join('')}
          </div>`}
        />
      </div>
      <div className="space-y-1 text-sm">
        {campos.map(c => (
          <div key={c.label} className="border border-slate-300 dark:border-slate-600 px-3 py-1.5 bg-white dark:bg-slate-900/50">
            <span className="font-semibold">{c.label}: </span>{c.valor || '—'}
          </div>
        ))}
      </div>
    </div>
  )
}
