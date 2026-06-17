export default function BrandMark({ className = 'w-10 h-10', compact = false }) {
  return (
    <div
      className={`${className} relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-b from-academic-500 to-brand-700 text-white shadow-lg shadow-brand-700/30`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 40" className="h-[78%] w-[78%]" fill="none">
        {/* Documento */}
        <path
          d="M12 8.5h11.2L29 14.2V31a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V10.5a2 2 0 0 1 2-2Z"
          fill="white"
          fillOpacity="0.96"
        />
        {/* Doblez esquina */}
        <path d="M23 8.5v5.7h6" fill="#CEEEE7" />
        {/* Línea 1 — verde marca */}
        <path d="M13.5 15.5h8.5" stroke="#15785B" strokeWidth="1.9" strokeLinecap="round" />
        {/* Línea 2 — gris claro, completa */}
        <path d="M13.5 19.2h13" stroke="#C8D8D3" strokeWidth="1.9" strokeLinecap="round" />
        {/* Línea 3 — gris claro, 88% */}
        <path d="M13.5 22.9h11.5" stroke="#C8D8D3" strokeWidth="1.9" strokeLinecap="round" />
        {/* Línea 4 — ámbar, 55% */}
        <path d="M13.5 26.6h7" stroke="#E8A23C" strokeWidth="1.9" strokeLinecap="round" />
      </svg>
      {!compact && (
        <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-warning-300 ring-2 ring-white dark:ring-slate-950" />
      )}
    </div>
  )
}
