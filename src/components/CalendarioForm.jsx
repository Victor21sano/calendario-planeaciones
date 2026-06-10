import { useState } from 'react'
import { calcularHorasSemanaAuto } from '../utils/calculos'

// ─── Vacation Period Card ─────────────────────────────────────
function PeriodoVacacional({ periodo, onChange, onDelete }) {
  return (
    <div className="group relative flex flex-wrap gap-3 items-end p-4 bg-warning-50 dark:bg-warning-900/10 rounded-xl border border-warning-200 dark:border-warning-800/40 animate-scale-in">
      {/* Left accent bar */}
      <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-warning-400 rounded-full" />

      <div className="flex-1 min-w-[140px]">
        <label htmlFor={`vac-nombre-${periodo.id}`} className="block text-xs font-semibold text-warning-700 dark:text-warning-400 mb-1.5">
          Nombre del período
        </label>
        <input
          id={`vac-nombre-${periodo.id}`}
          name={`vac-nombre-${periodo.id}`}
          className="input-base"
          placeholder="Ej. Semana Santa"
          value={periodo.nombre}
          onChange={e => onChange({ ...periodo, nombre: e.target.value })}
        />
      </div>

      <div className="flex-1 min-w-[140px]">
        <label htmlFor={`vac-inicio-${periodo.id}`} className="block text-xs font-semibold text-warning-700 dark:text-warning-400 mb-1.5 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          Inicio vacaciones
        </label>
        <input
          id={`vac-inicio-${periodo.id}`}
          type="date"
          className="input-base"
          value={periodo.fechaInicio}
          onChange={e => onChange({ ...periodo, fechaInicio: e.target.value })}
        />
      </div>

      <div className="flex-1 min-w-[140px]">
        <label htmlFor={`vac-fin-${periodo.id}`} className="block text-xs font-semibold text-warning-700 dark:text-warning-400 mb-1.5 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          Fin vacaciones
        </label>
        <input
          id={`vac-fin-${periodo.id}`}
          type="date"
          className="input-base"
          value={periodo.fechaFin}
          onChange={e => onChange({ ...periodo, fechaFin: e.target.value })}
        />
      </div>

      <button
        onClick={onDelete}
        title="Eliminar período"
        className="p-2 rounded-xl text-slate-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-all duration-200 self-end mb-0.5">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}

// ─── Main Form ────────────────────────────────────────────────
export default function CalendarioForm({
  semestre,
  horasSemana,
  periodosVacacionales,
  onChange,
  horasTotalesPrograma = 0,
  semanasHabilesCount  = 0,
  onHorasSemanaAuto,
}) {
  const autoCalc = calcularHorasSemanaAuto(Number(horasTotalesPrograma) || 0, semanasHabilesCount)
  const puedeAplicarAuto = autoCalc && !autoCalc.requiereManual && Number(horasSemana) !== autoCalc.rounded
  function updateSemestre(field, value) {
    onChange({ semestre: { ...semestre, [field]: value }, horasSemana, periodosVacacionales })
  }
  function updateHoras(value) {
    onChange({ semestre, horasSemana: value, periodosVacacionales })
  }
  function addPeriodo() {
    onChange({ semestre, horasSemana, periodosVacacionales: [...periodosVacacionales, { id: Date.now(), nombre: '', fechaInicio: '', fechaFin: '' }] })
  }
  function updatePeriodo(id, updated) {
    onChange({ semestre, horasSemana, periodosVacacionales: periodosVacacionales.map(p => p.id === id ? updated : p) })
  }
  function deletePeriodo(id) {
    onChange({ semestre, horasSemana, periodosVacacionales: periodosVacacionales.filter(p => p.id !== id) })
  }

  return (
    <div className="card p-5 sm:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-br from-brand-600 to-academic-600 rounded-xl flex items-center justify-center shadow-sm shadow-brand-200 dark:shadow-brand-900/40 flex-shrink-0">
          <span className="text-xs font-bold text-white">1</span>
        </div>
        <div>
          <h2 className="section-title leading-tight">Configuración del Semestre</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Fechas y horas por semana hábil</p>
        </div>
      </div>

      {/* Top accent line */}
      <div className="absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r from-brand-500 to-academic-500 rounded-full opacity-60" style={{top: 0}}/>

      {/* Date & Hours Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div>
          <label htmlFor="fecha-inicio-semestre" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
            <svg className="w-3 h-3 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            Inicio del semestre
          </label>
          <input
            id="fecha-inicio-semestre"
            type="date"
            className="input-base"
            value={semestre.fechaInicio}
            onChange={e => updateSemestre('fechaInicio', e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="fecha-fin-semestre" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
            <svg className="w-3 h-3 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            Fin del semestre
          </label>
          <input
            id="fecha-fin-semestre"
            type="date"
            className="input-base"
            value={semestre.fechaFin}
            onChange={e => updateSemestre('fechaFin', e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="horas-semana" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
            <svg className="w-3 h-3 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Horas por semana
          </label>
          <div className="relative">
            <input
              id="horas-semana"
              name="horas-semana"
              type="number"
              className="input-base pr-10"
              min="1"
              max="40"
              placeholder="Ej. 8"
              value={horasSemana}
              onChange={e => updateHoras(e.target.value)}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 dark:text-slate-400 pointer-events-none">hrs</span>
          </div>

          {/* Auto-calculo horas/semana (Parte C) */}
          {autoCalc && onHorasSemanaAuto && (
            autoCalc.requiereManual ? (
              <div className="mt-2 p-2.5 rounded-xl bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800/40">
                <p className="text-xs text-warning-800 dark:text-warning-300">
                  El cálculo da <strong>{autoCalc.exact.toFixed(2)} h/sem</strong>. Captura un número manualmente.
                </p>
              </div>
            ) : (
              <div className="mt-2 flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800/40">
                <div className="flex items-center gap-1.5 text-xs text-success-700 dark:text-success-300">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                  </svg>
                  <span><strong>{autoCalc.rounded} h/sem</strong> - 100 % de ocupación ({horasTotalesPrograma} h / {semanasHabilesCount} sem)</span>
                </div>
                {puedeAplicarAuto && (
                  <button
                    type="button"
                    onClick={() => onHorasSemanaAuto(autoCalc.rounded)}
                    className="btn-secondary text-xs py-0.5 px-2 flex-shrink-0"
                  >
                    Usar
                  </button>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* Vacation Periods */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Períodos vacacionales</label>
            {periodosVacacionales.length > 0 && (
              <span className="ml-2 badge bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400">
                {periodosVacacionales.length}
              </span>
            )}
          </div>
          <button onClick={addPeriodo} className="btn-ghost text-xs py-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Agregar período
          </button>
        </div>

        {periodosVacacionales.length === 0 ? (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="w-8 h-8 bg-warning-100 dark:bg-warning-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
              </svg>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Sin períodos vacacionales — todas las semanas son hábiles.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {periodosVacacionales.map(p => (
              <PeriodoVacacional
                key={p.id}
                periodo={p}
                onChange={updated => updatePeriodo(p.id, updated)}
                onDelete={() => deletePeriodo(p.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

