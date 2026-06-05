function tiempoRelativo(fecha) {
  const diff = Date.now() - fecha.getTime()
  if (diff < 5000)    return 'ahora'
  if (diff < 60000)   return `hace ${Math.round(diff / 1000)}s`
  if (diff < 3600000) return `hace ${Math.round(diff / 60000)} min`
  return fecha.toLocaleTimeString()
}

// Iconos SVG inline — sin lucide
const IconCheck = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
)
const IconSpinner = () => (
  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z" />
  </svg>
)
const IconDot = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <circle cx="12" cy="12" r="8" strokeWidth={2} strokeDasharray="4 4" />
  </svg>
)
const IconAlert = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
  </svg>
)

const ESTADOS = {
  sincronizado: { Icono: IconCheck,   texto: 'Guardado',          color: 'text-success-600 dark:text-success-400' },
  guardando:    { Icono: IconSpinner, texto: 'Guardando…',        color: 'text-info-600 dark:text-info-400' },
  sin_guardar:  { Icono: IconDot,     texto: 'Sin guardar',       color: 'text-warning-600 dark:text-warning-400' },
  error:        { Icono: IconAlert,   texto: 'Error al guardar',  color: 'text-danger-600 dark:text-danger-400' },
}

export default function IndicadorGuardado({ estado, ultimoGuardado }) {
  const cfg = ESTADOS[estado] || ESTADOS.sincronizado
  const texto = estado === 'sincronizado' && ultimoGuardado
    ? `Guardado · ${tiempoRelativo(ultimoGuardado)}`
    : cfg.texto

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`} aria-live="polite">
      <span aria-hidden="true">
        <cfg.Icono />
      </span>
      <span className="text-slate-600 dark:text-slate-400">{texto}</span>
    </div>
  )
}
