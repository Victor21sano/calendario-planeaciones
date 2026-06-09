import { Link } from 'react-router-dom'
import BrandLogo from '../components/brand/BrandLogo'

export default function PlaneacionesConalep() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 dark:from-slate-950 dark:to-slate-900">
      <header className="mx-auto max-w-4xl px-4 py-6">
        <BrandLogo markClassName="w-10 h-10" />
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-20">
        <article>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-900 dark:text-white mt-10">
            Planeaciones Didácticas para CONALEP
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-300 max-w-2xl">
            Planea Pro genera automáticamente planeaciones didácticas en formato 2023 para docentes CONALEP. En minutos, no en horas.
          </p>

          <section className="mt-12 space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">¿Qué incluye una planeación CONALEP formato 2023?</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed">
                El formato oficial 2023 incluye: datos del docente y módulo, unidad de competencia, resultado de aprendizaje,
                datos específicos (propósito, duración, modalidad, fechas), y los tres momentos didácticos: inicio, desarrollo y cierre.
                Cada momento documenta ambiente de aprendizaje, estrategias de enseñanza y aprendizaje, evaluación, recursos y estudio independiente.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Cómo genera Planea Pro tu planeación</h2>
              <ol className="mt-3 space-y-2 text-slate-600 dark:text-slate-400 list-decimal list-inside leading-relaxed">
                <li>Subes tu PE (Programa de Estudio) y GPE (Guía de Práctica Educativa)</li>
                <li>La IA extrae módulos, unidades, resultados de aprendizaje y competencias</li>
                <li>Genera las sesiones en formato 2023 con actividades coherentes</li>
                <li>Exportas a Word listo para entregar o ajustar</li>
              </ol>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Preguntas frecuentes</h2>
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
                  <dt className="font-semibold text-slate-800 dark:text-slate-200">¿Es gratuito?</dt>
                  <dd className="mt-1 text-slate-600 dark:text-slate-400">Planea Pro ofrece una primera planeación gratis. Las siguientes usan créditos con precios accesibles para docentes.</dd>
                </div>
              </dl>
            </div>
          </section>

          <div className="mt-12 flex flex-col sm:flex-row gap-4">
            <Link to="/register" className="inline-flex items-center justify-center rounded-xl bg-teal-700 px-6 py-3 text-base font-semibold text-white hover:bg-teal-800 transition-colors">
              Generar mi primera planeación gratis
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 px-6 py-3 text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Iniciar sesión
            </Link>
          </div>
        </article>
      </main>
    </div>
  )
}
