/**
 * ModeloBadge
 * Indica a qué modelo académico pertenece la planeación (2023 o 2025).
 * Props:
 *   modelo — '2023' | '2025' (default '2023')
 *   size   — 'sm' (default) | 'md'
 */
export default function ModeloBadge({ modelo = '2023', size = 'sm' }) {
  const es2025 = String(modelo) === '2025'

  const sizeClass = size === 'md'
    ? 'px-2.5 py-1 text-xs'
    : 'px-2 py-0.5 text-[10px]'

  const colorClass = es2025
    ? 'bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300'
    : 'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300'

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold tracking-wide ${colorClass} ${sizeClass}`}
      title={`Modelo ${es2025 ? '2025' : '2023'}`}
    >
      {es2025 ? '2025' : '2023'}
    </span>
  )
}
