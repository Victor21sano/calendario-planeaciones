import { useState } from 'react'
import CampoNumero   from './campos/CampoNumero'
import CampoSelect   from './campos/CampoSelect'
import CampoTextArea from './campos/CampoTextArea'
import CampoFecha    from './campos/CampoFecha'
import EditorMomento from './EditorMomento'
import { MODALIDADES } from '../../modelos/2023/constantes.js'

const opcionesModalidad = MODALIDADES.map(m => ({ valor: m, etiqueta: m }))

export default function EditorActividad({ actividad, indice, total, onCambio, onEliminar, onDuplicar }) {
  const [expandida, setExpandida] = useState(indice === 0)

  const set = (campo, valor) => onCambio({ ...actividad, [campo]: valor })
  const setMomento = (tipo, m) => onCambio({ ...actividad, momentos: { ...actividad.momentos, [tipo]: m } })

  const sumaMomentos =
    (actividad.momentos?.inicio?.tiempoHoras     || 0) +
    (actividad.momentos?.desarrollo?.tiempoHoras || 0) +
    (actividad.momentos?.cierre?.tiempoHoras     || 0)
  const cuadran = Math.abs(sumaMomentos - (actividad.duracionHoras || 0)) < 0.01

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header acordeón */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50
                   cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        onClick={() => setExpandida(e => !e)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex-shrink-0">
            Actividad {actividad.numero} / {total}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {actividad.duracionHoras}h · {actividad.modalidad}
          </span>
          {!cuadran && (
            <span className="text-xs text-danger-600 dark:text-danger-400 font-medium flex-shrink-0">
              ⚠ {sumaMomentos}h ≠ {actividad.duracionHoras}h
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {onDuplicar && (
            <button
              onClick={e => { e.stopPropagation(); onDuplicar(indice) }}
              title="Duplicar actividad"
              className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 transition"
            >
              <svg className="w-4 h-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          )}
          {onEliminar && total > 1 && (
            <button
              onClick={e => {
                e.stopPropagation()
                if (window.confirm('¿Eliminar esta actividad?')) onEliminar(indice)
              }}
              title="Eliminar actividad"
              className="p-1.5 rounded hover:bg-danger-100 dark:hover:bg-danger-900/30 transition"
            >
              <svg className="w-4 h-4 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${expandida ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expandida && (
        <div className="p-4 space-y-4">
          <CampoTextArea
            etiqueta="Propósito del Aprendizaje"
            valor={actividad.propositoAprendizaje}
            onCambio={v => set('propositoAprendizaje', v)}
            requerido
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CampoNumero
              etiqueta="Duración total"
              valor={actividad.duracionHoras}
              onCambio={v => set('duracionHoras', v)}
              min={1} sufijo="hrs" requerido
            />
            <CampoSelect
              etiqueta="Modalidad"
              valor={actividad.modalidad}
              onCambio={v => set('modalidad', v)}
              opciones={opcionesModalidad} requerido
            />
          </div>

          <CampoTextArea
            etiqueta="Contenido Específico"
            valor={actividad.contenidoEspecifico}
            onCambio={v => set('contenidoEspecifico', v)}
            ayuda="Usa incisos (A., B., C.) separados por nueva línea"
            requerido
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CampoFecha
              etiqueta="Fecha Inicio"
              valor={actividad.fechaInicio}
              onCambio={v => set('fechaInicio', v)}
              requerido
            />
            <CampoFecha
              etiqueta="Fecha Fin"
              valor={actividad.fechaFin}
              onCambio={v => set('fechaFin', v)}
              requerido
            />
          </div>

          <EditorMomento tipo="inicio"     momento={actividad.momentos?.inicio}     onCambio={m => setMomento('inicio', m)} />
          <EditorMomento tipo="desarrollo" momento={actividad.momentos?.desarrollo} onCambio={m => setMomento('desarrollo', m)} />
          <EditorMomento tipo="cierre"     momento={actividad.momentos?.cierre}     onCambio={m => setMomento('cierre', m)} />
        </div>
      )}
    </div>
  )
}
