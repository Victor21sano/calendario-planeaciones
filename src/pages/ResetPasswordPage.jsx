import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { resetPassword } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setMessage('')
      setError('')
      setLoading(true)
      await resetPassword(email)
      setMessage('Te hemos enviado un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada.')
    } catch (err) {
      console.error(err)
      setError('Error al enviar el enlace de recuperación. Verifica el correo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,#d6efe9,transparent_40%),linear-gradient(135deg,#fffdf8_0%,#f7f3ea_55%,#fdf0e9_100%)] dark:bg-[linear-gradient(135deg,#0d1614_0%,#111a18_55%,#1a1512_100%)] p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-brand-300/18 dark:bg-brand-900/25 blur-3xl" />
      </div>

      <div className="card w-full max-w-md p-8 relative z-10 animate-slide-up">
        
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/40 dark:to-brand-900/20 rounded-2xl items-center justify-center shadow-sm mb-4">
            <svg className="w-7 h-7 text-brand-600 dark:text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="font-display text-[1.7rem] font-semibold tracking-tight text-slate-900 dark:text-white">Recuperar Contraseña</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Te enviaremos instrucciones a tu correo</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/40 text-danger-600 dark:text-danger-400 text-sm text-center font-medium">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-3 rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800/40 text-success-700 dark:text-success-400 text-sm text-center font-medium flex flex-col items-center gap-2">
            <svg className="w-6 h-6 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input
                type="email"
                required
                className="input-base pl-10"
                placeholder="tu@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-accent w-full justify-center py-2.5 mt-4 text-base"
          >
            {loading ? 'Enviando...' : 'Restablecer Contraseña'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link to="/login" className="text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a inicio de sesión
          </Link>
        </div>

      </div>
    </div>
  )
}
