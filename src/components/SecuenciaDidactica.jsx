import { useState } from 'react'

const PHASE_CONFIG = {
  apertura: {
    label: 'APERTURA',
    color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40',
    headerColor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    defaultEval: 'Diagnóstica. Autoevaluación.',
  },
  desarrollo: {
    label: 'DESARROLLO',
    color: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40',
    headerColor: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
    defaultEval: 'Formativa. Heteroevaluación.',
  },
  cierre: {
    label: 'CIERRE',
    color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40',
    headerColor: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
    defaultEval: 'Sumativa. Heteroevaluación.',
  },
}

function PhaseForm({ phase, data, onChange, label }) {
  const cfg = PHASE_CONFIG[phase]
  function set(key, val) { onChange({ ...data, [key]: val }) }

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${cfg.color}`}>
      <p className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-lg inline-block ${cfg.headerColor}`}>
        {cfg.label}
      </p>
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Enseñanza (El docente...)
          </label>
          <textarea
            value={data.ensenanza}
            onChange={e => set('ensenanza', e.target.value)}
            placeholder={`El docente: ${phase === 'apertura' ? 'Presenta el tema, activa conocimientos previos...' : phase === 'desarrollo' ? 'Explica el contenido, guía actividades...' : 'Refuerza conceptos, evalúa aprendizajes...'}`}
            rows={3}
            className="input-base resize-y"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Aprendizaje (El alumno...)
          </label>
          <textarea
            value={data.aprendizaje}
            onChange={e => set('aprendizaje', e.target.value)}
            placeholder={`El alumno: ${phase === 'apertura' ? 'Participa activamente, responde preguntas detonadoras...' : phase === 'desarrollo' ? 'Realiza actividades, practica los contenidos...' : 'Presenta evidencias, reflexiona sobre su aprendizaje...'}`}
            rows={3}
            className="input-base resize-y"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Evaluación
            </label>
            <input
              type="text"
              value={data.evaluacion}
              onChange={e => set('evaluacion', e.target.value)}
              placeholder={cfg.defaultEval}
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Ambiente de aprendizaje
            </label>
            <input
              type="text"
              value={data.ambiente}
              onChange={e => set('ambiente', e.target.value)}
              placeholder="Salón de clases. Centro de cómputo."
              className="input-base"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Recursos y materiales didácticos
          </label>
          <textarea
            value={data.recursos}
            onChange={e => set('recursos', e.target.value)}
            placeholder="Pizarrón, computadora, proyector, material didáctico..."
            rows={2}
            className="input-base resize-y"
          />
        </div>
      </div>
    </div>
  )
}

export default function SecuenciaDidactica({ sesion, onChange, sesionLabel }) {
  const [open, setOpen] = useState(true)

  function setPhase(phase, data) {
    onChange({ ...sesion, [phase]: data })
  }

  function setSesionField(key, val) {
    onChange({ ...sesion, [key]: val })
  }

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="badge bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
            Sesión {sesionLabel}
          </span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Secuencia Didáctica
          </span>
          {sesion.duracion && (
            <span className="text-xs text-slate-400">— {sesion.duracion} hrs</span>
          )}
        </div>
        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-100 dark:border-white/5 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Número de sesión (ej: 1/2)
              </label>
              <input
                type="text"
                value={sesion.numero}
                onChange={e => setSesionField('numero', e.target.value)}
                placeholder="1/2"
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Duración (ej: 10/20)
              </label>
              <input
                type="text"
                value={sesion.duracion}
                onChange={e => setSesionField('duracion', e.target.value)}
                placeholder="10/20"
                className="input-base"
              />
            </div>
          </div>

          <PhaseForm phase="apertura"  data={sesion.apertura}  onChange={d => setPhase('apertura', d)}  label={sesionLabel} />
          <PhaseForm phase="desarrollo" data={sesion.desarrollo} onChange={d => setPhase('desarrollo', d)} label={sesionLabel} />
          <PhaseForm phase="cierre"    data={sesion.cierre}    onChange={d => setPhase('cierre', d)}    label={sesionLabel} />
        </div>
      )}
    </div>
  )
}
