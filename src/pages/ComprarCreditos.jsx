import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ComprarCreditos() {
  const { creditos } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center space-y-6">

          {/* Icono */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center mx-auto shadow-lg shadow-primary-500/25">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          {/* Saldo actual */}
          {creditos !== null && (
            <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 inline-block">
              <p className="text-xs text-slate-400 dark:text-slate-500">Tu saldo actual</p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {creditos} {creditos === 1 ? 'crédito' : 'créditos'}
              </p>
            </div>
          )}

          {/* Mensaje */}
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
              Adquiere créditos
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Los créditos se adquieren directamente con el administrador de tu plantel.
              El pago se realiza en persona y los créditos se acreditan al instante.
            </p>
          </div>

          {/* Precio */}
          <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/40 text-left space-y-2">
            <p className="text-xs font-bold text-primary-700 dark:text-primary-300 uppercase tracking-wide">
              Precio
            </p>
            <p className="text-2xl font-extrabold text-primary-700 dark:text-primary-300">
              $100 MXN <span className="text-sm font-semibold">por módulo</span>
            </p>
            <p className="text-xs text-primary-600 dark:text-primary-400">
              1 crédito = 1 módulo completo (todas sus RAs, tablas y secuencias didácticas)
            </p>
          </div>

          {/* Instrucción */}
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
            <p className="font-semibold text-slate-700 dark:text-slate-300">¿Cómo funciona?</p>
            <p>1. Acércate al administrador del plantel.</p>
            <p>2. Indica cuántos módulos necesitas generar.</p>
            <p>3. Realiza el pago en efectivo o transferencia.</p>
            <p>4. El administrador acredita los créditos al instante desde su panel.</p>
            <p>5. Recarga esta página — el saldo se actualiza solo.</p>
          </div>

          <Link to="/" className="btn-secondary w-full justify-center">
            Volver al inicio
          </Link>

        </div>
      </div>
    </div>
  )
}
