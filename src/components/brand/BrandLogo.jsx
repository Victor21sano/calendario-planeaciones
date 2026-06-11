import BrandMark from './BrandMark'

export default function BrandLogo({ className = '', markClassName = 'w-9 h-9', showTagline = false }) {
  return (
    <div className={`inline-flex items-center gap-3 min-w-0 ${className}`} translate="no">
      <BrandMark className={markClassName} />
      <div className="min-w-0">
        <p className="whitespace-nowrap font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
          Planea-Pro
        </p>
        {showTagline && (
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Planeación docente asistida
          </p>
        )}
      </div>
    </div>
  )
}
