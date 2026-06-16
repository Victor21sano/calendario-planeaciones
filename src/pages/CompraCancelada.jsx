import { Link } from 'react-router-dom'
import BrandLogo from '../components/brand/BrandLogo'

export default function CompraCancelada() {
  return (
    <div className="min-h-screen surface-atmosphere surface-grain flex flex-col px-4">
      <header className="w-full max-w-md mx-auto pt-6 pb-2">
        <Link to="/" className="inline-flex rounded-xl" aria-label="Planea-Pro — inicio">
          <BrandLogo markClassName="w-10 h-10" />
        </Link>
      </header>
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center py-6">
        <div className="card p-8 text-center space-y-6">
          <h1 className="font-display text-xl font-semibold text-slate-900 dark:text-white">
            Pago cancelado
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No se realizó ningún cargo. Puedes intentarlo de nuevo cuando quieras.
          </p>
          <Link to="/comprar-creditos" className="btn-accent w-full justify-center">
            Volver a comprar
          </Link>
          <Link to="/" className="btn-secondary w-full justify-center">Ir al inicio</Link>
        </div>
      </div>
    </div>
  )
}
