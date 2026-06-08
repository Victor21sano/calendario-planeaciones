import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { actualizarPerfilDocente } from '../services/userService'
import { addMateria } from '../services/materias'

export default function PerfilPage() {
  const { user, perfilDocente, updatePerfilDocente } = useAuth()
  const navigate = useNavigate()

  const [nombre,      setNombre]      = useState('')
  const [numEmpleado, setNumEmpleado] = useState('')
  const [plantel,     setPlantel]     = useState('')
  const [guardando,   setGuardando]   = useState(false)
  const [exito,       setExito]       = useState(false)
  const [error,       setError]       = useState('')

  // Cargar datos del perfil al montar
  useEffect(() => {
    setNombre(perfilDocente.nombre      || '')
    setNumEmpleado(perfilDocente.numEmpleado || '')
    setPlantel(perfilDocente.plantel    || '')
  }, [perfilDocente])

  async function handleGuardar(e) {
    e.preventDefault()
    setError('')
    setExito(false)

    // Validaciones
    if (nombre.trim().length < 3)  { setError('El nombre debe tener al menos 3 caracteres.'); return }
    if (nombre.trim().length > 200) { setError('El nombre no puede exceder 200 caracteres.'); return }
    if (!/^[0-9]{4,15}$/.test(numEmpleado.trim())) {
      setError('El número de empleado debe tener entre 4 y 15 dígitos numéricos.')
      return
    }
    if (plantel.trim().length < 2)  { setError('El plantel debe tener al menos 2 caracteres.'); return }
    if (plantel.trim().length > 100) { setError('El plantel no puede exceder 100 caracteres.'); return }

    setGuardando(true)
    try {
      const datos = { nombre: nombre.trim(), numEmpleado: numEmpleado.trim(), plantel: plantel.trim() }
      await actualizarPerfilDocente(user.uid, datos)
      // Actualizar el contexto local también
      await updatePerfilDocente(datos)
      setExito(true)
      const pendienteRaw = sessionStorage.getItem('planea_perfil_continuar')
      if (pendienteRaw) {
        const pendiente = JSON.parse(pendienteRaw)
        if (pendiente.source === 'dashboard-create') {
          sessionStorage.removeItem('planea_perfil_continuar')
          const defaultMateria = {
            nombre: 'Nueva Materia',
            semestre: { fechaInicio: '', fechaFin: '' },
            horasSemana: '',
            periodosVacacionales: [],
            unidades: [],
            modelo: pendiente.modelo,
            pagada: pendiente.conIA,
          }
          const newId = await addMateria(user.uid, defaultMateria)
          navigate(`/materia/${newId}`, !pendiente.conIA ? { state: { modoManual: true } } : undefined)
          return
        }
        if (pendiente.source === 'planificador') {
          navigate(`/materia/${pendiente.materiaId}`, { state: { continuarTrasPerfil: true } })
          return
        }
      }
      setTimeout(() => setExito(false), 3000)
    } catch (err) {
      setError('Error al guardar. Intenta de nuevo.')
      console.error(err)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/5">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link
            to="/"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="font-extrabold text-base text-slate-800 dark:text-white">Mi perfil</h1>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-10 w-full">
        <div className="card p-8">

          <div className="mb-8">
            <h2 className="font-display text-xl font-semibold text-slate-900 dark:text-white mb-1">Datos del docente</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Estos datos aparecen en tus planeaciones del <strong>Modelo 2023</strong>.
              Mantenlos actualizados para que tus planeaciones sean correctas.
            </p>
          </div>

          <form onSubmit={handleGuardar} className="space-y-5">
            {/* Correo (readonly) */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">
                Correo electrónico
              </label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="input-base opacity-60 cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 ml-1">
                Asociado a tu cuenta. No se puede cambiar desde aquí.
              </p>
            </div>

            {/* Nombre */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">
                Nombre completo *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                required
                placeholder="Ej. María Fernández López"
                maxLength={200}
                className="input-base"
              />
            </div>

            {/* Número de empleado */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">
                Número de empleado *
              </label>
              <input
                type="text"
                value={numEmpleado}
                onChange={e => setNumEmpleado(e.target.value.replace(/\D/g, ''))}
                required
                placeholder="Solo dígitos, 4–15 caracteres"
                maxLength={15}
                className="input-base font-mono tracking-wider"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 ml-1">
                Aparece en las planeaciones oficiales del CONALEP.
              </p>
            </div>

            {/* Plantel */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 ml-1">
                Plantel *
              </label>
              <input
                type="text"
                value={plantel}
                onChange={e => setPlantel(e.target.value)}
                required
                placeholder="Ej. CONALEP Salamanca"
                maxLength={100}
                className="input-base"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/40 text-xs font-medium text-danger-700 dark:text-danger-300 animate-slide-down">
                {error}
              </div>
            )}

            {/* Éxito */}
            {exito && (
              <div className="p-3 rounded-xl bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800/40 text-xs font-medium text-success-700 dark:text-success-300 flex items-center gap-2 animate-slide-down">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Perfil guardado correctamente.
              </div>
            )}

            <button
              type="submit"
              disabled={guardando}
              className="btn-primary w-full justify-center py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guardando ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Guardando…
                </>
              ) : 'Guardar cambios'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
