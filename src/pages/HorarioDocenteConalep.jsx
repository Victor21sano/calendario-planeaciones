import { Link } from 'react-router-dom'
import BrandLogo from '../components/brand/BrandLogo'
import { useReveal } from '../hooks/useReveal'

export default function HorarioDocenteConalep() {
  const revealQue = useReveal()
  const revealComo = useReveal()
  const revealComoLista = useReveal()
  const revealFaq = useReveal()
  const revealCta = useReveal()

  return (
    <div className="min-h-screen surface-atmosphere">
      <header className="mx-auto max-w-4xl px-4 py-6">
        <BrandLogo markClassName="w-10 h-10" />
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-20">
        <article>
          <h1 className="reveal-hero font-display text-5xl sm:text-6xl font-semibold tracking-tight text-slate-900 dark:text-white mt-10">
            Horario Semestral para Docentes CONALEP — Generación Automática
          </h1>
          <p className="reveal-hero reveal-hero-delay-1 mt-5 text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
            Planea Pro calcula automáticamente el horario semestral por módulo, distribuyendo las horas según el PE y las fechas del ciclo escolar.
          </p>

          <section className="mt-12 space-y-8">
            <div ref={revealQue} className="reveal">
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">¿Qué es el horario semestral CONALEP?</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed">
                El horario semestral CONALEP distribuye las horas totales del módulo entre las semanas del ciclo escolar,
                asignando fechas de inicio y fin a cada resultado de aprendizaje y sus actividades. Es un requisito de
                entrega para la coordinación académica del plantel.
              </p>
            </div>

            <div ref={revealComo} className="reveal">
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Cómo genera Planea Pro tu horario</h2>
              <ol ref={revealComoLista} className="reveal-stagger mt-3 space-y-2 text-slate-600 dark:text-slate-400 list-decimal list-inside leading-relaxed">
                <li>Defines el rango de fechas del semestre (fecha inicio y fin)</li>
                <li>Indicas los días de la semana que tienes clase y las horas por día</li>
                <li>Planea Pro distribuye automáticamente las horas del PE respetando la carga horaria</li>
                <li>El horario se integra con la planeación didáctica para que las fechas sean coherentes</li>
              </ol>
            </div>

            <div ref={revealFaq} className="reveal">
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Preguntas frecuentes</h2>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="font-semibold text-slate-800 dark:text-slate-200">¿El horario respeta días festivos?</dt>
                  <dd className="mt-1 text-slate-600 dark:text-slate-400">Planea Pro toma en cuenta los días hábiles al calcular la distribución. Puedes ajustar manualmente si hay días especiales en tu plantel.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-800 dark:text-slate-200">¿El horario se incluye en la exportación a Word?</dt>
                  <dd className="mt-1 text-slate-600 dark:text-slate-400">Sí. La exportación completa incluye el horario semestral y la planeación didáctica en un solo documento Word.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-800 dark:text-slate-200">¿Funciona con grupos de distintos turnos?</dt>
                  <dd className="mt-1 text-slate-600 dark:text-slate-400">Sí. Puedes configurar múltiples grupos con horarios distintos dentro de la misma cuenta.</dd>
                </div>
              </dl>
            </div>
          </section>

          <div ref={revealCta} className="reveal mt-12 flex flex-col sm:flex-row gap-4">
            <Link to="/register" className="btn-accent justify-center px-6 py-3 text-base">
              Generar mi horario gratis
            </Link>
            <Link to="/login" className="btn-secondary justify-center px-6 py-3 text-base">
              Iniciar sesión
            </Link>
          </div>
        </article>
      </main>
    </div>
  )
}
