import { useState, useCallback, useMemo } from 'react'
import EditorCabecera      from './EditorCabecera'
import EditorRA            from './EditorRA'
import IndicadorGuardado   from './IndicadorGuardado'
import BarraAdvertencias   from './BarraAdvertencias'
import { useAutoGuardado } from './hooks/useAutoGuardado'
import { validarPlaneacionCompleta2023 }                 from '../../modelos/2023/index.js'
import { actualizarMateriaConPlaneacion2023 }            from '../../services/materias'
import { aplicarFechasDesdeHorario }                     from '../../utils/fechasPlaneacion'
import { extraerUnidadesDesde2023 }                      from '../../pages/planificador/utils'
import { useAuth }                                        from '../../contexts/AuthContext'

/**
 * Editor completo de una planeación Modelo 2023.
 * Props:
 *   planeacion          — objeto planeacion2023 (leído de Firestore)
 *   materiaId           — para guardar cambios en Firestore
 *   pdfPE / pdfGPE     — archivos File en memoria (pueden ser null si no están disponibles)
 *   onCambioPlaneacion  — callback para sincronizar con el estado del padre
 */
const TERMINOLOGIA_DEFAULT = { modelo: '2023', unidad: 'Unidad', ra: 'Resultado de Aprendizaje', raCorto: 'RA' }

export default function EditorModelo2023({ planeacion: planeacionInicial, materiaId, pdfPE = null, pdfGPE = null, onCambioPlaneacion, onGuardar = null, terminologia = TERMINOLOGIA_DEFAULT }) {
  const { user } = useAuth()
  const t = { ...TERMINOLOGIA_DEFAULT, ...terminologia }
  const [planeacion, setPlaneacion] = useState(planeacionInicial)

  // Auto-guardado debounced. Si se pasa onGuardar (p.ej. Modelo 2025), se delega
  // la persistencia al padre; de lo contrario, se guarda como planeación 2023.
  const guardar = useCallback(async datos => {
    if (onGuardar) {
      await onGuardar(datos)
    } else {
      await actualizarMateriaConPlaneacion2023(user.uid, materiaId, datos)
      onCambioPlaneacion?.(datos)
    }
  }, [user.uid, materiaId, onCambioPlaneacion, onGuardar])

  const { estado, ultimoGuardado, forzarGuardado } = useAutoGuardado(planeacion, guardar, 1500)

  // Validación reactiva (muestra advertencias pero no bloquea edición).
  // En Modelo 2025 se localizan los mensajes del validador 2023 (RA→PF, actividad→sesión, Unidad→Ámbito).
  const { errores } = useMemo(() => {
    const res = validarPlaneacionCompleta2023(planeacion)
    if (t.modelo !== '2025') return res
    const localizar = msg => String(msg)
      .replace(/\bRA\b/g, t.raCorto || 'PF')
      .replace(/\bactividad\b/g, 'sesión')
      .replace(/\bUnidad\b/g, t.unidad || 'Ámbito')
    return { ...res, errores: (res.errores || []).map(localizar) }
  }, [planeacion, t.modelo, t.raCorto, t.unidad])

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
      const cal      = planeacion.cabecera?.calendario || {}
      const semestre = { fechaInicio: cal.fechaInicioSemestre, fechaFin: cal.fechaFinSemestre }
      const horasSemana = planeacion.cabecera?.modulo?.horasSemana
      const periodos = (cal.diasNoLaborables || []).map(d => ({ fechaInicio: d, fechaFin: d }))
      const unidadesPlan = extraerUnidadesDesde2023(planeacion)
      const clone = JSON.parse(JSON.stringify(planeacion))
      aplicarFechasDesdeHorario({
        semestre, horasSemana, periodosVacacionales: periodos,
        unidades: unidadesPlan, planeacion: clone, modelo: '2023',
      })
      setPlaneacion(clone)
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
            Modelo {t.modelo} · Los cambios se guardan automáticamente
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
        terminologia={t}
      />

      {/* Unidades → RAs */}
      {(planeacion.unidades || []).map((unidad, uIdx) => (
        <section key={uIdx} className="space-y-3">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 px-1">
            {t.unidad} {unidad.numero} · {unidad.nombre}
          </h2>
          {(unidad.ras || []).map((ra, rIdx) => (
            <EditorRA
              key={ra.codigo || rIdx}
              ra={ra}
              cabecera={planeacion.cabecera}
              pdfPE={pdfPE}
              pdfGPE={pdfGPE}
              terminologia={t}
              modelo={t.modelo}
              materiaId={materiaId}
              onCambio={nuevo => actualizarRA(uIdx, rIdx, nuevo)}
            />
          ))}
        </section>
      ))}
    </div>
  )
}
