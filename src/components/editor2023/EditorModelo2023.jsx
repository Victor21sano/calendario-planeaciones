import { useState, useCallback, useMemo } from 'react'
import EditorCabecera      from './EditorCabecera'
import EditorRA            from './EditorRA'
import IndicadorGuardado   from './IndicadorGuardado'
import BarraAdvertencias   from './BarraAdvertencias'
import { useAutoGuardado } from './hooks/useAutoGuardado'
import { validarPlaneacionCompleta2023, calcularFechas } from '../../modelos/2023/index.js'
import { actualizarMateriaConPlaneacion2023 }            from '../../services/materias'
import { useAuth }                                        from '../../contexts/AuthContext'

/**
 * Editor completo de una planeación Modelo 2023.
 * Props:
 *   planeacion          — objeto planeacion2023 (leído de Firestore)
 *   materiaId           — para guardar cambios en Firestore
 *   pdfPE / pdfGPE     — archivos File en memoria (pueden ser null si no están disponibles)
 *   onCambioPlaneacion  — callback para sincronizar con el estado del padre
 */
export default function EditorModelo2023({ planeacion: planeacionInicial, materiaId, pdfPE = null, pdfGPE = null, onCambioPlaneacion }) {
  const { user } = useAuth()
  const [planeacion, setPlaneacion] = useState(planeacionInicial)

  // Auto-guardado debounced
  const guardar = useCallback(async datos => {
    await actualizarMateriaConPlaneacion2023(user.uid, materiaId, datos)
    onCambioPlaneacion?.(datos)
  }, [user.uid, materiaId, onCambioPlaneacion])

  const { estado, ultimoGuardado, forzarGuardado } = useAutoGuardado(planeacion, guardar, 1500)

  // Validación reactiva (muestra advertencias pero no bloquea edición)
  const { errores } = useMemo(() => validarPlaneacionCompleta2023(planeacion), [planeacion])

  const actualizarCabecera = nueva =>
    setPlaneacion(p => ({ ...p, cabecera: nueva }))

  const actualizarRA = (uIdx, rIdx, nuevoRA) =>
    setPlaneacion(p => {
      const us = JSON.parse(JSON.stringify(p.unidades))
      us[uIdx].ras[rIdx] = nuevoRA
      return { ...p, unidades: us }
    })

  const recalcularFechas = () => {
    try {
      const nueva = calcularFechas(planeacion)
      setPlaneacion(nueva)
    } catch (err) {
      console.error('[EditorModelo2023] Error al recalcular fechas:', err)
    }
  }

  if (!planeacion) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        No hay planeación para editar.
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">

      <BarraAdvertencias errores={errores} />

      {/* Header del editor */}
      <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Editor de planeación</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Modelo 2023 · Los cambios se guardan automáticamente
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={recalcularFechas}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600
                       hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Recalcular fechas
          </button>
          <button
            onClick={forzarGuardado}
            className="text-xs px-3 py-1.5 rounded-lg border border-info-300 dark:border-info-700
                       text-info-700 dark:text-info-300 hover:bg-info-50 dark:hover:bg-info-900/20 transition-colors"
          >
            Guardar ahora
          </button>
          <IndicadorGuardado estado={estado} ultimoGuardado={ultimoGuardado} />
        </div>
      </div>

      {/* Cabecera */}
      <EditorCabecera
        cabecera={planeacion.cabecera}
        onCambio={actualizarCabecera}
      />

      {/* Unidades → RAs */}
      {(planeacion.unidades || []).map((unidad, uIdx) => (
        <section key={uIdx} className="space-y-3">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 px-1">
            Unidad {unidad.numero} · {unidad.nombre}
          </h2>
          {(unidad.ras || []).map((ra, rIdx) => (
            <EditorRA
              key={ra.codigo || rIdx}
              ra={ra}
              cabecera={planeacion.cabecera}
              pdfPE={pdfPE}
              pdfGPE={pdfGPE}
              onCambio={nuevo => actualizarRA(uIdx, rIdx, nuevo)}
            />
          ))}
        </section>
      ))}
    </div>
  )
}
