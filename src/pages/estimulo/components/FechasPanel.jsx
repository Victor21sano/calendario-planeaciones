import { sections } from '../data'

const FECHAS = [
  { label: 'Periodo evaluado',        desc: 'Semestre 2-2526, febrero a julio de 2026.' },
  { label: 'Asistencia',              desc: '03 de febrero al 19 de junio de 2026.' },
  { label: 'Inscripción y expediente',desc: '15 al 25 de junio de 2026.' },
  { label: 'Fecha límite final',       desc: '25 de junio de 2026.' },
  { label: 'Resultados',              desc: '03 de agosto de 2026.' },
  { label: 'Inconformidades',         desc: '03 y 04 de agosto de 2026.' },
]

const navLinkClass = 'block rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:text-brand-700 dark:hover:text-brand-300 transition-colors'

export default function FechasPanel() {
  return (
    <aside className="flex flex-col gap-4" aria-label="Panel de fechas y navegación">

      <div className="card p-4">
        <h2 className="font-display text-base font-bold text-brand-700 dark:text-brand-300 mb-3">Fechas clave</h2>
        <ul className="flex flex-col gap-2">
          {FECHAS.map(({ label, desc }) => (
            <li key={label} className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-2">
              <strong className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</strong>
              <span className="text-xs text-slate-500 dark:text-slate-400">{desc}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card p-4">
        <h2 className="font-display text-base font-bold text-brand-700 dark:text-brand-300 mb-3">Ir a sección</h2>
        <nav>
          {sections.map(s => (
            <a key={s.id} href={`#${s.id}`} className={navLinkClass}>{s.title}</a>
          ))}
        </nav>
      </div>

      <div className="card p-4">
        <h2 className="font-display text-base font-bold text-brand-700 dark:text-brand-300 mb-2">Uso recomendado</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Marca solo lo que ya tienes listo o validado. Las fechas aparecen como referencia, no como tareas independientes.
        </p>
      </div>

      <div className="card p-4">
        <h2 className="font-display text-base font-bold text-brand-700 dark:text-brand-300 mb-3">Documentos fuente</h2>
        <nav>
          <a href="/docs/convocatoria-estimulo-2526.pdf" target="_blank" rel="noopener noreferrer" className={navLinkClass}>
            Convocatoria 2-2526
          </a>
          <a href="/docs/cedula-edd.pdf" target="_blank" rel="noopener noreferrer" className={navLinkClass}>
            Cédula de evaluación
          </a>
        </nav>
      </div>

    </aside>
  )
}
