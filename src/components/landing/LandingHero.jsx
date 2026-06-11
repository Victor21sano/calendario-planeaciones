import { Link } from 'react-router-dom'

/**
 * Hero editorial de las landings SEO — espeja el panel lateral del login
 * (píldora, Fraunces con énfasis coral en cursiva, mini-cards de vidrio).
 * `title` admite JSX para marcar el énfasis: el texto del H1 no debe cambiar
 * (SEO), solo su presentación.
 */
export default function LandingHero({
  eyebrow = 'Para docentes CONALEP',
  title,
  subtitle,
  chips = [],
  ctaLabel = 'Crear mi cuenta',
}) {
  return (
    <section className="mt-8 sm:mt-12">
      <p className="reveal-hero mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-700 shadow-sm backdrop-blur dark:border-brand-800/60 dark:bg-slate-900/50 dark:text-brand-300">
        <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
        {eyebrow}
      </p>

      <h1 className="reveal-hero max-w-3xl font-display text-[2.5rem] font-semibold leading-[1.07] tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-[3.5rem]">
        {title}
      </h1>

      <p className="reveal-hero reveal-hero-delay-1 mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
        {subtitle}
      </p>

      <div className="reveal-hero reveal-hero-delay-2 mt-8 flex flex-col gap-3 sm:flex-row">
        <Link to="/register" className="btn-accent justify-center px-6 py-3 text-base">
          {ctaLabel}
        </Link>
        <Link to="/login" className="btn-secondary justify-center px-6 py-3 text-base">
          Iniciar sesión
        </Link>
      </div>

      {chips.length > 0 && (
        <div className="reveal-hero reveal-hero-delay-2 mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
          {chips.map(([chipTitle, chipDesc]) => (
            <div
              key={chipTitle}
              className="rounded-2xl border border-brand-100/80 bg-white/70 p-4 shadow-sm backdrop-blur transition-transform duration-300 ease-out-strong hover:-translate-y-0.5 dark:border-white/10 dark:bg-slate-900/55"
            >
              <p className="font-display text-base font-semibold text-brand-800 dark:text-brand-200">{chipTitle}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{chipDesc}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
