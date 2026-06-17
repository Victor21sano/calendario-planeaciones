import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import BrandLogo from '../components/brand/BrandLogo'
import MenuUsuario from '../components/dashboard/MenuUsuario'
import { useEstimuloState } from './estimulo/useEstimuloState'
import { sections, scoreRubric } from './estimulo/data'
import StatusBar from './estimulo/components/StatusBar'
import FechasPanel from './estimulo/components/FechasPanel'
import ScorePanel from './estimulo/components/ScorePanel'
import ReqCard from './estimulo/components/ReqCard'
import ConfirmResetModal from './estimulo/components/ConfirmResetModal'

function matchesFilter(item, filter, checks) {
  if (filter === 'pending')  return !checks[item.id]
  if (filter === 'done')     return !!checks[item.id]
  if (filter === 'required') return (item.tagType || '').includes('required')
  if (filter === 'score')    return (item.tagType || '').includes('score')
  return true
}

function matchesSearch(item, section, search) {
  if (!search.trim()) return true
  const text = [
    section.title, section.desc, item.title, item.deadline, item.desc,
    item.tags?.join(' '),
    scoreRubric[item.id]?.subfactor,
    scoreRubric[item.id]?.options.map(o => o[1]).join(' '),
    item.callout, item.detail?.join(' ')
  ].filter(Boolean).join(' ').toLowerCase()
  return text.includes(search.trim().toLowerCase())
}

const FILTERS = [
  { key: 'all',      label: 'Todos' },
  { key: 'pending',  label: 'Pendientes' },
  { key: 'done',     label: 'Completos' },
  { key: 'required', label: 'Obligatorios' },
  { key: 'score',    label: 'Puntuables' },
]

export default function EstimuloDocentePage() {
  const { user, logout, esAdmin, perfilDocente } = useAuth()
  const inicialAvatar = (perfilDocente?.nombre || user?.displayName || user?.email || '?')
    .trim().charAt(0).toUpperCase()

  const {
    checks, scores, notes, filter, search,
    setFilter, setSearch,
    toggleCheck, setScore, setNotes,
    markSection, resetAll,
    showConfirmReset, confirmReset, cancelReset,
    totalProgress, scoreResult, exportCsv,
  } = useEstimuloState()

  const hasVisibleItems = sections.some(section =>
    section.items.some(item => matchesFilter(item, filter, checks) && matchesSearch(item, section, search))
  )

  return (
    <div className="estimulo-page min-h-screen surface-atmosphere flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-brand-100/60 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <BrandLogo className="flex-shrink-0" markClassName="w-8 h-8" />
          <MenuUsuario inicial={inicialAvatar} esAdmin={esAdmin} onLogout={logout} />
        </div>
      </header>

      {/* StatusBar */}
      <StatusBar
        totalProgress={totalProgress}
        scoreResult={scoreResult}
        onPrint={() => window.print()}
        onExport={exportCsv}
        onReset={resetAll}
      />

      {/* Hero */}
      <div className="bg-gradient-to-r from-brand-800 to-brand-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80 mb-2">
              CONALEP Guanajuato · Semestre 2-2526
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
              Asistente Estímulo Docente
            </h1>
            <p className="mt-2 text-sm opacity-90 max-w-xl leading-relaxed">
              Checklist para revisar requisitos del Estímulo al Desempeño Docente 2-2526 sin confundir fechas con tareas.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-sm px-5 py-3 text-center sm:text-right">
            <p className="text-3xl font-black tabular-nums" aria-live="polite">{totalProgress.pct}%</p>
            <p className="text-xs opacity-80 mt-0.5">
              {totalProgress.done === 0
                ? 'Sin requisitos marcados'
                : totalProgress.done === totalProgress.total
                  ? 'Checklist completo'
                  : `${totalProgress.done} requisitos listos`}
            </p>
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-5 items-start">

          {/* Aside */}
          <div className="md:sticky md:top-28">
            <FechasPanel />
          </div>

          {/* Content */}
          <div className="space-y-4 min-w-0">

            <ScorePanel scoreResult={scoreResult} />

            {/* Búsqueda */}
            <div className="card p-4">
              <label htmlFor="estimulo-search" className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1.5">
                Buscar requisito
              </label>
              <input
                id="estimulo-search"
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Ejemplo: RFC, CURP, Anexo, cursos, planeación..."
                autoComplete="off"
                className="input-base text-sm"
              />
            </div>

            {/* Filtros */}
            <div role="toolbar" aria-label="Filtros del checklist" className="flex flex-wrap gap-2">
              {FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  aria-pressed={filter === key}
                  className={`h-8 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                    filter === key
                      ? 'bg-brand-600 text-white border-brand-600 dark:bg-brand-500 dark:border-brand-500'
                      : 'btn-secondary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Secciones */}
            {sections.map(section => {
              const visibleItems = section.items.filter(
                item => matchesFilter(item, filter, checks) && matchesSearch(item, section, search)
              )
              if (visibleItems.length === 0) return null
              const doneInSection = section.items.filter(item => checks[item.id]).length

              return (
                <section
                  key={section.id}
                  id={section.id}
                  aria-labelledby={`${section.id}-title`}
                  className="card overflow-hidden scroll-mt-32"
                >
                  <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 id={`${section.id}-title`} className="font-display text-base font-semibold text-slate-900 dark:text-white">
                          {section.title}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-prose">{section.desc}</p>
                      </div>
                      <span className="shrink-0 inline-flex items-center h-6 px-2.5 rounded-full text-xs font-bold bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300">
                        {doneInSection} / {section.items.length}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button type="button" onClick={() => markSection(section.id, true)}  className="btn-secondary text-xs h-7 px-3">Marcar sección</button>
                      <button type="button" onClick={() => markSection(section.id, false)} className="btn-secondary text-xs h-7 px-3">Desmarcar sección</button>
                    </div>
                  </div>
                  <div>
                    {visibleItems.map(item => (
                      <ReqCard
                        key={item.id}
                        item={item}
                        done={!!checks[item.id]}
                        scoreValue={scores[item.id] || ''}
                        onToggle={toggleCheck}
                        onScoreChange={setScore}
                      />
                    ))}
                  </div>
                </section>
              )
            })}

            {/* Empty state */}
            {!hasVisibleItems && (
              <div className="card p-10 text-center text-slate-400 dark:text-slate-500 text-sm">
                No hay requisitos que coincidan con tu búsqueda o filtro.
              </div>
            )}

            {/* Notas personales */}
            <div className="card p-5 space-y-2">
              <label htmlFor="estimulo-notes" className="font-display text-base font-semibold text-slate-900 dark:text-white block">Notas personales</label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Este espacio también se guarda automáticamente en este navegador.
              </p>
              <textarea
                id="estimulo-notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ejemplo: pedir constancia de curso, escanear Anexo II, revisar RFC vigente..."
                className="input-base text-sm min-h-[100px] resize-y"
              />
            </div>

            {/* Back */}
            <div className="pb-4">
              <Link to="/" className="text-sm text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-300 transition-colors">
                ← Volver al dashboard
              </Link>
            </div>

          </div>
        </div>
      </main>

      {showConfirmReset && <ConfirmResetModal onConfirm={confirmReset} onCancel={cancelReset} />}
    </div>
  )
}
