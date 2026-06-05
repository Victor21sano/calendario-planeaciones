export default function BrandMark({ className = 'w-10 h-10', compact = false }) {
  return (
    <div
      className={`${className} relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-academic-500 text-white shadow-lg shadow-brand-700/20`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 40" className="h-[78%] w-[78%]" fill="none">
        <path
          d="M12 8.5h11.2L29 14.2V31a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V10.5a2 2 0 0 1 2-2Z"
          fill="white"
          fillOpacity="0.96"
        />
        <path d="M23 8.5v5.7h6" fill="#DDF7F2" />
        <path d="M14.5 18.4h10.8M14.5 22.4h7.2" stroke="#0F4C5C" strokeWidth="1.8" strokeLinecap="round" />
        <rect x="14" y="26" width="12" height="4.2" rx="1.6" fill="#F5B84B" />
        <path d="m17 28.1 1.5 1.4 3.3-3.4" stroke="#0B3A46" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {!compact && (
        <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-warning-300 ring-2 ring-white dark:ring-slate-950" />
      )}
    </div>
  )
}
