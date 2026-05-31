// Accessible, color-blind-safe unit palette
const UNIDAD_PALETTE = [
  {
    border:  'border-l-indigo-400 dark:border-l-indigo-500',
    badge:   'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700/50',
    heading: 'text-indigo-800 dark:text-indigo-300',
    dot:     'bg-indigo-400',
    add:     'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
  },
  {
    border:  'border-l-violet-400 dark:border-l-violet-500',
    badge:   'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700/50',
    heading: 'text-violet-800 dark:text-violet-300',
    dot:     'bg-violet-400',
    add:     'text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20',
  },
  {
    border:  'border-l-emerald-400 dark:border-l-emerald-500',
    badge:   'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50',
    heading: 'text-emerald-800 dark:text-emerald-300',
    dot:     'bg-emerald-400',
    add:     'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
  },
  {
    border:  'border-l-amber-400 dark:border-l-amber-500',
    badge:   'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50',
    heading: 'text-amber-800 dark:text-amber-300',
    dot:     'bg-amber-400',
    add:     'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20',
  },
  {
    border:  'border-l-rose-400 dark:border-l-rose-500',
    badge:   'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700/50',
    heading: 'text-rose-800 dark:text-rose-300',
    dot:     'bg-rose-400',
    add:     'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20',
  },
  {
    border:  'border-l-cyan-400 dark:border-l-cyan-500',
    badge:   'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700/50',
    heading: 'text-cyan-800 dark:text-cyan-300',
    dot:     'bg-cyan-400',
    add:     'text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20',
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
            type="number"
            className="input-base py-2 pr-9 text-center text-sm w-full"
            min="0.5"
            step="0.5"
            placeholder="0"
            value={sub.horas}
            onChange={e => onChange({ ...sub, horas: e.target.value })}
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 dark:text-slate-500 pointer-events-none">hrs</span>
        </div>

        <div className="w-10 text-right flex-shrink-0">
          {pct !== null ? (
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{pct}%</span>
          ) : (
            <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
          )}
        </div>

        {/* Borrar — siempre visible en móvil (touch no tiene hover) */}
        <button
          onClick={onDelete}
          title="Eliminar subunidad"
          className="flex-shrink-0 p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all duration-200 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
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
          className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all duration-200">
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
            <p className="text-xs text-slate-400 dark:text-slate-500 italic">Sin subunidades — agrega al menos una.</p>
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
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-sm shadow-violet-200 dark:shadow-violet-900/40 flex-shrink-0">
            <span className="text-xs font-bold text-white">2</span>
          </div>
          <div>
            <h2 className="section-title leading-tight">Estructura del Programa</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Unidades y subunidades con horas asignadas</p>
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
          <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-violet-400 dark:text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Sin unidades todavía</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-4 text-center max-w-xs">
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
