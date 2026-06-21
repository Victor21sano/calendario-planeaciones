import { useState } from 'react'
import EditorActividad  from './EditorActividad'
import BotonRegenerarRA from './BotonRegenerarRA'
import CampoTexto       from './campos/CampoTexto'
import CampoTextArea    from './campos/CampoTextArea'
import { actividadEspecificaVacia } from '../../modelos/2023/constantes.js'

const TERMINOLOGIA_DEFAULT = { raCorto: 'RA', actividad: 'Propósito' }

export default function EditorRA({ ra, onCambio, cabecera, pdfPE, pdfGPE, terminologia = TERMINOLOGIA_DEFAULT, modelo = '2023', materiaId }) {
  const t = { ...TERMINOLOGIA_DEFAULT, ...terminologia }
  const [expandido, setExpandido] = useState(true)
  const actividadLabel = t.actividad.toLowerCase()
  const sinSesiones = (ra.actividadesEspecificas?.length || 0) === 0

  const setActividad = (i, nueva) => {
    const arr = [...(ra.actividadesEspecificas || [])]
    arr[i] = nueva
    onCambio({ ...ra, actividadesEspecificas: arr })
  }

  const setEvalCampo = (campo, v) =>
    onCambio({ ...ra, actividadEvaluacion: { ...(ra.actividadEvaluacion || {}), [campo]: v } })

  const agregarActividad = () => {
    const num = (ra.actividadesEspecificas?.length || 0) + 1
    onCambio({
      ...ra,
      actividadesEspecificas: [...(ra.actividadesEspecificas || []), actividadEspecificaVacia(num)],
    })
  }

  const eliminarActividad = i => {
    const nuevas = (ra.actividadesEspecificas || [])
      .filter((_, idx) => idx !== i)
      .map((a, idx) => ({ ...a, numero: idx + 1 }))
    onCambio({ ...ra, actividadesEspecificas: nuevas })
  }

  const duplicarActividad = i => {
    const arr  = ra.actividadesEspecificas || []
    const copia = JSON.parse(JSON.stringify(arr[i]))
    copia.numero = arr.length + 1
    onCambio({ ...ra, actividadesEspecificas: [...arr, copia] })
  }

  const reemplazar = nuevas => onCambio({ ...ra, actividadesEspecificas: Array.isArray(nuevas) ? nuevas : [] })

  const sumaHoras = (ra.actividadesEspecificas || []).reduce((s, a) => s + (a.duracionHoras || 0), 0)
  const cuadran   = Math.abs(sumaHoras - (ra.duracionHoras || 0)) < 0.01

  return (
    <section className="card overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer
                   hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
        onClick={() => setExpandido(e => !e)}
      >
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">
            {t.raCorto} {ra.codigo} · {ra.titulo}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {ra.duracionHoras}h · {ra.actividadesEspecificas?.length ?? 0} {actividadLabel}s
            {sinSesiones && (
              <span className="ml-2 text-warning-600 dark:text-warning-400 font-medium">· ⚠ sin generar</span>
            )}
            {!sinSesiones && !cuadran && (
              <span className="ml-2 text-danger-600 dark:text-danger-400 font-medium">
                · ⚠ {ra.duracionHoras - sumaHoras}h sin distribuir
              </span>
            )}
          </p>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${expandido ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {expandido && (
        <div className="px-5 pb-5 space-y-3">
          {/* Actividad de Evaluación (editable) */}
          <fieldset className="space-y-2 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
            <legend className="px-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Actividad de Evaluación
            </legend>
            <CampoTextArea
              etiqueta="Descripción"
              valor={ra.actividadEvaluacion?.descripcion}
              onCambio={v => setEvalCampo('descripcion', v)}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <CampoTexto etiqueta="Evidencia" valor={ra.actividadEvaluacion?.evidencia} onCambio={v => setEvalCampo('evidencia', v)} />
              <CampoTexto etiqueta="Código"    valor={ra.actividadEvaluacion?.codigo}    onCambio={v => setEvalCampo('codigo', v)} />
            </div>
          </fieldset>

          {sinSesiones ? (
            /* Fallo de generación: ofrecer regenerar solo este RA/PF */
            <div className="rounded-xl border border-warning-200 dark:border-warning-900 bg-warning-50 dark:bg-warning-950/30 p-3 space-y-2">
              <p className="text-xs text-warning-800 dark:text-warning-300">
                Este {t.raCorto} {ra.codigo} no tiene {actividadLabel}s generados. Puedes regenerarlas (gratis).
              </p>
              <BotonRegenerarRA
                ra={ra}
                cabecera={cabecera}
                pdfPE={pdfPE}
                pdfGPE={pdfGPE}
                onRegenerado={reemplazar}
                modelo={modelo}
                materiaId={materiaId}
                terminologia={t}
              />
            </div>
          ) : (
            <>
              {(ra.actividadesEspecificas || []).map((act, i) => (
                <EditorActividad
                  key={i}
                  actividad={act}
                  indice={i}
                  total={ra.actividadesEspecificas.length}
                  terminologia={t}
                  onCambio={nueva => setActividad(i, nueva)}
                  onEliminar={eliminarActividad}
                  onDuplicar={duplicarActividad}
                />
              ))}

              <button
                onClick={agregarActividad}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
                           border-2 border-dashed border-slate-300 dark:border-slate-600
                           text-sm font-medium text-slate-600 dark:text-slate-300
                           hover:border-info-400 dark:hover:border-info-600 hover:text-info-600 dark:hover:text-info-400 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar {actividadLabel}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  )
}
