import { useState } from 'react'
import CampoTexto    from './campos/CampoTexto'
import CampoNumero   from './campos/CampoNumero'
import CampoFecha    from './campos/CampoFecha'

const TERMINOLOGIA_DEFAULT = { modelo: '2023' }

export default function EditorCabecera({ cabecera, onCambio, terminologia = TERMINOLOGIA_DEFAULT }) {
  const [expandida, setExpandida] = useState(false)
  const es2025      = terminologia?.modelo === '2025'
  const palabraCont = es2025 ? 'Asignatura' : 'Módulo'
  const etqCompet   = es2025 ? 'Meta educativa' : 'Competencia del módulo'

  const setDocente   = (campo, v) => onCambio({ ...cabecera, docente:   { ...cabecera.docente,   [campo]: v } })
  const setModulo    = (campo, v) => onCambio({ ...cabecera, modulo:    { ...cabecera.modulo,    [campo]: v } })
  const setCalendario = (campo, v) => onCambio({ ...cabecera, calendario: { ...cabecera.calendario, [campo]: v } })
  const setGrupo     = (campo, v) => onCambio({ ...cabecera, grupo:     { ...cabecera.grupo,     [campo]: v } })

  return (
    <section className="card overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer
                   hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
        onClick={() => setExpandida(e => !e)}
      >
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Cabecera — Docente y {palabraCont}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {cabecera.modulo?.nombre || '—'} · {cabecera.docente?.nombre || '—'}
          </p>
        </div>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandida ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {expandida && (
        <div className="px-5 pb-5 space-y-5">
          {/* Docente */}
          <fieldset className="space-y-3 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <legend className="px-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Docente</legend>
            <CampoTexto etiqueta="Nombre completo"   valor={cabecera.docente?.nombre}      onCambio={v => setDocente('nombre', v)} requerido />
            <CampoTexto etiqueta="Número de empleado" valor={cabecera.docente?.numEmpleado} onCambio={v => setDocente('numEmpleado', v)} requerido />
            <CampoTexto etiqueta="Plantel"            valor={cabecera.docente?.plantel}     onCambio={v => setDocente('plantel', v)} requerido />
          </fieldset>

          {/* Módulo / Asignatura */}
          <fieldset className="space-y-3 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <legend className="px-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">{palabraCont}</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <CampoTexto etiqueta="Siglema" valor={cabecera.modulo?.siglema} onCambio={v => setModulo('siglema', v)} />
              <CampoTexto etiqueta="Nombre" valor={cabecera.modulo?.nombre} onCambio={v => setModulo('nombre', v)} requerido />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <CampoNumero etiqueta="Semestre"     valor={cabecera.modulo?.semestre}     onCambio={v => setModulo('semestre', v)} min={1} max={6} />
              <CampoNumero etiqueta="Hrs/semana"   valor={cabecera.modulo?.horasSemana}  onCambio={v => setModulo('horasSemana', v)} min={1} sufijo="hrs" />
              <CampoNumero etiqueta="Hrs totales"  valor={cabecera.modulo?.horasTotales} onCambio={v => setModulo('horasTotales', v)} min={1} sufijo="hrs" />
            </div>
            <CampoTexto
              etiqueta="Tipo de currículum (solo lectura)"
              valor={cabecera.modulo?.tipoCurriculum}
              onCambio={() => {}}
              readonly
              ayuda="El tipo se extrajo automáticamente del PE. Para cambiarlo, regenera la planeación."
            />
            <CampoTexto etiqueta={etqCompet} valor={cabecera.modulo?.competenciaModulo} onCambio={v => setModulo('competenciaModulo', v)} />
            {!es2025 && (
              <CampoTextArea
                etiqueta="Propósito del módulo"
                valor={cabecera.modulo?.proposito}
                onCambio={v => setModulo('proposito', v)}
              />
            )}
          </fieldset>

          {/* Grupo y Calendario */}
          <fieldset className="space-y-3 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <legend className="px-2 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Grupo y Calendario</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <CampoTexto etiqueta="Número de grupo" valor={cabecera.grupo?.numero} onCambio={v => setGrupo('numero', v)} />
              <CampoTexto etiqueta="Turno (opcional)" valor={cabecera.grupo?.turno} onCambio={v => setGrupo('turno', v)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <CampoFecha etiqueta="Inicio de semestre" valor={cabecera.calendario?.fechaInicioSemestre} onCambio={v => setCalendario('fechaInicioSemestre', v)} requerido />
              <CampoFecha etiqueta="Fin de semestre"    valor={cabecera.calendario?.fechaFinSemestre}    onCambio={v => setCalendario('fechaFinSemestre', v)} requerido />
            </div>
          </fieldset>
        </div>
      )}
    </section>
  )
}

// CampoTextArea local para el propósito (no quiero importar otro archivo más)
function CampoTextArea({ etiqueta, valor, onCambio }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{etiqueta}</span>
      <textarea
        value={valor || ''}
        onChange={e => onCambio(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600
          bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100
          focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-y"
      />
    </label>
  )
}
