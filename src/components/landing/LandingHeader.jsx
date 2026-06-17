import { Link } from 'react-router-dom'
import BrandLogo from '../brand/BrandLogo'

export default function LandingHeader() {
  return (
    <header className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-6">
      <Link
        to="/login"
        className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        aria-label="Planea-Pro — inicio"
      >
        <BrandLogo markClassName="w-10 h-10" />
      </Link>
      <nav className="flex items-center gap-2" aria-label="Cuenta">
        <Link to="/login" className="btn-ghost hidden whitespace-nowrap sm:inline-flex">
          Iniciar sesión
        </Link>
        <Link to="/register" className="btn-accent whitespace-nowrap">
          Crear cuenta
        </Link>
      </nav>
    </header>
  )
}
