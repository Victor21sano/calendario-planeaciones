import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AnimatedNumber from './ui/AnimatedNumber'

export default function SaldoCreditos({ className = '' }) {
  const { user, esAdmin, creditos, sinCreditosDisponibles } = useAuth()

  if (!user) return null

  return (
    <Link
      to="/comprar-creditos"
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-colors
        ${esAdmin
          ? 'bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800/40 hover:bg-info-100 dark:hover:bg-info-900/30'
          : sinCreditosDisponibles
            ? 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-700/40 hover:bg-warning-100 dark:hover:bg-warning-900/30'
            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
        } ${className}`}
      title={
        esAdmin
          ? 'Cuenta administrador — saldo ilimitado'
          : sinCreditosDisponibles
            ? 'Sin créditos — haz clic para comprar'
            : `${creditos} crédito(s) disponibles — haz clic para comprar más`
      }
    >
      {/* Icono de moneda */}
      <svg
        className={`w-3.5 h-3.5 flex-shrink-0 ${esAdmin ? 'text-info-500' : sinCreditosDisponibles ? 'text-warning-500' : 'text-success-500'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z"
          clipRule="evenodd"
        />
      </svg>

      {/* Saldo */}
      <span className={`text-xs font-bold ${
        esAdmin ? 'text-info-700 dark:text-info-300'
        : sinCreditosDisponibles ? 'text-warning-700 dark:text-warning-300'
        : 'text-slate-700 dark:text-slate-200'
      }`}>
        {esAdmin ? '∞' : (creditos === null ? '…' : <AnimatedNumber value={creditos} />)}
      </span>

      {esAdmin && (
        <span className="text-[10px] font-semibold text-info-600 dark:text-info-400 leading-none">Admin</span>
      )}
      {sinCreditosDisponibles && (
        <span className="text-[10px] font-semibold text-warning-600 dark:text-warning-400 leading-none">Comprar</span>
      )}
    </Link>
  )
}
