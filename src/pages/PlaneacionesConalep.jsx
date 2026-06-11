import { useReveal } from '../hooks/useReveal'
import LandingLayout from '../components/landing/LandingLayout'
import LandingHero from '../components/landing/LandingHero'
import LandingCta from '../components/landing/LandingCta'

export default function PlaneacionesConalep() {
  const revealQue = useReveal()
  const revealComo = useReveal()
  const revealComoLista = useReveal()
  const revealFaq = useReveal()

  return (
    <LandingLayout>
      <article>
        <LandingHero
          title={
            <>
              Planeaciones <span className="italic text-accent-600 dark:text-accent-400">Didácticas</span> para CONALEP
            </>
          }
          subtitle="Planea Pro genera automáticamente planeaciones didácticas en formato 2023 para docentes CONALEP. En minutos, no en horas."
          chips={[
            ['Formato 2023', 'Estructura oficial completa'],
            ['3 momentos', 'Inicio, desarrollo y cierre'],
            ['Word', 'Entrega lista para ajustar'],
          ]}
        />

        <section className="mt-14 space-y-8">
          <div ref={revealQue} className="reveal">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">¿Qué incluye una planeación CONALEP formato 2023?</h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed">
              El formato oficial 2023 incluye: datos del docente y módulo, unidad de competencia, resultado de aprendizaje,
              datos específicos (propósito, duración, modalidad, fechas), y los tres momentos didácticos: inicio, desarrollo y cierre.
              Cada momento documenta ambiente de aprendizaje, estrategias de enseñanza y aprendizaje, evaluación, recursos y estudio independiente.
            </p>
          </div>

          <div ref={revealComo} className="reveal">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">Cómo genera Planea Pro tu planeación</h2>
            <ol ref={revealComoLista} className="reveal-stagger mt-3 space-y-2 text-slate-600 dark:text-slate-400 list-decimal list-inside leading-relaxed">
              <li>Subes tu PE (Programa de Estudio) y GPE (Guía de Práctica Educativa)</li>
              <li>La IA extrae módulos, unidades, resultados de aprendizaje y competencias</li>
              <li>Genera las sesiones en formato 2023 con actividades coherentes</li>
              <li>Exportas a Word listo para entregar o ajustar</li>
            </ol>
          </div>

          <div ref={revealFaq} className="reveal">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">Preguntas frecuentes</h2>
            <dl className="mt-4 space-y-4">
              <div>
                <dt className="font-semibold text-slate-800 dark:text-slate-200">¿Funciona para todos los módulos CONALEP?</dt>
                <dd className="mt-1 text-slate-600 dark:text-slate-400">Sí. Funciona con cualquier módulo que tenga PE y GPE disponibles. La IA se adapta al contenido específico de cada módulo.</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-800 dark:text-slate-200">¿Puedo editar la planeación generada?</dt>
                <dd className="mt-1 text-slate-600 dark:text-slate-400">Sí. La exportación a Word (.docx) permite editar cualquier campo antes de entregar.</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-800 dark:text-slate-200">¿Cuánto cuesta?</dt>
                <dd className="mt-1 text-slate-600 dark:text-slate-400">Planea Pro funciona con créditos: 1 crédito = $1 MXN. La planeación completa usa 100 créditos; solo el horario automático, 25 (como anticipo), y completarla después del horario, 75.</dd>
              </div>
            </dl>
          </div>
        </section>

        <LandingCta
          title="Tu próxima planeación, lista en minutos."
          ctaLabel="Generar mi planeación"
        />
      </article>
    </LandingLayout>
  )
}
