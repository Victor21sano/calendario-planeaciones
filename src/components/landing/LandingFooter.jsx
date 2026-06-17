import { Link } from 'react-router-dom'
import BrandMark from '../brand/BrandMark'

const ENLACES_PRODUCTO = [
  ['Planeaciones didácticas CONALEP', '/planeaciones-conalep'],
  ['Generador de planeaciones con IA', '/generador-planeaciones-ia'],
  ['Horario semestral automático', '/horario-docente-conalep'],
]

const ENLACES_CUENTA = [
  ['Iniciar sesión', '/login'],
  ['Crear cuenta', '/register'],
  ['Recuperar contraseña', '/reset-password'],
]

function ColumnaEnlaces({ titulo, enlaces }) {
  return (
    <nav aria-label={titulo}>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-300/80">{titulo}</p>
      <ul className="mt-4 space-y-2.5">
        {enlaces.map(([label, to]) => (
          <li key={to}>
            <Link
              to={to}
              className="rounded text-sm text-brand-100/80 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-brand-300"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function LandingFooter() {
  return (
    <footer className="mt-20 bg-brand-900 dark:bg-[#0b1513]">
      <div className="mx-auto grid max-w-4xl gap-10 px-4 py-12 sm:grid-cols-[1.3fr_1fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3" translate="no">
            <BrandMark className="w-9 h-9" compact />
            <p className="font-extrabold tracking-tight text-white">Planea-Pro</p>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-100/70">
            Planeación docente asistida para CONALEP: horarios, formato 2023 y exportación a Word, en minutos.
          </p>
        </div>
        <ColumnaEnlaces titulo="Producto" enlaces={ENLACES_PRODUCTO} />
        <ColumnaEnlaces titulo="Cuenta" enlaces={ENLACES_CUENTA} />
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-4xl px-4 py-5 text-xs text-brand-100/60">
          © {new Date().getFullYear()} Planea-Pro · planea-pro.com.mx
        </p>
      </div>
    </footer>
  )
}
