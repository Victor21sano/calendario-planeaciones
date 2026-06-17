export default function BrandMark({ className = 'w-10 h-10', compact = false }) {
  return (
    <div
      className={`${className} relative inline-flex items-center justify-center rounded-[26%] bg-gradient-to-br from-academic-500 to-brand-700 text-white shadow-lg shadow-brand-700/30`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 120 120" className="h-[78%] w-[78%]" fill="none">
        {/* Documento */}
        <rect x="34" y="24" width="52" height="72" rx="11" fill="white" fillOpacity="0.96" />
        {/* Línea verde — marca */}
        <rect x="44" y="36" width="22" height="5" rx="2.5" fill="#15785B" />
        {/* Líneas grises */}
        <rect x="44" y="48" width="32" height="5" rx="2.5" fill="#CBD8D1" />
        <rect x="44" y="60" width="32" height="5" rx="2.5" fill="#CBD8D1" />
        <rect x="44" y="78" width="20" height="5" rx="2.5" fill="#CBD8D1" />
        {/* Rayo / destello IA */}
        <path
          d="M70 30 L48 70 L62 70 L52 98 L86 56 L70 56 Z"
          fill="#E8865A"
          stroke="white"
          strokeWidth="4"
          strokeLinejoin="round"
        />
      </svg>
      {!compact && (
        <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-warning-400 ring-2 ring-white dark:ring-slate-950" />
      )}
    </div>
  )
}
