/**
 * MateriaTypeBadge
 * Distingue planeaciones generadas con IA de las manuales.
 * Props:
 *   pagada  — true = generada con IA | false = manual gratuita
 *   size    — 'sm' (default) | 'md'
 */
export default function MateriaTypeBadge({ pagada = true, size = 'sm' }) {
  const isIA = pagada !== false

  const sizeClass = size === 'md'
    ? 'px-2.5 py-1 text-xs gap-1.5'
    : 'px-2 py-0.5 text-[10px] gap-1'

  if (isIA) {
    return (
      <span
        className={`inline-flex items-center rounded-full font-semibold tracking-wide
          bg-info-100 dark:bg-info-900/40 text-info-700 dark:text-info-300
          ${sizeClass}`}
      >
        {/* Lightning bolt */}
        <svg
          className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
        </svg>
        IA
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold tracking-wide
        bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400
        ${sizeClass}`}
    >
      {/* Pencil */}
      <svg
        className={size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3'}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
      Manual
    </span>
  )
}
