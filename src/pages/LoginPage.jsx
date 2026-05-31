import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import BrandLogo from '../components/brand/BrandLogo'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      setError('')
      setLoading(true)
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      console.error(err)
      setError('No pudimos iniciar sesion. Revisa tu correo y contrasena.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    try {
      setError('')
      setLoading(true)
      await loginWithGoogle()
      navigate(from, { replace: true })
    } catch (err) {
      console.error(err)
      setError('No pudimos iniciar sesion con Google. Intentalo nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#dff8f4,transparent_34%),linear-gradient(135deg,#f8fbfa_0%,#eef7f5_48%,#fff8eb_100%)] p-4 dark:bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.13),transparent_32%),linear-gradient(135deg,#07151a_0%,#0f172a_52%,#18221f_100%)]">
      <main className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 py-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden animate-slide-up lg:block">
          <BrandLogo markClassName="w-12 h-12" showTagline />
          <div className="mt-10 max-w-xl">
            <p className="mb-4 inline-flex rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-brand-700 shadow-sm dark:border-brand-800 dark:bg-slate-900/60 dark:text-brand-300">
              Para docentes CONALEP
            </p>
            <h1 className="text-4xl font-black tracking-tight text-slate-950 dark:text-white">
              Convierte PE y GPE en planeaciones listas para revisar y exportar.
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-600 dark:text-slate-300">
              Planea-Pro te ayuda a ordenar documentos oficiales, calcular horarios y preparar planeaciones didacticas con una experiencia pensada para el trabajo docente.
            </p>
          </div>
          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
            {[
              ['PE + GPE', 'Lectura guiada de documentos'],
              ['Modelo 2023', 'Estructura y sesiones'],
              ['Word', 'Entrega lista para ajustar'],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-900/55">
                <p className="text-sm font-extrabold text-brand-800 dark:text-brand-200">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="card relative z-10 w-full max-w-md justify-self-center p-8 animate-slide-up">
          <div className="mb-8 text-center">
            <BrandLogo className="justify-center" markClassName="w-14 h-14" showTagline />
            <h2 className="mt-7 text-2xl font-extrabold text-slate-900 dark:text-white">
              Accede a tu centro de planeacion
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Continua tus materias, documentos y exportaciones.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-sm font-medium text-rose-600 dark:border-rose-800/40 dark:bg-rose-900/20 dark:text-rose-400" aria-live="polite">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 ml-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Correo electronico
              </span>
              <span className="relative block">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg aria-hidden="true" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  spellCheck={false}
                  required
                  className="input-base pl-10"
                  placeholder="docente@correo.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 ml-1 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                Contrasena
              </span>
              <span className="relative block">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg aria-hidden="true" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  required
                  className="input-base pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </span>
            </label>

            <div className="flex items-center justify-between pt-1">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                <span className="text-xs text-slate-600 dark:text-slate-400">Mantener sesion</span>
              </label>
              <Link to="/reset-password" className="text-xs font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300">
                Olvide mi contrasena
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-2 w-full justify-center py-2.5 text-base"
            >
              {loading ? 'Preparando tu espacio...' : 'Entrar a Planea-Pro'}
            </button>
          </form>

          <div className="mt-6 flex items-center text-sm text-slate-400 before:mr-4 before:flex-1 before:border-t before:border-slate-200 after:ml-4 after:flex-1 after:border-t after:border-slate-200 dark:before:border-slate-700 dark:after:border-slate-700">
            o continua con
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn-secondary mt-6 w-full justify-center py-2.5"
          >
            <svg aria-hidden="true" className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>

          <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No tienes una cuenta?{' '}
            <Link to="/register" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
              Registrate
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
