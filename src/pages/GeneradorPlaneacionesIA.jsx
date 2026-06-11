import { useReveal } from '../hooks/useReveal'
import LandingLayout from '../components/landing/LandingLayout'
import LandingHero from '../components/landing/LandingHero'
import LandingCta from '../components/landing/LandingCta'

export default function GeneradorPlaneacionesIA() {
  const revealQue = useReveal()
  const revealVentajas = useReveal()
  const revealVentajasLista = useReveal()
  const revealFaq = useReveal()

  return (
    <LandingLayout>
      <article>
        <LandingHero
          title={
            <>
              Generador de Planeaciones Didácticas <span className="italic text-accent-600 dark:text-accent-400">con IA</span> para CONALEP
            </>
          }
          subtitle="Planea Pro usa inteligencia artificial para leer tu PE y GPE, y generar automáticamente una planeación didáctica completa en formato 2023."
          chips={[
            ['PE + GPE', 'La IA lee tus documentos reales'],
            ['Sesiones', 'Actividades con coherencia interna'],
            ['Regeneración', 'Por RA, hasta quedar conforme'],
          ]}
          ctaLabel="Probar el generador"
        />

        <section className="mt-14 space-y-8">
          <div ref={revealQue} className="reveal">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">¿Qué hace la IA de Planea Pro?</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed">
              El modelo de IA analiza el Programa de Estudio (PE) y la Guía de Práctica Educativa (GPE) para extraer
              automáticamente las competencias, resultados de aprendizaje, contenidos específicos y actividades propuestas.
              Con esa información, construye sesiones de aprendizaje estructuradas siguiendo el formato oficial 2023 de CONALEP.
            </p>
          </div>

          <div ref={revealVentajas} className="reveal">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">Ventajas del generador con IA</h2>
            <ul ref={revealVentajasLista} className="reveal-stagger mt-3 space-y-2 text-slate-600 dark:text-slate-400 list-disc list-inside leading-relaxed">
              <li>Reduce de horas a minutos la elaboración de planeaciones</li>
              <li>Respeta la estructura oficial del Modelo 2023 en cada campo</li>
              <li>Genera los tres momentos didácticos (inicio, desarrollo, cierre) con coherencia interna</li>
              <li>Exporta en formato Word compatible con las plantillas oficiales</li>
              <li>Regeneración por resultado de aprendizaje si algo no cumple tus expectativas</li>
            </ul>
          </div>

          <div ref={revealFaq} className="reveal">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">Preguntas frecuentes sobre el generador IA</h2>
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
                <dd className="mt-1 text-slate-600 dark:text-slate-400">Sí. Puedes regenerar cada resultado de aprendizaje hasta quedar conforme antes de exportar.</dd>
              </div>
            </dl>
          </div>
        </section>

        <LandingCta
          title="Deja que la IA arme la primera versión."
          subtitle="Sube tu PE y GPE, revisa las sesiones generadas y exporta a Word. Tú decides la versión final."
          ctaLabel="Probar el generador"
        />
      </article>
    </LandingLayout>
  )
}
