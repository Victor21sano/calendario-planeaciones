import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fetchMaterias, deleteMateria, duplicarMateria, addMateria, MODELO_2018 } from '../services/materias'
import { tieneDatosCompletos2023 } from '../services/userService'
import { format, differenceInCalendarWeeks } from 'date-fns'
import { es } from 'date-fns/locale'
import SaldoCreditos       from '../components/SaldoCreditos'
import ModalSinCreditos    from '../components/ModalSinCreditos'
import MateriaTypeBadge   from '../components/badges/MateriaTypeBadge'
import EmptyState          from '../components/dashboard/EmptyState'
import ModeloMateriaModal  from '../components/dashboard/ModeloMateriaModal'
import PerfilIncompletoModal from '../components/dashboard/PerfilIncompletoModal'
import BrandLogo           from '../components/brand/BrandLogo'
import AnimatedNumber      from '../components/ui/AnimatedNumber'
import { useSpotlight }    from '../hooks/useSpotlight'
import { useMagnetic }     from '../hooks/useMagnetic'

// ─── Progreso del semestre ────────────────────────────────────
function calcProgreso(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) return null
  const inicio = new Date(fechaInicio + 'T00:00:00')
  const fin    = new Date(fechaFin   + 'T00:00:00')
  const hoy    = new Date()
  if (hoy < inicio) return { pct: 0, estado: 'pendiente', label: `Inicia ${format(inicio, "d 'de' MMM", { locale: es })}` }
  if (hoy > fin)    return { pct: 100, estado: 'finalizado', label: 'Semestre finalizado' }
  const total   = fin.getTime()   - inicio.getTime()
  const elapsed = hoy.getTime()   - inicio.getTime()
  const pct     = Math.min(100, Math.round((elapsed / total) * 100))
  const semanaActual = differenceInCalendarWeeks(hoy, inicio, { locale: es }) + 1
  const semanasTotal = differenceInCalendarWeeks(fin, inicio, { locale: es }) + 1
  return { pct, estado: 'activo', label: `Semana ${semanaActual} de ${semanasTotal}` }
}

// ─── Card de materia ─────────────────────────────────────────
function MateriaCard({ materia, idx, onNavigate, onDuplicate, onDelete }) {
  const uCount  = materia.unidades?.length || 0
  const horasS  = materia.horasSemana || 0
  const progreso = calcProgreso(materia.semestre?.fechaInicio, materia.semestre?.fechaFin)
  const tieneFechas = materia.semestre?.fechaInicio && materia.semestre?.fechaFin

  let rangoFechas = null
  if (tieneFechas) {
    const inicio = new Date(materia.semestre.fechaInicio + 'T00:00:00')
    const fin    = new Date(materia.semestre.fechaFin   + 'T00:00:00')
    const mismoAnio = inicio.getFullYear() === fin.getFullYear()
    rangoFechas = mismoAnio
      ? `${format(inicio, 'MMM', { locale: es })}–${format(fin, 'MMM yyyy', { locale: es })}`
      : `${format(inicio, 'MMM yyyy', { locale: es })} – ${format(fin, 'MMM yyyy', { locale: es })}`
  }

  const { ref: spotRef, onMouseMove: onSpotMove } = useSpotlight()

  return (
    <div
      ref={spotRef}
      onMouseMove={onSpotMove}
      className="card card-spotlight group relative cursor-pointer animate-scale-in"
      style={{ animationDelay: `${Math.min(idx * 50, 250)}ms` }}
      onClick={() => onNavigate(materia.id)}
    >
      {/* Badge + acciones */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
        <MateriaTypeBadge pagada={materia.pagada} />
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button onClick={() => onDuplicate(materia.id)} title="Duplicar" aria-label={`Duplicar ${materia.nombre}`}
            className="icon-button w-7 h-7 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-slate-700">
            <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button onClick={() => onDelete(materia.id)} title="Eliminar" aria-label={`Eliminar ${materia.nombre}`}
            className="icon-button w-7 h-7 text-slate-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20">
            <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative z-[1] p-5 flex flex-col h-full">
        {/* Nombre */}
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 leading-snug pr-20 mb-3 line-clamp-2">
          {materia.nombre}
        </h3>

        {/* Modelo badge */}
        {materia.modelo && materia.modelo !== MODELO_2018 && (
          <span className="inline-block mb-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300">
            Modelo {materia.modelo}
          </span>
        )}

        {/* Metadata */}
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          {rangoFechas
            ? <span>{rangoFechas}</span>
            : <span className="italic text-slate-400 dark:text-slate-500">Sin fechas</span>}
          {(uCount > 0 || horasS > 0) && <span className="text-slate-300 dark:text-slate-600"> · </span>}
          {uCount > 0 && <span>{uCount} {uCount === 1 ? 'unidad' : 'unidades'}</span>}
          {uCount > 0 && horasS > 0 && <span className="text-slate-300 dark:text-slate-600"> · </span>}
          {horasS > 0 && <span>{horasS} hrs/sem</span>}
        </p>

        {/* Progreso */}
        {progreso ? (
          <div className="mt-auto space-y-1.5">
            <div className="flex items-center justify-between">
              {progreso.estado === 'activo' && (
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-success-600 dark:text-success-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
                  Activo
                </span>
              )}
              {progreso.estado === 'finalizado' && (
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Finalizado</span>
              )}
              {progreso.estado === 'pendiente' && (
                <span className="text-[11px] font-medium text-warning-600 dark:text-warning-400">{progreso.label}</span>
              )}
              <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-auto">
                {progreso.estado !== 'pendiente' && progreso.label}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700/60 overflow-hidden">
              <div className={`h-full rounded-full transition-[width,background-color] duration-700 ease-out-strong
                  ${progreso.estado === 'finalizado' ? 'bg-success-400' : 'bg-accent-500 dark:bg-accent-400'}`}
                style={{ width: `${progreso.pct}%` }} />
            </div>
          </div>
        ) : (
          <div className="mt-auto">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">Sin configurar</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[0, 1, 2].map(i => (
        <div key={i} className="card p-5 space-y-4">
          <div className="flex justify-between">
            <div className="h-4 w-2/3 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-5 w-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
          </div>
          <div className="h-3 w-1/2 rounded-md bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse mt-3" />
        </div>
      ))}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────
export default function DashboardPage() {
  const { user, logout, esAdmin, creditos, sinCreditosDisponibles, perfilDocente } = useAuth()
  const [materias,                  setMaterias]                  = useState([])
  const [loading,                   setLoading]                   = useState(true)
  const [searchTerm,                setSearchTerm]                = useState('')
  const [mostrarModalCrear,         setMostrarModalCrear]         = useState(false)
  const [mostrarModalSinCreditos,   setMostrarModalSinCreditos]   = useState(false)
  const [mostrarPerfilIncompleto,   setMostrarPerfilIncompleto]   = useState(false)
  const navigate = useNavigate()
  const crearMag = useMagnetic()

  useEffect(() => { loadMaterias() }, [user])

  // Una materia recién creada que el usuario abandonó sin generar ni capturar
  // nada (regresó desde la pantalla de subida) se considera un borrador vacío.
  function esBorradorVacio(m) {
    const sinUnidades = !m.unidades || m.unidades.length === 0
    const sinFechas   = !m.semestre?.fechaInicio && !m.semestre?.fechaFin
    const sinPlan     = !m.planeacion2023 && !m.estructuraIA
    const nombre      = String(m.nombre || '').trim().toLowerCase()
    const nombreDefault = nombre === '' || nombre === 'nueva materia'
    return sinUnidades && sinFechas && sinPlan && nombreDefault
  }

  async function loadMaterias() {
    try {
      setLoading(true)
      let data = await fetchMaterias(user.uid)

      // Limpieza de borrador abandonado: si se creó una materia nueva y el usuario
      // volvió al panel sin generar ni capturar nada, se elimina para no dejar
      // materias vacías. Solo afecta al borrador recién creado (no a las demás).
      const borradorId = sessionStorage.getItem('planea_borrador_id')
      if (borradorId) {
        const borrador = data.find(m => m.id === borradorId)
        if (borrador && esBorradorVacio(borrador)) {
          try { await deleteMateria(user.uid, borradorId) } catch {}
          data = data.filter(m => m.id !== borradorId)
        }
        sessionStorage.removeItem('planea_borrador_id')
      }

      setMaterias(data)
    } catch (err) { console.error('Error loading materias:', err) }
    finally { setLoading(false) }
  }

  async function handleLogout() {
    try { await logout(); navigate('/login') }
    catch (err) { console.error(err) }
  }

  // Punto de entrada único para crear materia
  function abrirModalCrear() {
    setMostrarModalCrear(true)
  }

  // Resultado del modal: { modelo, conIA }
  async function handleConfirmarCreacion({ modelo, conIA }) {
    setMostrarModalCrear(false)

    // Si eligió Modelo 2023, verificar perfil completo
    if (modelo === '2023' && !tieneDatosCompletos2023(perfilDocente)) {
      sessionStorage.setItem('planea_perfil_continuar', JSON.stringify({
        source: 'dashboard-create',
        modelo,
        conIA,
      }))
      setMostrarPerfilIncompleto(true)
      return
    }

    // Si eligió IA sin créditos, mostrar modal de compra
    if (conIA && !esAdmin && sinCreditosDisponibles) {
      setMostrarModalSinCreditos(true)
      return
    }

    // Crear la materia
    try {
      const defaultMateria = {
        nombre: 'Nueva Materia',
        semestre: { fechaInicio: '', fechaFin: '' },
        horasSemana: '',
        periodosVacacionales: [],
        unidades: [],
        modelo,
        pagada: conIA,
      }
      const newId = await addMateria(user.uid, defaultMateria)
      // Marcar como borrador: si el usuario regresa sin usarla, se limpia al
      // volver al panel (ver loadMaterias / esBorradorVacio).
      sessionStorage.setItem('planea_borrador_id', newId)
      navigate(`/materia/${newId}`, !conIA ? { state: { modoManual: true } } : undefined)
    } catch (err) { console.error('Error creating materia', err) }
  }

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar esta materia? Esta acción no se puede deshacer.')) return
    try { await deleteMateria(user.uid, id); await loadMaterias() }
    catch (err) { console.error(err) }
  }

  async function handleDuplicate(id) {
    try { await duplicarMateria(user.uid, id); await loadMaterias() }
    catch (err) { console.error(err) }
  }

  const { filteredMaterias, totalConIA, totalManuales } = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    let conIA = 0
    let manuales = 0
    const filtradas = []

    for (const materia of materias) {
      if (materia.pagada === false) manuales += 1
      else conIA += 1

      if (!query || materia.nombre.toLowerCase().includes(query)) {
        filtradas.push(materia)
      }
    }

    return { filteredMaterias: filtradas, totalConIA: conIA, totalManuales: manuales }
  }, [materias, searchTerm])

  return (
    <div className="min-h-screen bg-[var(--surface-sunken)] flex flex-col">

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-[#fffdf8]/80 dark:bg-[#182420]/80 backdrop-blur-xl border-b border-brand-100/60 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <BrandLogo className="flex-shrink-0" markClassName="w-8 h-8" />

          <div className="flex items-center gap-2">
            <SaldoCreditos />
            {esAdmin && (
              <Link to="/admin"
                className="pressable hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30">
                <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                Admin
              </Link>
            )}
            {/* Link perfil */}
            <Link
              to="/perfil"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Mi perfil"
            >
              <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Perfil
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-danger-600 dark:hover:text-danger-400 px-2.5 py-1.5 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Encabezado de sección */}
        {!loading && materias.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">
                Centro de trabajo docente
              </p>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Tus planeaciones recientes</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <AnimatedNumber value={materias.length} /> {materias.length === 1 ? 'planeación' : 'planeaciones'}
                {' · '}<AnimatedNumber value={totalConIA} /> con IA, <AnimatedNumber value={totalManuales} /> manuales
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <svg aria-hidden="true" className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  name="buscar-materias"
                  autoComplete="off"
                  placeholder="Buscar…"
                  className="input-base pl-9 text-xs h-9"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <span
                ref={crearMag.ref}
                onMouseMove={crearMag.onMouseMove}
                onMouseLeave={crearMag.onMouseLeave}
                className="inline-block flex-shrink-0 transition-transform duration-300 ease-out-strong will-change-transform"
              >
                <button onClick={abrirModalCrear} className="btn-accent text-xs h-9 gap-1.5">
                  <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Crear planeacion
                </button>
              </span>
            </div>
          </div>
        )}

        {/* Estados */}
        {loading && <SkeletonGrid />}

        {!loading && materias.length === 0 && (
          <EmptyState
            sinCreditosDisponibles={sinCreditosDisponibles}
            onCrear={abrirModalCrear}
          />
        )}

        {!loading && materias.length > 0 && filteredMaterias.length === 0 && (
          <p className="text-center py-20 text-sm text-slate-400 dark:text-slate-500">
            No hay materias que coincidan con "<strong>{searchTerm}</strong>".
          </p>
        )}

        {!loading && filteredMaterias.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMaterias.map((materia, idx) => (
              <MateriaCard
                key={materia.id}
                materia={materia}
                idx={idx}
                onNavigate={id => navigate(`/materia/${id}`)}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Modales ── */}
      {mostrarModalCrear && (
        <ModeloMateriaModal
          sinCreditosDisponibles={sinCreditosDisponibles}
          onConfirmar={handleConfirmarCreacion}
          onCerrar={() => setMostrarModalCrear(false)}
        />
      )}

      {mostrarModalSinCreditos && (
        <ModalSinCreditos
          onComprar={() => navigate('/comprar-creditos')}
          onModoGratuito={() => {
            setMostrarModalSinCreditos(false)
            handleConfirmarCreacion({ modelo: MODELO_2018, conIA: false })
          }}
          onCerrar={() => setMostrarModalSinCreditos(false)}
        />
      )}

      {mostrarPerfilIncompleto && (
        <PerfilIncompletoModal
          onCerrar={() => setMostrarPerfilIncompleto(false)}
        />
      )}
    </div>
  )
}
