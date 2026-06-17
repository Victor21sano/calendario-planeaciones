import { scoreRubric } from '../data'

const TAG_CLS = {
  Obligatorio:  'bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-300 dark:border-danger-800',
  Puntuable:    'bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-300 dark:border-info-800',
  Verificación: 'bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-300 dark:border-warning-800',
}

export default function ReqCard({ item, done, scoreValue, onToggle, onScoreChange }) {
  const rubric = scoreRubric[item.id]

  return (
    <article
      className={`grid grid-cols-[auto_1fr] gap-3 px-4 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors ${
        done ? 'bg-gradient-to-r from-brand-50/60 to-transparent dark:from-brand-900/10' : ''
      }`}
    >
      <div className="pt-7">
        <input
          type="checkbox"
          id={item.id}
          checked={done}
          onChange={() => onToggle(item.id)}
          aria-describedby={`${item.id}-desc`}
          className="w-5 h-5 cursor-pointer accent-brand-600"
        />
      </div>

      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">
          <span className="font-bold text-brand-700 dark:text-brand-300">Fecha / periodo:</span>{' '}{item.deadline}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-2">
          {(item.tags || []).map(tag => (
            <span key={tag} className={`inline-flex items-center h-6 px-2 rounded-full text-[11px] font-semibold border ${TAG_CLS[tag] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
              {tag}
            </span>
          ))}
        </div>

        <label htmlFor={item.id} className="block text-sm font-bold text-slate-800 dark:text-slate-100 cursor-pointer leading-snug mb-1">
          {item.title}
        </label>

        <p id={`${item.id}-desc`} className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {item.desc}
        </p>

        {item.callout && (
          <div className="mt-2 px-3 py-2 rounded-xl bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 text-xs text-warning-700 dark:text-warning-300">
            {item.callout}
          </div>
        )}

        {item.detail?.length > 0 && (
          <details className="mt-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 overflow-hidden">
            <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-brand-700 dark:text-brand-300">Ver detalles</summary>
            <ul className="px-4 pb-2.5 pt-1 text-xs text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
              {item.detail.map((point, i) => <li key={i}>{point}</li>)}
            </ul>
          </details>
        )}

        {rubric && (
          <div className="mt-3 p-3 rounded-xl border border-info-200 dark:border-info-800 bg-info-50 dark:bg-info-900/20 space-y-1.5">
            <label htmlFor={`${item.id}-score`} className="block text-xs font-bold text-info-700 dark:text-info-300">
              Puntaje: {rubric.subfactor}
            </label>
            <select
              id={`${item.id}-score`}
              value={scoreValue}
              onChange={e => onScoreChange(item.id, e.target.value)}
              className="w-full text-xs rounded-lg border border-info-200 dark:border-info-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-2 py-1.5 cursor-pointer"
            >
              {rubric.options.map(([value, label, points]) => (
                <option key={value} value={value}>
                  {label}{value ? ` · ${points} pts` : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Máximo: {rubric.max} puntos · Factor {rubric.factor}
            </p>
          </div>
        )}
      </div>
    </article>
  )
}
