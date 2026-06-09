import { Link } from 'react-router-dom'
import BrandLogo from '../components/brand/BrandLogo'
import { useReveal } from '../hooks/useReveal'

export default function GeneradorPlaneacionesIA() {
  const revealQue = useReveal()
  const revealVentajas = useReveal()
  const revealVentajasLista = useReveal()
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
            Generador de Planeaciones Didácticas con IA para CONALEP
          </h1>
          <p className="reveal-hero reveal-hero-delay-1 mt-5 text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
            Planea Pro usa inteligencia artificial para leer tu PE y GPE, y generar automáticamente una planeación didáctica completa en formato 2023.
          </p>

          <section className="mt-12 space-y-8">
            <div ref={revealQue} className="reveal">
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">¿Qué hace la IA de Planea Pro?</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed">
                El modelo de IA analiza el Programa de Estudio (PE) y la Guía de Práctica Educativa (GPE) para extraer
                automáticamente las competencias, resultados de aprendizaje, contenidos específicos y actividades propuestas.
                Con esa información, construye sesiones de aprendizaje estructuradas siguiendo el formato oficial 2023 de CONALEP.
              </p>
            </div>

            <div ref={revealVentajas} className="reveal">
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Ventajas del generador con IA</h2>
              <ul ref={revealVentajasLista} className="reveal-stagger mt-3 space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside leading-relaxed">
                <li>Reduce de horas a minutos la elaboración de planeaciones</li>
                <li>Respeta la estructura oficial del Modelo 2023 en cada campo</li>
                <li>Genera los tres momentos didácticos (inicio, desarrollo, cierre) con coherencia interna</li>
                <li>Exporta en formato Word compatible con las plantillas oficiales</li>
                <li>Regeneración gratuita si el resultado no cumple tus expectativas</li>
              </ul>
            </div>

            <div ref={revealFaq} className="reveal">
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Preguntas frecuentes sobre el generador IA</h2>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="font-semibold text-slate-800 dark:text-slate-200">¿La IA inventa contenido o usa mi PE/GPE real?</dt>
                  <dd className="mt-1 text-slate-600 dark:text-slate-400">Usa el contenido de tus documentos. La IA no inventa módulos ni competencias — lee y estructura lo que está en tu PE y GPE.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-800 dark:text-slate-200">¿Qué formato de archivo acepta?</dt>
                  <dd className="mt-1 text-slate-600 dark:text-slate-400">Acepta PDF. Sube tu PE y tu GPE en PDF y el sistema extrae el contenido automáticamente.</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-800 dark:text-slate-200">¿Puedo regenerar si no me gusta el resultado?</dt>
                  <dd className="mt-1 text-slate-600 dark:text-slate-400">Sí. La primera regeneración es gratuita. Planea Pro reconoce cuando la calidad no es satisfactoria.</dd>
                </div>
              </dl>
            </div>
          </section>

          <div ref={revealCta} className="reveal mt-12 flex flex-col sm:flex-row gap-4">
            <Link to="/register" className="btn-accent justify-center px-6 py-3 text-base">
              Probar el generador gratis
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
