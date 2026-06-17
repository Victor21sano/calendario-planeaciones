// Accessible, color-blind-safe unit palette
const UNIDAD_PALETTE = [
  {
    border:  'border-l-brand-400 dark:border-l-brand-500',
    badge:   'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-700/50',
    heading: 'text-brand-800 dark:text-brand-300',
    dot:     'bg-brand-400',
    add:     'text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20',
  },
  {
    border:  'border-l-info-400 dark:border-l-info-500',
    badge:   'bg-info-50 dark:bg-info-900/30 text-info-700 dark:text-info-300 border border-info-200 dark:border-info-700/50',
    heading: 'text-info-800 dark:text-info-300',
    dot:     'bg-info-400',
    add:     'text-info-600 dark:text-info-400 hover:bg-info-50 dark:hover:bg-info-900/20',
  },
  {
    border:  'border-l-success-400 dark:border-l-success-500',
    badge:   'bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-300 border border-success-200 dark:border-success-700/50',
    heading: 'text-success-800 dark:text-success-300',
    dot:     'bg-success-400',
    add:     'text-success-600 dark:text-success-400 hover:bg-success-50 dark:hover:bg-success-900/20',
  },
  {
    border:  'border-l-warning-400 dark:border-l-warning-500',
    badge:   'bg-warning-50 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 border border-warning-200 dark:border-warning-700/50',
    heading: 'text-warning-800 dark:text-warning-300',
    dot:     'bg-warning-400',
    add:     'text-warning-600 dark:text-warning-400 hover:bg-warning-50 dark:hover:bg-warning-900/20',
  },
  {
    border:  'border-l-danger-400 dark:border-l-danger-500',
    badge:   'bg-danger-50 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300 border border-danger-200 dark:border-danger-700/50',
    heading: 'text-danger-800 dark:text-danger-300',
    dot:     'bg-danger-400',
    add:     'text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20',
  },
  {
    border:  'border-l-accent-400 dark:border-l-accent-500',
    badge:   'bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 border border-accent-200 dark:border-accent-700/50',
    heading: 'text-accent-800 dark:text-accent-300',
    dot:     'bg-accent-400',
    add:     'text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20',
  },
]

// ─── Subunit Row ──────────────────────────────────────────────
function SubunidadRow({ sub, onChange, onDelete, total, palette }) {
  const pct = total > 0 && Number(sub.horas) > 0
    ? ((Number(sub.horas) / total) * 100).toFixed(0)
    : null

  return (
    <div className="group flex flex-col gap-2 py-2.5 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-150 sm:flex-row sm:items-center">
      {/* Nombre (ancho completo en móvil) */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${palette.dot} opacity-60`} />
        <input
          id={`sub-nombre-${sub.id}`}
          name={`sub-nombre-${sub.id}`}
          aria-label={`Nombre de la subunidad ${sub.id}`}
          className="input-base flex-1 py-2 text-sm"
          placeholder="Nombre de la subunidad"
          value={sub.nombre}
          onChange={e => onChange({ ...sub, nombre: e.target.value })}
        />
      </div>

      {/* Horas + % + borrar (fila propia en móvil, alineada bajo el nombre) */}
      <div className="flex items-center gap-2 pl-3.5 sm:pl-0">
        <div className="relative w-24 flex-shrink-0">
          <input
            id={`sub-horas-${sub.id}`}
            name={`sub-horas-${sub.id}`}
            aria-label={`Horas de la subunidad ${sub.id}`}
            type="number"
            className="input-base py-2 pr-9 text-center text-sm w-full"
            min="0.5"
            step="0.5"
            placeholder="0"
            value={sub.horas}
            onChange={e => onChange({ ...sub, horas: e.target.value })}
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 dark:text-slate-400 pointer-events-none">hrs</span>
        </div>

        <div className="w-10 text-right flex-shrink-0">
          {pct !== null ? (
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{pct}%</span>
          ) : (
            <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
          )}
        </div>

        {/* Borrar — siempre visible en móvil (touch no tiene hover) */}
        <button
          onClick={onDelete}
          title="Eliminar subunidad"
          className="flex-shrink-0 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-all duration-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ─── Unit Card ────────────────────────────────────────────────
function UnidadCard({ unidad, palette, onUpdate, onDelete, totalHoras }) {
  function addSub() {
    const id = `${unidad.id}.${unidad.subunidades.length + 1}`
    onUpdate({ ...unidad, subunidades: [...unidad.subunidades, { id, nombre: '', horas: '' }] })
  }
  function updateSub(subId, updated) {
    onUpdate({ ...unidad, subunidades: unidad.subunidades.map(s => s.id === subId ? updated : s) })
  }
  function deleteSub(subId) {
    onUpdate({ ...unidad, subunidades: unidad.subunidades.filter(s => s.id !== subId) })
  }

  const horasUnidad = unidad.subunidades.reduce((s, su) => s + (Number(su.horas) || 0), 0)

  return (
    <div className={`card border-l-4 ${palette.border} p-4 animate-scale-in`}>
      {/* Unit header */}
      <div className="flex items-center gap-2 mb-3">
        <input
          id={`unidad-nombre-${unidad.id}`}
          name={`unidad-nombre-${unidad.id}`}
          aria-label={`Nombre de la unidad ${unidad.id}`}
          className={`input-base flex-1 font-semibold text-sm ${palette.heading}`}
          placeholder="Nombre de la unidad"
          value={unidad.nombre}
          onChange={e => onUpdate({ ...unidad, nombre: e.target.value })}
        />
        {/* Hours badge */}
        <span className={`badge flex-shrink-0 ${palette.badge}`}>
          {horasUnidad > 0 ? `${horasUnidad}h` : '0h'}
        </span>
        {/* Delete unit button */}
        <button
          onClick={onDelete}
          title="Eliminar unidad"
          className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-all duration-200">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Subunits */}
      <div className="space-y-0.5 ml-1">
        {unidad.subunidades.length === 0 ? (
          <div className="flex items-center gap-2 py-2 px-2">
            <div className={`w-1.5 h-1.5 rounded-full ${palette.dot} opacity-40`} />
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">Sin subunidades — agrega al menos una.</p>
          </div>
        ) : (
          unidad.subunidades.map(sub => (
            <SubunidadRow
              key={sub.id}
              sub={sub}
              onChange={updated => updateSub(sub.id, updated)}
              onDelete={() => deleteSub(sub.id)}
              total={totalHoras}
              palette={palette}
            />
          ))
        )}
      </div>

      {/* Add subunit */}
      <button
        onClick={addSub}
        className={`mt-2 ml-1 inline-flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg transition-all duration-200 ${palette.add}`}>
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
        </svg>
        Agregar subunidad
      </button>
    </div>
  )
}

// ─── Main Form ────────────────────────────────────────────────
export default function EstructuraForm({ unidades, onChange }) {
  const totalHoras = unidades.flatMap(u => u.subunidades).reduce((s, su) => s + (Number(su.horas) || 0), 0)

  function addUnidad() {
    onChange([...unidades, { id: Date.now(), nombre: `Unidad ${unidades.length + 1}`, subunidades: [] }])
  }
  function updateUnidad(id, updated) {
    onChange(unidades.map(u => u.id === id ? updated : u))
  }
  function deleteUnidad(id) {
    onChange(unidades.filter(u => u.id !== id))
  }

  return (
    <div className="card p-5 sm:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-info-500 to-accent-600 rounded-xl flex items-center justify-center shadow-sm shadow-info-200 dark:shadow-info-900/40 flex-shrink-0">
            <span className="text-xs font-bold text-white">2</span>
          </div>
          <div>
            <h2 className="section-title leading-tight">Estructura del Programa</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Unidades y subunidades con horas asignadas</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {totalHoras > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Total: <strong className="text-slate-900 dark:text-white">{totalHoras}h</strong>
              </span>
            </div>
          )}
          <button onClick={addUnidad} className="btn-primary text-xs">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Agregar unidad
          </button>
        </div>
      </div>

      {/* Empty state */}
      {unidades.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
          <div className="w-16 h-16 bg-gradient-to-br from-info-100 to-accent-100 dark:from-info-900/30 dark:to-accent-900/30 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-info-400 dark:text-info-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Sin unidades todavía</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 text-center max-w-xs">
            Agrega las unidades del programa de tu materia con sus horas correspondientes.
          </p>
          <button onClick={addUnidad} className="btn-primary text-xs">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            Agregar primera unidad
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {unidades.map((u, i) => (
            <UnidadCard
              key={u.id}
              unidad={u}
              palette={UNIDAD_PALETTE[i % UNIDAD_PALETTE.length]}
              onUpdate={updated => updateUnidad(u.id, updated)}
              onDelete={() => deleteUnidad(u.id)}
              totalHoras={totalHoras}
            />
          ))}
        </div>
      )}
    </div>
  )
}
