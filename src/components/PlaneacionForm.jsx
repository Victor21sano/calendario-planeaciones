import { useState } from 'react'
import SecuenciaDidactica from './SecuenciaDidactica'

const MODALIDADES = ['Presencial', 'Virtual', 'Híbrido', 'En línea', 'A distancia']

function defaultSesion(num, total) {
  return {
    numero: `${num}/${total}`,
    duracion: '',
    apertura: {
      ensenanza: '',
      aprendizaje: '',
      evaluacion: 'Diagnóstica. Autoevaluación.',
      ambiente: 'Salón de clases. Centro de cómputo.',
      recursos: '',
    },
    desarrollo: {
      ensenanza: '',
      aprendizaje: '',
      evaluacion: 'Formativa. Heteroevaluación.',
      ambiente: 'Salón de clases. Centro de cómputo.',
      recursos: '',
    },
    cierre: {
      ensenanza: '',
      aprendizaje: '',
      evaluacion: 'Sumativa. Heteroevaluación.',
      ambiente: 'Salón de clases. Centro de cómputo.',
      recursos: '',
    },
  }
}

function defaultPractica() {
  return { contenido: '', nombre: '', objetivo: '', evaluacion: '', recursos: '' }
}

function Section({ title, children, defaultOpen = true, icon }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-base">{icon}</span>}
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</span>
        </div>
        <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-100 dark:border-white/5 pt-4">
          {children}
        </div>
      )}
    </div>
  )
}

function TA({ label, value, onChange, placeholder = '', rows = 3 }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="input-base resize-y" />
    </div>
  )
}

function TF({ label, value, onChange, placeholder = '' }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="input-base" />
    </div>
  )
}

export default function PlaneacionForm({
  raData,
  onChange,
  unidadNombre,
  unidadProposito,
  onChangeUnidadProposito,
  subunidadNombre,
  subunidadHoras,
  raLabel,
  fechaInicio,
  fechaFin,
}) {
  function set(key, val) { onChange({ ...raData, [key]: val }) }
  function setSocio(key, val) { onChange({ ...raData, socioemocional: { ...raData.socioemocional, [key]: val } }) }

  // Session management
  function handleNumSesiones(n) {
    const count = Math.max(1, Math.min(8, Number(n)))
    const current = raData.sesiones || []
    let next = [...current]
    if (next.length < count) {
      for (let i = next.length; i < count; i++) {
        next.push(defaultSesion(i + 1, count))
      }
    } else {
      next = next.slice(0, count)
    }
    // Update numero labels
    next = next.map((s, i) => ({ ...s, numero: s.numero.split('/')[0] + '/' + count }))
    onChange({ ...raData, numSesiones: count, sesiones: next })
  }

  function updateSesion(idx, sesion) {
    const next = raData.sesiones.map((s, i) => i === idx ? sesion : s)
    onChange({ ...raData, sesiones: next })
  }

  // Practices
  function addPractica() {
    onChange({ ...raData, practicas: [...(raData.practicas || []), defaultPractica()] })
  }
  function updatePractica(idx, practica) {
    const next = (raData.practicas || []).map((p, i) => i === idx ? practica : p)
    onChange({ ...raData, practicas: next })
  }
  function removePractica(idx) {
    onChange({ ...raData, practicas: (raData.practicas || []).filter((_, i) => i !== idx) })
  }

  const numSes = raData.numSesiones || 1
  const sesiones = raData.sesiones || []

  return (
    <div className="space-y-4">

      {/* Info Banner */}
      {(fechaInicio || fechaFin) && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/40 text-sm text-primary-700 dark:text-primary-300">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>
            <strong>Fechas del planificador:</strong> {fechaInicio} – {fechaFin} · {subunidadHoras} horas
          </span>
        </div>
      )}

      {/* Unidad */}
      <Section title="Unidad de Aprendizaje" icon="📚" defaultOpen={true}>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">Unidad (del Planificador)</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{unidadNombre || '—'}</p>
        </div>
        <TA
          label="Propósito de la unidad (del PE)"
          value={unidadProposito}
          onChange={onChangeUnidadProposito}
          placeholder="Diseñar páginas web con contenido estático..."
          rows={3}
        />
      </Section>

      {/* Resultado de Aprendizaje */}
      <Section title="Resultado de Aprendizaje (PE)" icon="🎯" defaultOpen={true}>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-0.5">Nombre del RA (del Planificador)</p>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{subunidadNombre || '—'}</p>
        </div>
        <TA
          label="Nombre completo del RA (texto exacto del PE)"
          value={raData.nombreCompleto}
          onChange={v => set('nombreCompleto', v)}
          placeholder="Diseña la estructura del sitio web con base en las mejores prácticas..."
          rows={3}
        />
        <TA
          label="Actividad de evaluación (del PE)"
          value={raData.actividadEvaluacion}
          onChange={v => set('actividadEvaluacion', v)}
          placeholder="1.1.1 Elabora la justificación y la estructura propuesta del sitio web..."
          rows={3}
        />
        <TA
          label="Contenidos temáticos (del PE — uno por línea o con viñetas)"
          value={raData.contenidos}
          onChange={v => set('contenidos', v)}
          placeholder={`A. Identificación de elementos Web.\n• Internet.\n• World Wide Web.\nB. Comprobación de uso de estándares...`}
          rows={6}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TA
            label="Evidencias a recopilar (del PE)"
            value={raData.evidencias}
            onChange={v => set('evidencias', v)}
            placeholder="Documento con la estructura propuesta del sitio"
            rows={2}
          />
          <TF
            label="Ponderación"
            value={raData.ponderacion}
            onChange={v => set('ponderacion', v)}
            placeholder="10%"
          />
        </div>
      </Section>

      {/* Competencias genéricas */}
      <Section title="Competencias Genéricas y Atributos" icon="🧩" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TF
            label="Competencias Genéricas (números)"
            value={raData.competenciasGenericas}
            onChange={v => set('competenciasGenericas', v)}
            placeholder="1, 4, 5, 6, 7, 8"
          />
          <TF
            label="Atributos (números)"
            value={raData.atributos}
            onChange={v => set('atributos', v)}
            placeholder="1.1, 5.3, 5.6, 6.1, 8.1, 8.2"
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Consulta la GPE para identificar las competencias genéricas y atributos aplicables a este RA.</p>
      </Section>

      {/* Datos pedagógicos */}
      <Section title="Datos Pedagógicos" icon="📝" defaultOpen={true}>
        <TF
          label="Fecha de elaboración"
          value={raData.fechaElaboracion || ''}
          onChange={v => set('fechaElaboracion', v)}
          placeholder="28 de mayo de 2026"
        />
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Modalidad de aprendizaje</label>
          <select value={raData.modalidad || 'Presencial'} onChange={e => set('modalidad', e.target.value)} className="input-base">
            {MODALIDADES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <TA
          label="Propósito de aprendizaje (redacción del docente)"
          value={raData.propositoAprendizaje}
          onChange={v => set('propositoAprendizaje', v)}
          placeholder="Elaborará la justificación para la creación del sitio web..."
          rows={3}
        />
        <TA
          label="Aprendizaje esperado (redacción del docente)"
          value={raData.aprendizajeEsperado}
          onChange={v => set('aprendizajeEsperado', v)}
          placeholder="Conocerá los elementos web para la creación de páginas web..."
          rows={3}
        />
        <TA
          label="Producto esperado / Evidencia (puede coincidir con la del PE)"
          value={raData.productoEsperado}
          onChange={v => set('productoEsperado', v)}
          placeholder="Elabora la justificación y la estructura propuesta del sitio web..."
          rows={2}
        />
      </Section>

      {/* Dimensión Socioemocional */}
      <Section title="Dimensión Socioemocional (opcional)" icon="💚" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TF
            label="Dimensión / Habilidad Socioemocional"
            value={raData.socioemocional?.dimension || ''}
            onChange={v => setSocio('dimension', v)}
            placeholder="Autoconocimiento"
          />
          <TF
            label="Número y nombre de la lección"
            value={raData.socioemocional?.leccion || ''}
            onChange={v => setSocio('leccion', v)}
            placeholder="Lección 3: ..."
          />
          <TF
            label="Duración en minutos"
            value={raData.socioemocional?.duracion || ''}
            onChange={v => setSocio('duracion', v)}
            placeholder="15"
          />
        </div>
      </Section>

      {/* Sesiones */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Secuencia Didáctica</h3>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Número de sesiones:</label>
            <select
              value={numSes}
              onChange={e => handleNumSesiones(e.target.value)}
              className="input-base !w-20 !px-2 !py-1.5 text-sm"
            >
              {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        {sesiones.map((sesion, idx) => (
          <SecuenciaDidactica
            key={idx}
            sesion={sesion}
            onChange={s => updateSesion(idx, s)}
            sesionLabel={sesion.numero || `${idx + 1}/${numSes}`}
          />
        ))}
        {sesiones.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
            Selecciona el número de sesiones para comenzar.
          </p>
        )}
      </div>

      {/* Prácticas */}
      <Section title="Prácticas Programadas" icon="🔬" defaultOpen={false}>
        <div className="space-y-4">
          {(raData.practicas || []).map((p, idx) => (
            <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 relative group">
              <button
                onClick={() => removePractica(idx)}
                className="absolute top-3 right-3 btn-danger opacity-0 group-hover:opacity-100 !px-2 !py-1"
              >
                Eliminar
              </button>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Práctica {idx + 1}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TF label="Contenido" value={p.contenido} onChange={v => updatePractica(idx, { ...p, contenido: v })} placeholder="Contenido relacionado" />
                <TF label="Nombre de la práctica" value={p.nombre} onChange={v => updatePractica(idx, { ...p, nombre: v })} placeholder="Práctica 1: ..." />
              </div>
              <TA label="Objetivo" value={p.objetivo} onChange={v => updatePractica(idx, { ...p, objetivo: v })} placeholder="El alumno aplicará..." rows={2} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TF label="Evaluación" value={p.evaluacion} onChange={v => updatePractica(idx, { ...p, evaluacion: v })} placeholder="Rúbrica, lista de cotejo..." />
                <TF label="Recursos / Fecha" value={p.recursos} onChange={v => updatePractica(idx, { ...p, recursos: v })} placeholder="Computadora, semana 5" />
              </div>
            </div>
          ))}
          <button onClick={addPractica} className="btn-secondary w-full gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar práctica
          </button>
        </div>
      </Section>
    </div>
  )
}
