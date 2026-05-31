import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const CONFIGS = {
  exito: {
    icon: (
      <svg className="w-12 h-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg:    'bg-emerald-50 dark:bg-emerald-900/20',
    title: '¡Pago exitoso!',
    body:  'Tus créditos ya están disponibles en tu cuenta. Puedes empezar a generar planeaciones de inmediato.',
    cta:   'Ir a generar planeaciones',
    ctaTo: '/',
    ctaClass: 'btn-primary',
  },
  pendiente: {
    icon: (
      <svg className="w-12 h-12 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg:    'bg-amber-50 dark:bg-amber-900/20',
    title: 'Pago pendiente',
    body:  'Tu pago está en proceso. Si pagaste con OXXO o SPEI, tus créditos se acreditarán automáticamente al confirmarse el pago (puede tardar hasta 48 horas). No necesitas hacer nada más — el saldo se actualizará solo en cuanto se confirme.',
    cta:   'Volver al inicio',
    ctaTo: '/',
    ctaClass: 'btn-secondary',
  },
  error: {
    icon: (
      <svg className="w-12 h-12 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bg:    'bg-rose-50 dark:bg-rose-900/20',
    title: 'El pago no se completó',
    body:  'Hubo un problema con el pago. No se realizó ningún cargo. Puedes intentarlo de nuevo con el mismo u otro método de pago.',
    cta:   'Intentar de nuevo',
    ctaTo: '/comprar-creditos',
    ctaClass: 'btn-primary',
  },
}

export default function PagoResultado() {
  const { resultado } = useParams()
  const [params]      = useSearchParams()
  const { creditos }  = useAuth()

  const config = CONFIGS[resultado] || CONFIGS.error
  const paymentId = params.get('payment_id')
  const status    = params.get('status')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className={`rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center shadow-xl`}>
          {/* Icono */}
          <div className={`w-20 h-20 rounded-3xl ${config.bg} flex items-center justify-center mx-auto mb-6`}>
            {config.icon}
          </div>

          {/* Título */}
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white mb-3">
            {config.title}
          </h1>

          {/* Descripción */}
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            {config.body}
          </p>

          {/* Saldo actualizado (si exitoso) */}
          {resultado === 'exito' && creditos !== null && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                Saldo actual: {creditos} {creditos === 1 ? 'crédito' : 'créditos'}
              </p>
            </div>
          )}

          {/* Referencia */}
          {paymentId && (
            <p className="text-[10px] text-slate-300 dark:text-slate-600 mb-6 font-mono">
              Referencia: {paymentId}
            </p>
          )}

          {/* CTA */}
          <Link to={config.ctaTo} className={`${config.ctaClass} w-full justify-center`}>
            {config.cta}
          </Link>

          {resultado !== 'exito' && (
            <Link to="/" className="block mt-3 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
              Ir al inicio
            </Link>
          )}
        </div>

        {resultado === 'pendiente' && (
          <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-4">
            El saldo se actualiza en tiempo real — no necesitas recargar la página.
          </p>
        )}
      </div>
    </div>
  )
}
