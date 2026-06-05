import BotonCopiarTabla from './BotonCopiarTabla'

const esc = s => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const CONFIG = {
  inicio:     { titulo: 'Inicio',     bg: 'bg-info-50 dark:bg-info-950/20',   border: 'border-info-200 dark:border-info-900/50' },
  desarrollo: { titulo: 'Desarrollo', bg: 'bg-success-50 dark:bg-success-950/20', border: 'border-success-200 dark:border-success-900/50' },
  cierre:     { titulo: 'Cierre',     bg: 'bg-warning-50 dark:bg-warning-950/20',     border: 'border-warning-200 dark:border-warning-900/50' },
}

const CAMPOS = [
  { key: 'tiempoHoras',                    label: 'Tiempo',                            sufijo: ' horas' },
  { key: 'ambienteAprendizaje',            label: 'Ambiente de Aprendizaje' },
  { key: 'estrategiaEnsenanzaDocente',     label: 'Estrategia de Enseñanza (Docente)',  multi: true },
  { key: 'estrategiaAprendizajeAlumno',    label: 'Estrategia de Aprendizaje (Alumno)', multi: true },
  { key: 'estrategiaEvaluacion',           label: 'Estrategia de Evaluación',           multi: true },
  { key: 'recursosMaterialesDidacticos',   label: 'Recursos y Materiales Didácticos' },
]

/**
 * Bloque de un momento didáctico: Inicio, Desarrollo o Cierre.
 * El `tipo` ('inicio'|'desarrollo'|'cierre') determina el color de fondo.
 */
export default function BloqueMomento({ tipo, momento, bloqueado = false }) {
  const cfg = CONFIG[tipo] || { titulo: tipo, bg: '', border: 'border-slate-300 dark:border-slate-600' }

  function htmlMomento() {
    const filas = [
      ['Tiempo', `${momento?.tiempoHoras ?? '—'} horas`],
      ['Ambiente de Aprendizaje', momento?.ambienteAprendizaje],
      ['Estrategia de Enseñanza (Docente)', momento?.estrategiaEnsenanzaDocente],
      ['Estrategia de Aprendizaje (Alumno)', momento?.estrategiaAprendizajeAlumno],
      ['Estrategia de Evaluación', momento?.estrategiaEvaluacion],
      ['Recursos y Materiales Didácticos', momento?.recursosMaterialesDidacticos],
      ['Estudio Independiente',
        momento?.estudioIndependiente?.descripcion
          ? `${momento.estudioIndependiente.descripcion} (${momento.estudioIndependiente.duracionHoras || 0} hrs)`
          : '—'],
    ]
    return `<div style="font-family:Arial;font-size:11pt">
      <h3 style="border-bottom:2px solid #10b981;padding-bottom:4px">${cfg.titulo}</h3>
      ${filas.map(([k, v]) => `<p style="border:1px solid #cbd5e1;padding:6px;white-space:pre-line"><strong>${k}:</strong> ${esc(v)}</p>`).join('')}
    </div>`
  }

  const estIndep = momento?.estudioIndependiente
  const tieneEstudio = estIndep?.descripcion && estIndep.descripcion.trim()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-600 pb-1">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
          {cfg.titulo}
        </h3>
        <BotonCopiarTabla bloqueado={bloqueado} etiqueta={cfg.titulo} getHTML={htmlMomento} />
      </div>

      <div className={`rounded-lg border ${cfg.border} ${cfg.bg} p-3 space-y-1`}>
        {CAMPOS.map(campo => (
          <div key={campo.key} className="border border-slate-300 dark:border-slate-600 px-3 py-1.5 bg-white dark:bg-slate-900/60 text-sm">
            <span className="font-semibold">{campo.label}: </span>
            <span className={campo.multi ? 'whitespace-pre-line' : ''}>
              {(momento?.[campo.key] ?? '—') + (campo.sufijo || '')}
            </span>
          </div>
        ))}

        {/* Estudio independiente */}
        <div className="border border-slate-300 dark:border-slate-600 px-3 py-1.5 bg-white dark:bg-slate-900/60 text-sm">
          <span className="font-semibold">Estudio Independiente: </span>
          {tieneEstudio
            ? `${estIndep.descripcion} (${estIndep.duracionHoras || 0} hrs)`
            : '—'}
        </div>
      </div>
    </div>
  )
}
