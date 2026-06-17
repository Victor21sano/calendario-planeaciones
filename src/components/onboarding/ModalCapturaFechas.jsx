import { useState, useEffect } from 'react'
import { CICLOS_ESCOLARES, CICLO_PERSONALIZADO, obtenerCicloPorId } from '../../data/ciclosEscolares'

const CICLO_DEFAULT = CICLOS_ESCOLARES[0]?.id || 'personalizado'

/**
 * Modal de captura rápida de fechas del semestre.
 * Incluye selector de ciclo escolar preestablecido para autocompletar.
 */
export default function ModalCapturaFechas({ abierto, fechaInicioActual = '', fechaFinActual = '', onGuardar, onCerrar, guardando = false }) {

  const [cicloId,     setCicloId]     = useState(CICLO_DEFAULT)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin,    setFechaFin]    = useState('')
  const [periodos,    setPeriodos]    = useState([])
  const [error,       setError]       = useState('')

  // Al abrir el modal: si no hay fechas existentes, usar el primer ciclo
  useEffect(() => {
    if (!abierto) return
    setError('')
    if (fechaInicioActual && fechaFinActual) {
      // Ya tiene fechas → modo personalizado
      setCicloId('personalizado')
      setFechaInicio(fechaInicioActual)
      setFechaFin(fechaFinActual)
      setPeriodos([])
    } else {
      // Sin fechas → precargar el ciclo default
      aplicarCiclo(CICLO_DEFAULT)
    }
  }, [abierto]) // eslint-disable-line

  function aplicarCiclo(id) {
    setCicloId(id)
    if (id === 'personalizado') return
    const ciclo = obtenerCicloPorId(id)
    if (!ciclo) return
    setFechaInicio(ciclo.fechaInicio)
    setFechaFin(ciclo.fechaFin)
    // CalendarioForm espera { nombre, fechaInicio, fechaFin }
    setPeriodos(ciclo.periodosVacacionales.map((p, i) => ({
      id:          `ciclo_${Date.now()}_${i}`,
      nombre:      p.nombre || '',
      fechaInicio: p.inicio || '',
      fechaFin:    p.fin    || '',
    })))
  }

  if (!abierto) return null

  function validar() {
    if (!fechaInicio || !fechaFin) { setError('Ambas fechas son obligatorias.'); return false }
    if (fechaInicio >= fechaFin) { setError('La fecha de fin debe ser posterior a la de inicio.'); return false }
    const dias = (new Date(fechaFin + 'T12:00:00') - new Date(fechaInicio + 'T12:00:00')) / 86400000
    if (dias < 30)  { setError('El semestre debe durar al menos 30 días.'); return false }
    if (dias > 365) { setError('El semestre no puede durar más de un año.'); return false }
    return true
  }

  async function handleGuardar() {
    if (!validar()) return
    setError('')
    try {
      await onGuardar({ fechaInicio, fechaFin, periodosVacacionales: periodos })
    } catch (err) {
      setError(err.message || 'No se pudo guardar.')
    }
  }

  const inputCls = `mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600
    bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100
    focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500
    disabled:opacity-50 transition-colors`

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in overscroll-contain">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-scale-in">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Fechas del semestre</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Las horas semanales se calculan automáticamente a partir del calendario.
              </p>
            </div>
          </div>
          <button onClick={onCerrar} disabled={guardando} aria-label="Cerrar"
            className="icon-button p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50">
            <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Selector de ciclo */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Ciclo escolar
          </label>
          <select
            value={cicloId}
            onChange={e => aplicarCiclo(e.target.value)}
            disabled={guardando}
            className={inputCls}
          >
            {CICLOS_ESCOLARES.map(c => (
              <option key={c.id} value={c.id}>{c.nombre} · {c.descripcion}</option>
            ))}
            <option value="personalizado">Personalizado (capturar manualmente)</option>
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Selecciona un ciclo predefinido para autocompletar fechas y vacaciones.
          </p>
        </div>

        {/* Campos de fecha */}
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Inicio del semestre</span>
            <input type="date" value={fechaInicio} onChange={e => { setFechaInicio(e.target.value); setCicloId('personalizado') }}
              disabled={guardando} className={inputCls} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Fin del semestre</span>
            <input type="date" value={fechaFin} onChange={e => { setFechaFin(e.target.value); setCicloId('personalizado') }}
              disabled={guardando} className={inputCls} />
          </label>
        </div>

        {/* Resumen de vacaciones si hay periodos */}
        {periodos.length > 0 && (
          <div className="px-3 py-2 rounded-lg bg-warning-50 dark:bg-warning-950/30 border border-warning-200 dark:border-warning-900">
            <p className="text-xs font-semibold text-warning-800 dark:text-warning-200 mb-1">Períodos no laborables incluidos:</p>
            {periodos.map((p, i) => (
              <p key={i} className="text-xs text-warning-700 dark:text-warning-300">{p.nombre}: {p.fechaInicio} → {p.fechaFin}</p>
            ))}
          </div>
        )}

        {/* Error inline */}
        {error && (
          <div className="px-3 py-2 rounded-lg bg-danger-50 dark:bg-danger-950/40 border border-danger-200 dark:border-danger-900 animate-slide-down">
            <p className="text-xs text-danger-700 dark:text-danger-300">{error}</p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-end gap-2 pt-1">
          <button onClick={onCerrar} disabled={guardando}
            className="pressable px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300
              hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={guardando}
            className="btn-accent text-sm py-2 disabled:opacity-50 gap-2">
            {guardando ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"/>
                </svg>
                Guardando…
              </>
            ) : 'Guardar y continuar'}
          </button>
        </div>
      </div>
    </div>
  )
}
