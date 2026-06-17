import { Link } from 'react-router-dom'
import { useReveal } from '../../hooks/useReveal'

/**
 * Banda de cierre de las landings: tarjeta de vidrio con radiales cálidos
 * y LA acción principal (coral) repetida al final del recorrido de lectura.
 */
export default function LandingCta({
  title = 'Tu próximo semestre, planeado en minutos.',
  subtitle = 'Crea tu cuenta, sube tu PE y GPE, y entrega planeaciones en formato 2023 listas para revisar.',
  ctaLabel = 'Crear mi cuenta',
}) {
  const revealCta = useReveal()

  return (
    <div ref={revealCta} className="reveal mt-16">
      <section className="relative overflow-hidden rounded-3xl border border-brand-100/80 bg-white/70 p-8 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/55 sm:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(28rem_16rem_at_85%_-20%,rgba(232,93,63,0.10),transparent_60%),radial-gradient(24rem_14rem_at_0%_120%,rgba(15,118,110,0.10),transparent_60%)] dark:bg-[radial-gradient(28rem_16rem_at_85%_-20%,rgba(232,93,63,0.08),transparent_60%),radial-gradient(24rem_14rem_at_0%_120%,rgba(94,234,212,0.07),transparent_60%)]"
        />
        <div className="relative">
          <h2 className="max-w-xl font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-400">{subtitle}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/register" className="btn-accent justify-center px-6 py-3 text-base">
              {ctaLabel}
            </Link>
            <Link to="/login" className="btn-secondary justify-center px-6 py-3 text-base">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
