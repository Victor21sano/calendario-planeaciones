import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function RegisterPage() {
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signupWithProfile, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      return setError('Las contraseñas no coinciden')
    }

    if (password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres')
    }

    try {
      setError('')
      setLoading(true)
      await signupWithProfile(email, password, nombreCompleto)
      navigate('/')
    } catch (err) {
      console.error(err)
      setError('Error al crear la cuenta. Intenta con otro correo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleSignup() {
    try {
      setError('')
      setLoading(true)
      await loginWithGoogle()
      navigate('/')
    } catch (err) {
      console.error(err)
      setError('Error al registrarse con Google.')
    } finally {
      setLoading(false)
    }
  }

  // Password strength indicator
  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthColors = ['bg-slate-200 dark:bg-slate-700', 'bg-danger-500', 'bg-warning-500', 'bg-success-500']
  const strengthText = ['', 'Débil', 'Media', 'Fuerte']

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_left,#d6efe9,transparent_40%),linear-gradient(135deg,#fffdf8_0%,#f7f3ea_55%,#fdf0e9_100%)] dark:bg-[linear-gradient(135deg,#0d1614_0%,#111a18_55%,#1a1512_100%)] p-4">
      {/* Halos cálidos — Archivo Vivo */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-brand-300/20 dark:bg-brand-900/25 blur-3xl" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-accent-300/15 dark:bg-accent-900/20 blur-3xl" />
      </div>

      <div className="card w-full max-w-md p-8 relative z-10 animate-slide-up">
        
        <div className="text-center mb-8">
          <h1 className="font-display text-[1.7rem] font-semibold tracking-tight text-slate-900 dark:text-white">Crea tu cuenta</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Únete para guardar todas tus planeaciones</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/40 text-danger-600 dark:text-danger-400 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">
              Nombre completo del docente
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                className="input-base pl-10"
                placeholder="Lic. Juan Pérez García"
                value={nombreCompleto}
                onChange={e => setNombreCompleto(e.target.value)}
              />
            </div>
          </div>

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

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                type="password"
                required
                className="input-base pl-10"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            {/* Password strength */}
            {password.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 flex gap-1 h-1">
                  <div className={`flex-1 rounded-full ${strength >= 1 ? strengthColors[strength] : strengthColors[0]} transition-colors`} />
                  <div className={`flex-1 rounded-full ${strength >= 2 ? strengthColors[strength] : strengthColors[0]} transition-colors`} />
                  <div className={`flex-1 rounded-full ${strength >= 3 ? strengthColors[strength] : strengthColors[0]} transition-colors`} />
                </div>
                <span className={`text-[10px] font-bold w-10 text-right ${strength === 1 ? 'text-danger-500' : strength === 2 ? 'text-warning-500' : 'text-success-500'}`}>
                  {strengthText[strength]}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <input
                type="password"
                required
                className="input-base pl-10"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-accent w-full justify-center py-2.5 mt-4 text-base"
          >
            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        <div className="mt-6 flex items-center text-sm text-slate-400 before:flex-1 before:border-t before:border-slate-200 dark:before:border-slate-700 before:mr-4 after:flex-1 after:border-t after:border-slate-200 dark:after:border-slate-700 after:ml-4">
          o regístrate con
        </div>

        <button
          onClick={handleGoogleSignup}
          disabled={loading}
          className="btn-secondary w-full justify-center py-2.5 mt-6"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>

        <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">
            Inicia sesión
          </Link>
        </p>

      </div>
    </div>
  )
}
