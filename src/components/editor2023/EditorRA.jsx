import { useState } from 'react'
import EditorActividad  from './EditorActividad'
import BotonRegenerarRA from './BotonRegenerarRA'
import { actividadEspecificaVacia } from '../../modelos/2023/constantes.js'

export default function EditorRA({ ra, onCambio, cabecera, pdfPE, pdfGPE }) {
  const [expandido, setExpandido] = useState(true)

  const setActividad = (i, nueva) => {
    const arr = [...(ra.actividadesEspecificas || [])]
    arr[i] = nueva
    onCambio({ ...ra, actividadesEspecificas: arr })
  }

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
            RA {ra.codigo} · {ra.titulo}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {ra.duracionHoras}h · {ra.actividadesEspecificas?.length ?? 0} actividades
            {!cuadran && (
              <span className="ml-2 text-rose-600 dark:text-rose-400 font-medium">
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
          <div className="flex justify-end">
            <BotonRegenerarRA
              ra={ra}
              cabecera={cabecera}
              pdfPE={pdfPE}
              pdfGPE={pdfGPE}
              onRegenerado={reemplazar}
            />
          </div>

          {(ra.actividadesEspecificas || []).map((act, i) => (
            <EditorActividad
              key={i}
              actividad={act}
              indice={i}
              total={ra.actividadesEspecificas.length}
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
                       hover:border-violet-400 dark:hover:border-violet-600 hover:text-violet-600 dark:hover:text-violet-400 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar actividad
          </button>
        </div>
      )}
    </section>
  )
}
