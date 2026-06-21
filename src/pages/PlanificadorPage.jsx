import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fetchMateria, updateMateria, actualizarMateriaConPlaneacion2025, MODELO_2023, MODELO_2025 } from '../services/materias'
import CalendarioForm from '../components/CalendarioForm'
import EstructuraForm from '../components/EstructuraForm'
import ResultadoTabla from '../components/ResultadoTabla'
import PlaneacionGeneradorSection from '../components/PlaneacionGeneradorSection'
import ModalSinCreditos    from '../components/ModalSinCreditos'
import ModalCapturaFechas  from '../components/onboarding/ModalCapturaFechas'
import { calcularPlaneacion, calcularSemanasHabiles, calcularHorasSemanaAuto } from '../utils/calculos'
import { validarEntrada } from '../utils/validaciones'
import { PreviewModelo2023 }                        from '../components/preview2023'
import { EditorModelo2023, ToggleVistaEdicion }    from '../components/editor2023'
import BotonDescargarWord2023                      from '../components/exportacion/BotonDescargarWord2023'
import BotonDescargarWord2025                      from '../components/exportacion/BotonDescargarWord2025'
import SplashScreen      from '../components/onboarding/SplashScreen'
import UploadScreen      from '../components/onboarding/UploadScreen'
import LoadingTips       from '../components/onboarding/LoadingTips'
import SuccessTransition from '../components/onboarding/SuccessTransition'
import SaldoCreditos     from '../components/SaldoCreditos'
import {
  extraerUnidadesDesde2023,
  extraerUnidadesDesde2025,
  sumarHorasUnidades,
  DARK_KEY,
} from './planificador/utils'
import { adaptar2025aVista, vista2023a2025 } from './planificador/adaptador2025'
import Stepper     from './planificador/components/Stepper'
import Toast       from './planificador/components/Toast'
import AlertBanner from './planificador/components/AlertBanner'
import useFlujoGeneracion from './planificador/useFlujoGeneracion'

// ─── Main Planificador ────────────────────────────────────────
export default function PlanificadorPage() {
  const { id: materiaId } = useParams()
  const { user, esAdmin, creditos, perfilDocente } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  // Si venimos de DashboardPage con modoManual: true, activar modo manual de inmediato
  const modoManualInicial = location.state?.modoManual || false

  const [loading, setLoading] = useState(true)
  const [estado, setEstado] = useState({
    nombre: 'Nueva Materia',
    semestre: { fechaInicio: '', fechaFin: '' },
    horasSemana: '',
    horasTotalesPrograma: 0,
    periodosVacacionales: [],
    unidades: [],
    modelo:       '2023',
    pagada:       true,
    planeacion2023: null,
    planeacion2025: null,
    planGeneradaGratis: false,
    estructuraIA: null,
  })

  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem(DARK_KEY) === 'true' } catch { return false }
  })

  const [mainTab, setMainTab] = useState('planificador') // 'planificador' | 'planeacion'

  const [resultado,     setResultado]     = useState(null)
  const [errores,       setErrores]       = useState([])
  const [advertencias,  setAdvertencias]  = useState([])
  const [guardado,      setGuardado]      = useState(false)
  const [guardando,     setGuardando]     = useState(false)
  const [dismissErrors, setDismissErrors] = useState(false)
  const [dismissWarns,  setDismissWarns]  = useState(false)


  // Toggle Preview/Editor para planeaciones 2023
  const [modoVista2023, setModoVista2023] = useState('preview')

  // ── Motor de generación (onboarding / generación / modales) ──
  // Posee el estado de flujo y los handlers; recibe la materia y los setters que
  // debe coordinar. Ver src/pages/planificador/useFlujoGeneracion.js
  const {
    onboardingFase, setOnboardingFase,
    genProgress,
    genError, setGenError,
    genResult,
    pendingResult, setPendingResult,
    mostrarModalSinCreditos, setMostrarModalSinCreditos,
    mostrarModalFechas,
    guardandoFechas,
    generandoPagada,
    handleOnboardingGenerate,
    handleFreeExtract,
    handleGenerarDesdeEstructura,
    handleGuardarFechas,
    handleCerrarModalFechas,
    handleOnboardingSuccess,
  } = useFlujoGeneracion({
    estado,
    setEstado,
    loading,
    setMainTab,
    materiaId,
    user,
    perfilDocente,
    creditos,
    esAdmin,
  })



  // Load materia
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchMateria(user.uid, materiaId)
        if (!data) {
          navigate('/')
          return
        }
        const modelo         = data.modelo || '2023'
        const planeacion2023 = data.planeacion2023 || null
        const planeacion2025 = data.planeacion2025 || null
        const semestre       = data.semestre || { fechaInicio: '', fechaFin: '' }
        const periodosVac    = data.periodosVacacionales || []
        const horasTotales   = data.horasTotalesPrograma || 0

        // Si la planeación ya existe pero no tiene unidades guardadas (o quedaron
        // con solo el código "1.1" por el bug anterior), re-derivarlas con los títulos.
        let unidades = data.unidades || []
        if (modelo === MODELO_2023 && planeacion2023) {
          const soloCodigos = unidades.length === 0 || unidades.every(u =>
            (u.subunidades || []).every(s => /^\d+\.\d+$/.test(String(s.nombre || '').trim()))
          )
          if (soloCodigos) unidades = extraerUnidadesDesde2023(planeacion2023)
        }
        if (modelo === MODELO_2025 && planeacion2025) {
          const soloCodigos = unidades.length === 0 || unidades.every(u =>
            (u.subunidades || []).every(s => /^\d+\.\d+$/.test(String(s.nombre || '').trim()))
          )
          if (soloCodigos) unidades = extraerUnidadesDesde2025(planeacion2025)
        }
        // Si no tiene horasSemana guardada, calcularla con la regla de 3 del Planificador
        // (totalHoras ÷ semanas hábiles) para que la capacidad cuadre al 100 %.
        // Se usa la suma real de las unidades (fiable) en vez del valor del orquestador 2023,
        // que cuenta las semanas distinto y producía un déficit falso.
        let horasSemana = data.horasSemana || ''
        const hUnidades = sumarHorasUnidades(unidades)
        const hTotales = hUnidades
          || horasTotales
          || (modelo === MODELO_2023 ? (planeacion2023?.cabecera?.modulo?.horasTotales || 0) : 0)
          || (modelo === MODELO_2025 ? (planeacion2025?.cabecera?.asignatura?.horasTotales || 0) : 0)

        if (hTotales > 0 && semestre.fechaInicio && semestre.fechaFin) {
          const semanas = calcularSemanasHabiles(semestre, periodosVac)
          const auto = calcularHorasSemanaAuto(hTotales, semanas.length)
          const capacidadGuardada = Number(horasSemana || 0) * semanas.length
          const debeRecalcular = !horasSemana || ((modelo === MODELO_2023 || modelo === MODELO_2025) && capacidadGuardada < hTotales)
          if (auto && debeRecalcular) horasSemana = auto.requiereManual ? '' : String(auto.rounded)
        }

        setEstado({
          nombre: data.nombre || '',
          semestre,
          horasSemana,
          horasTotalesPrograma: horasTotales,
          periodosVacacionales: periodosVac,
          unidades,
          modelo,
          pagada: data.pagada !== false,
          planeacion2023,
          planeacion2025,
          planGeneradaGratis: data.planGeneradaGratis || false,
          estructuraIA: data.estructuraIA || null,
        })
      } catch (err) {
        console.error(err)
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.uid, materiaId, navigate])

  const { nombre, semestre, horasSemana, horasTotalesPrograma, periodosVacacionales, unidades } = estado

  // Vista adaptada del Modelo 2025 a la forma que consumen los componentes 2023.
  const vista2025 = useMemo(
    () => (estado.modelo === MODELO_2025 && estado.planeacion2025 ? adaptar2025aVista(estado.planeacion2025) : null),
    [estado.modelo, estado.planeacion2025]
  )

  // Semanas hábiles disponibles (para cálculo automático de horas/semana)
  const semanasHabilesCount = (semestre.fechaInicio && semestre.fechaFin)
    ? calcularSemanasHabiles(semestre, periodosVacacionales).length
    : 0

  useEffect(() => {
    if (loading || (estado.modelo !== MODELO_2023 && estado.modelo !== MODELO_2025)) return
    if (!semestre.fechaInicio || !semestre.fechaFin || semanasHabilesCount <= 0) return

    const hTotales = sumarHorasUnidades(unidades) || Number(horasTotalesPrograma) || 0
    if (hTotales <= 0) return

    const capacidadActual = Number(horasSemana || 0) * semanasHabilesCount
    if (capacidadActual >= hTotales) return

    const auto = calcularHorasSemanaAuto(hTotales, semanasHabilesCount)
    if (auto?.requiereManual) {
      if (horasSemana) setEstado(prev => ({ ...prev, horasSemana: '' }))
    } else if (auto && Number(horasSemana) !== auto.rounded) {
      setEstado(prev => ({ ...prev, horasSemana: String(auto.rounded) }))
    }
  }, [loading, estado.modelo, semestre, semanasHabilesCount, unidades, horasTotalesPrograma, horasSemana])

  // Dark mode class on html element
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem(DARK_KEY, darkMode)
  }, [darkMode])

  // Determinar fase de onboarding tras cargar la materia
  useEffect(() => {
    if (!loading && onboardingFase === 'init') {
      const isNew = unidades.length === 0 && !semestre.fechaInicio
      if (isNew) {
        const splashShown = sessionStorage.getItem('planea_pro_splash')
        setOnboardingFase(splashShown ? 'upload' : 'splash')
      } else {
        setOnboardingFase('app')
        setMainTab('planificador')
      }
    }
  }, [loading]) // solo al terminar de cargar, una vez

  // Recalculate when inputs change
  useEffect(() => {
    if (loading) return

    // Para Modelo 2023, horasSemana se calcula automáticamente desde el PE → no validar
    const horasSemanaValidar = estado.modelo === MODELO_2023 ? '1' : horasSemana
    const { errores: errs, advertencias: warns } = validarEntrada(semestre, horasSemanaValidar, periodosVacacionales, unidades)
    setErrores(errs)
    setAdvertencias(warns)
    setDismissErrors(false)
    setDismissWarns(false)

    if (errs.length === 0 && semestre.fechaInicio && semestre.fechaFin && horasSemana && unidades.some(u => u.subunidades.length > 0)) {
      try {
        setResultado(calcularPlaneacion(semestre, horasSemana, periodosVacacionales, unidades))
      } catch { setResultado(null) }
    } else {
      setResultado(null)
    }
  }, [semestre, horasSemana, periodosVacacionales, unidades, loading])

  // Auto-save logic (debounced 3s)
  useEffect(() => {
    if (loading) return
    const timer = setTimeout(async () => {
      await autoGuardar()
    }, 3000)
    return () => clearTimeout(timer)
  }, [estado, loading])

  const autoGuardar = useCallback(async () => {
    if (!user || !materiaId) return
    try {
      setGuardando(true)
      await updateMateria(user.uid, materiaId, estado)
      setGuardado(true)
      setTimeout(() => setGuardado(false), 2500)
    } catch (err) {
      console.error('Error auto-saving', err)
    } finally {
      setGuardando(false)
    }
  }, [user, materiaId, estado])

  async function handleVolverAlPanel() {
    if (user && materiaId) {
      try {
        setGuardando(true)
        await updateMateria(user.uid, materiaId, estado)
      } catch (err) {
        console.error('Error saving before leaving', err)
      } finally {
        setGuardando(false)
      }
    }
    navigate('/')
  }

  async function marcarMateriaComoIA() {
    setEstado(prev => {
      if (prev.pagada === true && prev.planGeneradaGratis === false) return prev
      return { ...prev, pagada: true, planGeneradaGratis: false }
    })
    try {
      await updateMateria(user.uid, materiaId, { pagada: true, planGeneradaGratis: false })
    } catch (err) {
      console.error('Error marking materia as generated with IA', err)
    }
  }


  // Stepper states
  const step1Done = !!(semestre.fechaInicio && semestre.fechaFin && horasSemana && Number(horasSemana) > 0)
  const step2Done = unidades.length > 0 && unidades.some(u => u.subunidades.length > 0)
  const step3Done = !!resultado

  if (loading || onboardingFase === 'init') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-10 h-10 border-4 border-slate-200 dark:border-slate-800 border-t-primary-500 rounded-full animate-spin" />
      </div>
    )
  }

  // ── Onboarding screens (new materias) ───────────────────────
  if (onboardingFase === 'splash') {
    return (
      <SplashScreen onComplete={() => {
        sessionStorage.setItem('planea_pro_splash', '1')
        setOnboardingFase('upload')
      }} />
    )
  }

  if (onboardingFase === 'upload') {
    const sinCreditos  = !esAdmin && creditos !== null && creditos <= 0
    return (
      <>
        <UploadScreen
          onGenerate={handleOnboardingGenerate}
          onFreeGenerate={handleFreeExtract}
          error={genError}
          bloqueado={sinCreditos}
          modoSoloPlanificador={modoManualInicial}
          modelo={estado.modelo}
        />
        {mostrarModalSinCreditos && (
          <ModalSinCreditos
            onComprar={() => navigate('/comprar-creditos')}
            onCerrar={() => setMostrarModalSinCreditos(false)}
          />
        )}
        {/* Modal de fechas — debe estar en ESTE return porque el upload es un early-return */}
        <ModalCapturaFechas
          abierto={mostrarModalFechas}
          fechaInicioActual={estado.semestre?.fechaInicio || ''}
          fechaFinActual={estado.semestre?.fechaFin       || ''}
          onGuardar={handleGuardarFechas}
          onCerrar={handleCerrarModalFechas}
          guardando={guardandoFechas}
        />
      </>
    )
  }

  if (onboardingFase === 'loading') {
    return (
      <LoadingTips
        progress={genProgress}
        onCancel={() => { setGenError('Generación cancelada.'); setOnboardingFase('upload') }}
      />
    )
  }

  if (onboardingFase === 'success') {
    return (
      <SuccessTransition
        errors={genResult?.errors}
        onComplete={handleOnboardingSuccess}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/60 dark:border-white/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Logo + Back to Dashboard */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleVolverAlPanel}
              aria-label="Volver al panel"
              className="icon-button w-8 h-8 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 no-print"
              title="Volver al panel"
            >
              <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            
            {/* Inline Title Edit */}
            <input
              type="text"
              value={nombre}
              onChange={e => setEstado(p => ({ ...p, nombre: e.target.value }))}
              id="nombre-materia"
              name="nombre-materia"
              aria-label="Nombre de la materia"
              autoComplete="off"
              className="bg-transparent font-bold text-lg text-slate-800 dark:text-white border-b border-transparent focus-visible:border-primary-500 focus-visible:outline-none transition-colors max-w-[200px] sm:max-w-[300px]"
              placeholder="Nombre de la materia"
            />
          </div>

          {/* Stepper */}
          <Stepper step1Done={step1Done} step2Done={step2Done} step3Done={step3Done} />

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {guardando && <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline mr-2 animate-pulse" aria-live="polite">Guardando…</span>}

            <SaldoCreditos className="hidden sm:flex" />

            {esAdmin && (
              <Link
                to="/admin"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-info-600 dark:text-info-400 bg-info-50 dark:bg-info-900/20 hover:bg-info-100 dark:hover:bg-info-900/30 transition-colors"
                title="Panel de administración"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
                Admin
              </Link>
            )}

            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(d => !d)}
              title={darkMode ? 'Modo claro' : 'Modo oscuro'}
              aria-label={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
              className="icon-button w-8 h-8 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 no-print">
              {darkMode ? (
                <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
                </svg>
              ) : (
                <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Tab Nav ────────────────────────────────────── */}
      <div className="sticky top-14 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/5 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 pt-2">
          {[
            { key: 'planificador', label: 'Planificador de Horarios', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { key: 'planeacion',   label: 'Generador de Planeación',  icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setMainTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-sm font-semibold transition-all duration-200
                ${mainTab === tab.key
                  ? 'bg-slate-50 dark:bg-slate-950 text-primary-600 dark:text-primary-400 border border-b-transparent border-slate-200 dark:border-white/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.key === 'planificador' ? 'Horarios' : 'Planeación'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Layout ─────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">

        {/* ── Tab: Planificador de Horarios ── */}
        {mainTab === 'planificador' && (
          <>
            {/* Alert banners */}
            <div className="space-y-3 mb-4 sm:mb-6 no-print">
              {errores.length > 0 && !dismissErrors && (
                <AlertBanner type="error" items={errores} onDismiss={() => setDismissErrors(true)} />
              )}
              {advertencias.length > 0 && !dismissWarns && (
                <AlertBanner type="warning" items={advertencias} onDismiss={() => setDismissWarns(true)} />
              )}
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">

              {/* ── Left Column — Forms ────────────────────────── */}
              <div className="lg:col-span-6 space-y-6 no-print">
                <CalendarioForm
                  semestre={semestre}
                  horasSemana={horasSemana}
                  periodosVacacionales={periodosVacacionales}
                  horasTotalesPrograma={horasTotalesPrograma}
                  semanasHabilesCount={semanasHabilesCount}
                  onHorasSemanaAuto={h => setEstado(p => ({ ...p, horasSemana: String(h) }))}
                  onChange={({ semestre: s, horasSemana: h, periodosVacacionales: p }) =>
                    setEstado(prev => ({ ...prev, semestre: s, horasSemana: h, periodosVacacionales: p }))
                  }
                />
                <EstructuraForm
                  unidades={unidades}
                  onChange={newUnidades => setEstado(prev => ({ ...prev, unidades: newUnidades }))}
                />
              </div>

              {/* ── Right Column — Results (sticky) ────────────── */}
              <div className="lg:col-span-6 lg:sticky lg:top-28 print-full-width">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 no-print">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                      ${step3Done
                        ? 'bg-gradient-to-br from-brand-600 to-academic-600 text-white shadow-sm shadow-brand-200 dark:shadow-brand-900/40'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}>
                      {step3Done ? (
                        <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      ) : 3}
                    </div>
                    <h2 className="section-title">Planeación Calculada</h2>
                  </div>
                  <ResultadoTabla resultado={resultado} />
                </div>
              </div>

            </div>

            {/* Prompt to go to planeacion tab when ready */}
            {step3Done && (
              <div className="mt-6 flex items-center justify-center no-print">
                <button
                  onClick={() => setMainTab('planeacion')}
                  className="btn-accent gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Continuar al Generador de Planeación
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Tab: Generador/Preview de Planeación ── */}
        {mainTab === 'planeacion' && (
          estado.planGeneradaGratis
            ? (
              /* ── Generador bloqueado: contenido borroso + paywall ── */
              <div className="relative min-h-[600px]">
                <div className="blur-[6px] pointer-events-none select-none opacity-80 max-h-[640px] overflow-hidden" aria-hidden="true" inert="">
                  {estado.modelo === MODELO_2023 && estado.planeacion2023
                    ? <PreviewModelo2023 planeacion={estado.planeacion2023} pagada={false} esAdmin={false} />
                    : estado.modelo === MODELO_2025 && vista2025
                    ? <PreviewModelo2023 planeacion={vista2025} terminologia={vista2025.terminologia} pagada={false} esAdmin={false} />
                    : (
                      <PlaneacionGeneradorSection
                        materiaId={materiaId}
                        unidades={unidades}
                        resultado={resultado}
                        onUpdateUnidades={() => {}}
                        onHorasTotales={() => {}}
                        onHorasSemana={() => {}}
                        pendingGenerationResult={null}
                        onPendingResultApplied={() => {}}
                        onGeneratedComplete={() => {}}
                        pagada={false}
                        modelo={estado.modelo || '2023'}
                      />
                    )
                  }
                </div>

                <div className="absolute inset-0 flex items-start justify-center pt-8 sm:pt-20 z-10">
                  <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 max-w-md mx-4 text-center space-y-5 animate-scale-in">
                    <div className="relative inline-flex">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-600 to-academic-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-warning-400 rounded-full animate-pulse" />
                    </div>

                    <div>
                      <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100 mb-1.5">
                        Contenido bloqueado
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {(!esAdmin && creditos <= 0)
                          ? <>Compra créditos para <strong className="text-primary-600 dark:text-primary-400">desbloquear el contenido</strong> y generar tu planeación didáctica completa con IA.</>
                          : <>Genera tu planeación didáctica completa con IA. Se descontarán <strong className="text-primary-600 dark:text-primary-400">75 créditos</strong>.</>
                        }
                      </p>
                    </div>

                    {(!esAdmin && creditos <= 0)
                      ? (
                        <button
                          onClick={() => navigate('/comprar-creditos')}
                          className="btn-accent w-full justify-center py-3 text-base gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          Comprar créditos para desbloquear
                        </button>
                      )
                      : (
                        <button
                          onClick={handleGenerarDesdeEstructura}
                          disabled={generandoPagada}
                          className="btn-accent w-full justify-center py-3 text-base gap-2 disabled:opacity-60"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          {generandoPagada ? <span className="text-shimmer">Generando…</span> : 'Generar mi planeación (75 créditos)'}
                        </button>
                      )
                    }

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tu Planificador de Horarios ya está listo y disponible en la pestaña anterior.
                    </p>
                  </div>
                </div>
              </div>
            )
            : estado.modelo === MODELO_2023 && estado.planeacion2023
            ? (
              /* Vista previa / Editor Modelo 2023 */
              <div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 no-print">
                  <div>
                    <h2 className="section-title">Planeación — Modelo 2023</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {(estado.planeacion2023.unidades || []).flatMap(u => u.ras).flatMap(r => r.actividadesEspecificas || []).length} actividades
                      {estado.planeacion2023.cabecera?.modulo?.horasSemana > 0 && (
                        <span className="ml-2">
                          · 📊 {estado.planeacion2023.cabecera.modulo.horasSemana} hrs/semana calculadas
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {estado.pagada !== false && (
                      <BotonDescargarWord2023
                        planeacion={estado.planeacion2023}
                        className="text-xs py-1.5 px-3 no-print"
                      />
                    )}
                    {modoVista2023 === 'preview' && (
                      <button onClick={() => window.print()} className="btn-secondary text-xs gap-1.5 no-print">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Imprimir / PDF
                      </button>
                    )}
                    <ToggleVistaEdicion modo={modoVista2023} onCambio={setModoVista2023} />
                  </div>
                </div>

                {modoVista2023 === 'preview'
                  ? (
                    <PreviewModelo2023
                      planeacion={estado.planeacion2023}
                      pagada={estado.pagada !== false}
                      esAdmin={esAdmin}
                    />
                  )
                  : (
                    <EditorModelo2023
                      planeacion={estado.planeacion2023}
                      materiaId={materiaId}
                      pdfPE={null}
                      pdfGPE={null}
                      onCambioPlaneacion={nueva =>
                        setEstado(prev => ({ ...prev, planeacion2023: nueva }))
                      }
                    />
                  )
                }
              </div>
            )
            : estado.modelo === MODELO_2025 && vista2025
            ? (
              /* Vista previa / Editor Modelo 2025 */
              <div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 no-print">
                  <div>
                    <h2 className="section-title">Planeación — Modelo 2025</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {(estado.planeacion2025.propositosFormativos || []).flatMap(pf => pf.sesiones || []).length} sesiones
                      {estado.planeacion2025.cabecera?.asignatura?.horasSemana > 0 && (
                        <span className="ml-2">
                          · 📊 {estado.planeacion2025.cabecera.asignatura.horasSemana} hrs/semana
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {estado.pagada !== false && (
                      <BotonDescargarWord2025
                        planeacion={estado.planeacion2025}
                        className="text-xs py-1.5 px-3 no-print"
                      />
                    )}
                    {modoVista2023 === 'preview' && (
                      <button onClick={() => window.print()} className="btn-secondary text-xs gap-1.5 no-print">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Imprimir / PDF
                      </button>
                    )}
                    <ToggleVistaEdicion modo={modoVista2023} onCambio={setModoVista2023} />
                  </div>
                </div>

                {modoVista2023 === 'preview'
                  ? (
                    <PreviewModelo2023
                      planeacion={vista2025}
                      terminologia={vista2025.terminologia}
                      pagada={estado.pagada !== false}
                      esAdmin={esAdmin}
                    />
                  )
                  : (
                    <EditorModelo2023
                      planeacion={vista2025}
                      terminologia={vista2025.terminologia}
                      materiaId={materiaId}
                      pdfPE={null}
                      pdfGPE={null}
                      onGuardar={async v => {
                        const p = vista2023a2025(v, estado.planeacion2025)
                        await actualizarMateriaConPlaneacion2025(user.uid, materiaId, p)
                        setEstado(prev => ({ ...prev, planeacion2025: p }))
                      }}
                    />
                  )
                }
              </div>
            )
            : (
              /* Fallback: materia sin planeacion2023 generada aún */
              <PlaneacionGeneradorSection
                materiaId={materiaId}
                unidades={unidades}
                resultado={resultado}
                onUpdateUnidades={newUnidades => setEstado(prev => ({ ...prev, unidades: newUnidades }))}
                onHorasTotales={h => setEstado(prev => {
                  const horasTotales = h || 0
                  const next = { ...prev, horasTotalesPrograma: horasTotales }
                  if (horasTotales > 0 && prev.semestre?.fechaInicio && prev.semestre?.fechaFin) {
                    const semanas = calcularSemanasHabiles(prev.semestre, prev.periodosVacacionales || [])
                    const auto = calcularHorasSemanaAuto(horasTotales, semanas.length)
                    if (auto) next.horasSemana = auto.requiereManual ? '' : String(auto.rounded)
                  }
                  return next
                })}
                onHorasSemana={h => {
                  if (h > 0) setEstado(prev => ({ ...prev, horasSemana: String(h) }))
                }}
                pendingGenerationResult={pendingResult}
                onPendingResultApplied={() => setPendingResult(null)}
                onGeneratedComplete={marcarMateriaComoIA}
                pagada={estado.pagada !== false}
                modelo={estado.modelo || '2023'}
              />
            )
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="text-center py-8 text-xs text-slate-500 dark:text-slate-500 no-print">
        Planea-Pro · datos guardados de forma segura en la nube
      </footer>

      {/* Modal sin créditos — onboarding */}
      {mostrarModalSinCreditos && (
        <ModalSinCreditos
          onComprar={() => navigate('/comprar-creditos')}
          onCerrar={() => setMostrarModalSinCreditos(false)}
        />
      )}

      {/* Modal captura de fechas del semestre */}
      <ModalCapturaFechas
        abierto={mostrarModalFechas}
        fechaInicioActual={estado.semestre?.fechaInicio || ''}
        fechaFinActual={estado.semestre?.fechaFin       || ''}
        onGuardar={handleGuardarFechas}
        onCerrar={handleCerrarModalFechas}
        guardando={guardandoFechas}
      />

      {/* ── Toast ──────────────────────────────────────────── */}
      <Toast visible={guardado} />
    </div>
  )
}
