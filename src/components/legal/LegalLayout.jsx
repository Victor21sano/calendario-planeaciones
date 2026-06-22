import { Link } from 'react-router-dom'
import BrandLogo from '../brand/BrandLogo'
import LandingFooter from '../landing/LandingFooter'

// Layout para páginas legales (Aviso de Privacidad, Términos). Tipografía cuidada
// sin depender de @tailwindcss/typography: estilos por etiqueta vía utilidades.
export default function LegalLayout({ titulo, actualizado, children }) {
  return (
    <div className="min-h-screen surface-atmosphere flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-brand-100/60 dark:border-white/5">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <BrandLogo className="flex-shrink-0" markClassName="w-8 h-8" />
          <Link to="/" className="text-sm font-semibold text-brand-700 dark:text-brand-300 hover:underline">Ir al inicio</Link>
        </div>
      </header>

      <main className="flex-1 w-full">
        <div className="bg-gradient-to-r from-brand-800 to-brand-600 text-white">
          <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-8">
            <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">{titulo}</h1>
            {actualizado && <p className="mt-1 text-sm opacity-90">Última actualización: {actualizado}</p>}
          </div>
        </div>

        <article className="max-w-[860px] mx-auto px-4 sm:px-6 py-8 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300
          [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-900 dark:[&_h2]:text-white [&_h2]:mt-8 [&_h2]:mb-3
          [&_h3]:font-semibold [&_h3]:text-slate-800 dark:[&_h3]:text-slate-100 [&_h3]:mt-5 [&_h3]:mb-2
          [&_p]:mb-3
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ul]:space-y-1
          [&_li]:marker:text-brand-500
          [&_strong]:text-slate-900 dark:[&_strong]:text-white [&_strong]:font-semibold
          [&_a]:text-brand-700 dark:[&_a]:text-brand-300 [&_a]:font-medium [&_a]:hover:underline
          [&_table]:w-full [&_table]:my-4 [&_table]:text-sm [&_table]:border [&_table]:border-slate-200 dark:[&_table]:border-slate-700 [&_table]:rounded-lg [&_table]:overflow-hidden
          [&_th]:bg-slate-50 dark:[&_th]:bg-slate-800 [&_th]:text-left [&_th]:font-semibold [&_th]:text-slate-700 dark:[&_th]:text-slate-200 [&_th]:p-2.5 [&_th]:border-b [&_th]:border-slate-200 dark:[&_th]:border-slate-700
          [&_td]:p-2.5 [&_td]:align-top [&_td]:border-b [&_td]:border-slate-100 dark:[&_td]:border-slate-800">
          {children}
        </article>
      </main>

      <LandingFooter />
    </div>
  )
}
