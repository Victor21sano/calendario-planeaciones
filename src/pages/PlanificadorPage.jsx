import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fetchMateria, updateMateria, actualizarMateriaConPlaneacion2023, MODELO_2023 } from '../services/materias'
import CalendarioForm from '../components/CalendarioForm'
import EstructuraForm from '../components/EstructuraForm'
import ResultadoTabla from '../components/ResultadoTabla'
import PlaneacionGeneradorSection from '../components/PlaneacionGeneradorSection'
import ModalSinCreditos    from '../components/ModalSinCreditos'
import ModalCapturaFechas  from '../components/onboarding/ModalCapturaFechas'
import { calcularPlaneacion, calcularSemanasHabiles, calcularHorasSemanaAuto } from '../utils/calculos'
import { validarEntrada } from '../utils/validaciones'
import {
  extraerEstructuraDesdeArchivos,
  extraerEstructuraGratis,
  generarRAsDesdeEstructura,
  buildUnidadesFromAI,
  fileToBase64,
} from '../services/iaPlaneacion'
import { extraerEstructura2023 } from '../services/ia/gemini2023'
import { iniciarSesionGeneracion, finalizarSesionGeneracion } from '../services/creditosService'
import { generarPlaneacion2023Completa, validarRequisitos2023 } from '../services/ia/orquestador2023'
import { tieneDatosCompletos2023 } from '../services/userService'
import { PreviewModelo2023 }                        from '../components/preview2023'
import { EditorModelo2023, ToggleVistaEdicion }    from '../components/editor2023'
import BotonDescargarWord2023                      from '../components/exportacion/BotonDescargarWord2023'
import SplashScreen      from '../components/onboarding/SplashScreen'
import UploadScreen      from '../components/onboarding/UploadScreen'
import LoadingTips       from '../components/onboarding/LoadingTips'
import SuccessTransition from '../components/onboarding/SuccessTransition'
import SaldoCreditos     from '../components/SaldoCreditos'

// Convierte planeacion2023.unidades → formato del Planificador { id, nombre, subunidades }
function extraerUnidadesDesde2023(planeacion2023) {
  if (!planeacion2023?.unidades) return []
  return planeacion2023.unidades.map((u, ui) => ({
    id: `u2023_${ui + 1}`,
    nombre: u.nombre || `Unidad ${ui + 1}`,
    subunidades: (u.ras || []).map((ra, ri) => {
      // El prompt 2023 guarda el nombre del RA en `titulo` (no en `nombre`)
      const nombreRA = ra.titulo || ra.nombre || ''
      return {
        id: `u2023_${ui + 1}_s_${ri + 1}`,
        nombre: ra.codigo ? `${ra.codigo} ${nombreRA}`.trim() : (nombreRA || `RA ${ri + 1}`),
        horas: ra.duracionHoras || 0,
      }
    }),
  }))
}

function sumarHorasUnidades(unidades = []) {
  return unidades
    .flatMap(u => u.subunidades || [])
    .reduce((s, su) => s + (Number(su.horas) || 0), 0)
}

function nombreMateriaDesdeSiglema(planeacion2023) {
  const siglema = planeacion2023?.cabecera?.modulo?.siglema || ''
  const match = String(siglema).match(/([A-Z0-9]{3,})-\d{2}\b/i)
  return match ? match[1].toUpperCase() : ''
}

function debeAutonombrarMateria(nombreActual) {
  const nombre = String(nombreActual || '').trim().toLowerCase()
  return !nombre || nombre === 'nueva materia'
}

// Clave de sessionStorage para guardar los PDFs (base64) y poder generar al pagar sin re-subir
const PDFS_KEY = id => `planea_pdfs_${id}`

// Reconstruye un File a partir de base64 (para regenerar sin re-subir PDFs)
function base64ToFile(b64, name) {
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return new File([arr], name, { type: 'application/pdf' })
}

// Expande períodos vacacionales {fechaInicio, fechaFin} a fechas individuales
function expandirPeriodosVacacionales(periodosVacacionales = []) {
  const fechas = []
  for (const p of periodosVacacionales) {
    if (!p.fechaInicio || !p.fechaFin) continue
    const inicio = new Date(p.fechaInicio + 'T12:00:00')
    const fin    = new Date(p.fechaFin    + 'T12:00:00')
    for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
      fechas.push(d.toISOString().slice(0, 10))
    }
  }
  return fechas
}

const DARK_KEY = 'planeacion_dark_mode'

// ─── Stepper Component ────────────────────────────────────────
function Stepper({ step1Done, step2Done, step3Done }) {
  const steps = [
    { label: 'Semestre', done: step1Done },
    { label: 'Estructura', done: step2Done },
    { label: 'Planeación', done: step3Done },
  ]
  return (
    <div className="hidden sm:flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-300
            ${s.done
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
              : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
            }`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold
              ${s.done
                ? 'bg-primary-500 text-white'
                : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400'
              }`}>
              {s.done ? (
                <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : i + 1}
            </span>
            {s.label}
          </div>
          {i < steps.length - 1 && (
            <div className={`w-5 h-px transition-colors duration-500 ${s.done ? 'bg-primary-300 dark:bg-primary-700' : 'bg-slate-200 dark:bg-slate-700'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Toast Component ──────────────────────────────────────────
function Toast({ visible, message = 'Progreso guardado' }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      <div className="flex items-center gap-2.5 px-5 py-3 bg-emerald-600 text-white rounded-2xl shadow-xl shadow-emerald-900/20">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm font-semibold">{message}</span>
      </div>
    </div>
  )
}

// ─── Alert Banner Component ───────────────────────────────────
function AlertBanner({ type, items, onDismiss }) {
  const config = {
    error: {
      bg:    'bg-rose-50 dark:bg-rose-900/20',
      border:'border-rose-200 dark:border-rose-800/40',
      text:  'text-rose-800 dark:text-rose-300',
      sub:   'text-rose-600 dark:text-rose-400',
      icon:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
      label: 'Errores de validación',
    },
    warning: {
      bg:    'bg-amber-50 dark:bg-amber-900/20',
      border:'border-amber-200 dark:border-amber-800/40',
      text:  'text-amber-800 dark:text-amber-300',
      sub:   'text-amber-700 dark:text-amber-400',
      icon:  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
      label: 'Advertencias',
    },
  }
  const c = config[type]
  return (
    <div className={`flex gap-3 p-4 rounded-2xl border ${c.bg} ${c.border} animate-slide-down`}>
      <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {c.icon}
      </svg>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${c.text}`}>{c.label}</p>
        <ul className="mt-1 space-y-0.5">
          {items.map((e, i) => <li key={i} className={`text-xs ${c.sub}`}>{e}</li>)}
        </ul>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className={`${c.text} hover:opacity-70 transition-opacity flex-shrink-0`}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      )}
    </div>
  )
}

// ─── Main Planificador ────────────────────────────────────────
export default function PlanificadorPage() {
  const { id: materiaId } = useParams()
  const { user, esAdmin, creditos, perfilDocente } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  // Si venimos de DashboardPage con modoManual: true, activar modo manual de inmediato
  const modoManualInicial = location.state?.modoManual || false
  const [mostrarModalSinCreditos, setMostrarModalSinCreditos] = useState(false)

  const [loading, setLoading] = useState(true)
  const [estado, setEstado] = useState({
    nombre: 'Nueva Materia',
    semestre: { fechaInicio: '', fechaFin: '' },
    horasSemana: '',
    horasTotalesPrograma: 0,
    periodosVacacionales: [],
    unidades: [],
    modelo:       '2018',
    pagada:       true,
    planeacion2023: null,
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

  // ── Onboarding flow: 'init'|'splash'|'upload'|'loading'|'success'|'app'
  const [onboardingFase, setOnboardingFase] = useState('init')
  const [genProgress,    setGenProgress]    = useState({ phase: 'idle', message: '', current: 0, total: 0 })
  const [genError,       setGenError]       = useState('')
  const [genResult,      setGenResult]      = useState(null)
  const [pendingResult,  setPendingResult]  = useState(null)

  // Toggle Preview/Editor para planeaciones 2023
  const [modoVista2023, setModoVista2023] = useState('preview')

  // Modal de captura de fechas cuando faltan antes de generar
  const [mostrarModalFechas, setMostrarModalFechas] = useState(false)
  const [guardandoFechas,    setGuardandoFechas]    = useState(false)
  const [pdfsPendientes,     setPdfsPendientes]     = useState(null)
  // true cuando los PDFs pendientes son para el modo gratuito (solo Planificador)
  const [pendienteEsGratis,  setPendienteEsGratis]  = useState(false)
  // Estado de generación on-pay (desde la estructura ya extraída en modo gratis)
  const [generandoPagada,    setGenerandoPagada]    = useState(false)

  // Reset de estados que pueden quedar atascados entre recargas parciales
  useEffect(() => {
    setPdfsPendientes(null)
    setMostrarModalFechas(false)
    setGuardandoFechas(false)
  }, []) // solo al montar

  // Mostrar modal UNA SOLA VEZ cuando el usuario llega al UploadScreen sin créditos.
  // Se usa una ref para no repetirlo si vuelve de un error en modo gratuito.
  const sinCreditosModalMostradoRef = useRef(false)
  const continuacionPerfilProcesadaRef = useRef(false)
  useEffect(() => {
    if (
      onboardingFase === 'upload' &&
      !esAdmin &&
      creditos !== null &&
      creditos <= 0 &&
      !sinCreditosModalMostradoRef.current
    ) {
      sinCreditosModalMostradoRef.current = true
      setMostrarModalSinCreditos(true)
    }
  }, [onboardingFase, esAdmin, creditos])

  // Load materia
  useEffect(() => {
    async function load() {
      try {
        const data = await fetchMateria(user.uid, materiaId)
        if (!data) {
          navigate('/')
          return
        }
        const modelo         = data.modelo || '2018'
        const planeacion2023 = data.planeacion2023 || null
        const semestre       = data.semestre || { fechaInicio: '', fechaFin: '' }
        const periodosVac    = data.periodosVacacionales || []
        const horasTotales   = data.horasTotalesPrograma || 0

        // Si modelo 2023 ya tiene planeación pero no tiene unidades guardadas (o quedaron
        // con solo el código "1.1" por el bug anterior), re-derivarlas con los títulos.
        let unidades = data.unidades || []
        if (modelo === MODELO_2023 && planeacion2023) {
          const soloCodigos = unidades.length === 0 || unidades.every(u =>
            (u.subunidades || []).every(s => /^\d+\.\d+$/.test(String(s.nombre || '').trim()))
          )
          if (soloCodigos) unidades = extraerUnidadesDesde2023(planeacion2023)
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

        if (hTotales > 0 && semestre.fechaInicio && semestre.fechaFin) {
          const semanas = calcularSemanasHabiles(semestre, periodosVac)
          const auto = calcularHorasSemanaAuto(hTotales, semanas.length)
          const capacidadGuardada = Number(horasSemana || 0) * semanas.length
          const debeRecalcular = !horasSemana || (modelo === MODELO_2023 && capacidadGuardada < hTotales)
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

  // Semanas hábiles disponibles (para cálculo automático de horas/semana)
  const semanasHabilesCount = (semestre.fechaInicio && semestre.fechaFin)
    ? calcularSemanasHabiles(semestre, periodosVacacionales).length
    : 0

  useEffect(() => {
    if (loading || estado.modelo !== MODELO_2023) return
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

  // ── Guardado de fechas desde el modal ───────────────────────
  async function handleGuardarFechas({ fechaInicio, fechaFin, periodosVacacionales }) {
    setGuardandoFechas(true)
    try {
      const nuevaSemestre = { ...estado.semestre, fechaInicio, fechaFin }
      const actualizacion  = { semestre: nuevaSemestre }
      if (periodosVacacionales !== undefined) actualizacion.periodosVacacionales = periodosVacacionales
      await updateMateria(user.uid, materiaId, actualizacion)
      setEstado(prev => ({
        ...prev,
        semestre: nuevaSemestre,
        ...(periodosVacacionales !== undefined ? { periodosVacacionales } : {}),
      }))
      setMostrarModalFechas(false)

      if (pdfsPendientes) {
        const { pdfPE, pdfGPE } = pdfsPendientes
        const esGratis = pendienteEsGratis
        setPdfsPendientes(null)
        setPendienteEsGratis(false)
        // Pasar el semestre directamente para evitar dependencia del estado asíncrono
        if (esGratis) {
          await handleFreeExtract(pdfPE, pdfGPE, nuevaSemestre)
        } else {
          await handleOnboardingGenerate(pdfPE, pdfGPE, nuevaSemestre)
        }
      }
    } catch (err) {
      throw new Error('No se pudieron guardar las fechas: ' + err.message)
    } finally {
      setGuardandoFechas(false)
    }
  }

  function handleCerrarModalFechas() {
    setMostrarModalFechas(false)
    setPdfsPendientes(null)
    setPendienteEsGratis(false)
  }

  async function continuarTrasCompletarPerfil(modo, pdfPE, pdfGPE, semestre) {
    const [b64PE, b64GPE] = await Promise.all([fileToBase64(pdfPE), fileToBase64(pdfGPE)])
    sessionStorage.setItem(PDFS_KEY(materiaId), JSON.stringify({ pe: b64PE, gpe: b64GPE }))
    sessionStorage.setItem('planea_perfil_continuar', JSON.stringify({
      source: 'planificador',
      materiaId,
      modo,
      semestre,
    }))
    navigate('/perfil')
  }

  // ── Generación desde la pantalla de onboarding ───────────────
  // semestreOverride: usado cuando se guardan fechas desde el modal (evita state stale)
  async function handleOnboardingGenerate(pdfPE, pdfGPE, semestreOverride = null) {
    const modelo   = estado.modelo || '2018'
    const semestre = semestreOverride || estado.semestre

    console.log('🔵 [Generar] Click recibido', {
      modelo,
      semestre,
      semestreOverride,
      pdfs: { pe: pdfPE?.name, gpe: pdfGPE?.name },
      perfilDocente: { nombre: perfilDocente?.nombre, numEmpleado: perfilDocente?.numEmpleado, plantel: perfilDocente?.plantel },
      creditos,
      esAdmin,
      pdfsPendientes,
      mostrarModalFechas,
    })

    // Detección temprana de fechas faltantes: abre modal en lugar de mostrar error
    if (modelo === MODELO_2023 && !semestreOverride) {
      const faltanFechas = !semestre?.fechaInicio || !semestre?.fechaFin
      if (faltanFechas) {
        console.log('🟡 [Generar] Faltan fechas → abriendo modal de captura')
        setPdfsPendientes({ pdfPE, pdfGPE })
        setMostrarModalFechas(true)
        return
      }
    }

    console.log('🟢 [Generar] Validaciones OK, iniciando flujo de generación (modelo:', modelo, ')')

    // Validación previa sin descontar crédito (solo Modelo 2023)
    // horasSemana ya NO se valida aquí — se calcula automáticamente en el orquestador
    if (modelo === MODELO_2023) {
      if (!tieneDatosCompletos2023(perfilDocente)) {
        await continuarTrasCompletarPerfil('completa', pdfPE, pdfGPE, semestre)
        return
      }
      const problemaRequisitos = validarRequisitos2023({
        perfilDocente,
        semestre,
        pdfPE,
        pdfGPE,
      })
      if (problemaRequisitos) {
        setGenError(problemaRequisitos)
        return
      }
    }

    // Gate de UX: si no hay saldo, abrir modal antes de procesar los PDFs.
    // El descuento real lo hace el servidor al abrir la sesión de generación
    // (iniciarSesionGeneracion), de forma atómica y como única fuente de verdad.
    if (!esAdmin && creditos <= 0) {
      setMostrarModalSinCreditos(true)
      return
    }

    setOnboardingFase('loading')
    setGenError('')
    setGenProgress({ phase: 'converting', message: 'Preparando PDFs…', current: 0, total: 0 })

    // ── Rama Modelo 2023 ──────────────────────────────────────────
    if (modelo === MODELO_2023) {
      try {
        const datosDocente = {
          nombre:      perfilDocente?.nombre      || '',
          numEmpleado: perfilDocente?.numEmpleado || '',
          plantel:     perfilDocente?.plantel     || '',
        }
        const calendario = {
          fechaInicioSemestre: semestre?.fechaInicio || '',
          fechaFinSemestre:    semestre?.fechaFin    || '',
          diasNoLaborables:    expandirPeriodosVacacionales(estado.periodosVacacionales),
        }

        const resultado = await generarPlaneacion2023Completa({
          pdfPE,
          pdfGPE,
          datosDocente,
          calendario,
          onProgreso: p => setGenProgress(p),
        })

        const nombreCorto = nombreMateriaDesdeSiglema(resultado.planeacion)
        if (nombreCorto && debeAutonombrarMateria(estado.nombre)) {
          await updateMateria(user.uid, materiaId, { nombre: nombreCorto })
        }

        // Guardar en Firestore. El crédito ya fue descontado por la sesión de
        // generación que abre el orquestador 2023 (y reembolsado si hubiera fallado).
        await actualizarMateriaConPlaneacion2023(user.uid, materiaId, resultado.planeacion, { pagada: true })

        // Poblar Estructura y horasSemana para la Planeación Calculada.
        // horasSemana se calcula con la regla de 3 del Planificador (totalHoras ÷ semanas hábiles)
        // para que la capacidad cuadre al 100 % — no se usa el valor del orquestador 2023.
        const unidades2023 = extraerUnidadesDesde2023(resultado.planeacion)
        setEstado(prev => {
          const next = {
            ...prev,
            ...(nombreCorto && debeAutonombrarMateria(prev.nombre) ? { nombre: nombreCorto } : {}),
            planeacion2023: resultado.planeacion,
            unidades: unidades2023,
            pagada: true,
            planGeneradaGratis: false,
          }
          const hTotales = unidades2023.flatMap(u => u.subunidades || []).reduce((s, su) => s + (Number(su.horas) || 0), 0)
          const sem = semestre
          if (hTotales > 0 && sem?.fechaInicio && sem?.fechaFin) {
            const semanas = calcularSemanasHabiles(sem, estado.periodosVacacionales || [])
            const auto = calcularHorasSemanaAuto(hTotales, semanas.length)
            if (auto) next.horasSemana = auto.requiereManual ? '' : String(auto.rounded)
          }
          return next
        })

        if (resultado.rasConError.length > 0) {
          console.warn('[2023] RAs con error:', resultado.rasConError)
        }

        sessionStorage.setItem('planea_pro_splash', '1')
        setOnboardingFase('success')
      } catch (err) {
        console.error('🔴 [Generar 2023] Error en generación:', err)
        setGenError(err.message || 'Error generando la planeación 2023.')
        setOnboardingFase('upload')
      }
      return
    }

    // ── Rama Modelo 2018 ──────────────────────────────────────────
    // Abrir una sola sesión de generación (1 crédito) que cubre extracción + RAs.
    let sessionId
    try {
      sessionId = await iniciarSesionGeneracion()
    } catch (err) {
      if (err.code === 'functions/failed-precondition') setMostrarModalSinCreditos(true)
      else setGenError(err.message || 'Error al iniciar la generación.')
      setOnboardingFase('upload')
      return
    }
    try {
      // Paso 1: extraer estructura del PE
      const estructura = await extraerEstructuraDesdeArchivos(pdfPE, pdfGPE, p => setGenProgress(p), sessionId)

      // Actualizar unidades, horas totales y calcular horasSemana con regla de 3
      const newUnidades   = buildUnidadesFromAI(estructura.unidades)
      const horasTotales2018 = estructura.modulo?.horasTotales || 0
      setEstado(prev => {
        const next = { ...prev, unidades: newUnidades, horasTotalesPrograma: horasTotales2018 }
        if (horasTotales2018 > 0 && prev.semestre?.fechaInicio && prev.semestre?.fechaFin) {
          const semanas = calcularSemanasHabiles(prev.semestre, prev.periodosVacacionales || [])
          const auto = calcularHorasSemanaAuto(horasTotales2018, semanas.length)
          if (auto) next.horasSemana = auto.requiereManual ? '' : String(auto.rounded)
        }
        return next
      })

      // Paso 2: generar todas las planeaciones
      const { rasData, errors } = await generarRAsDesdeEstructura(estructura, p => setGenProgress(p), sessionId)
      const result = { estructura, rasData, errors }

      // Confirmar la sesión: el crédito se consume definitivamente.
      await finalizarSesionGeneracion(sessionId, true)

      setGenResult(result)
      sessionStorage.setItem('planea_pro_splash', '1')
      setOnboardingFase('success')
    } catch (err) {
      // Cerrar la sesión con fallo → el servidor reembolsa el crédito.
      await finalizarSesionGeneracion(sessionId, false)
      setGenError(err.message)
      setOnboardingFase('upload')
    }
  }

  function handleOnboardingSuccess() {
    if (genResult) setPendingResult(genResult)
    setOnboardingFase('app')
    setMainTab('planeacion')
  }

  // ── Modo gratuito: extrae solo la estructura del PE sin gastar crédito ──
  // semestreOverride: cuando se guardan fechas desde el modal (evita state stale)
  async function handleFreeExtract(pdfPE, pdfGPE, semestreOverride = null) {
    const semestreActual = semestreOverride || estado.semestre

    // Pedir fechas del semestre si faltan (igual que el flujo de pago)
    if (!semestreOverride && (!semestreActual?.fechaInicio || !semestreActual?.fechaFin)) {
      setPdfsPendientes({ pdfPE, pdfGPE })
      setPendienteEsGratis(true)
      setMostrarModalFechas(true)
      return
    }

    setOnboardingFase('loading')
    setGenError('')
    setMostrarModalSinCreditos(false)
    setGenProgress({ phase: 'converting', message: 'Extrayendo estructura del PE…', current: 0, total: 0 })

    const modelo = estado.modelo || '2018'
    if (modelo === MODELO_2023 && !tieneDatosCompletos2023(perfilDocente)) {
      await continuarTrasCompletarPerfil('gratis', pdfPE, pdfGPE, semestreActual)
      return
    }
    const sem    = semestreOverride || estado.semestre
    const vac    = estado.periodosVacacionales || []

    try {
      // Guardar los PDFs en sessionStorage para poder generar al pagar sin re-subir
      const [b64PE, b64GPE] = await Promise.all([fileToBase64(pdfPE), fileToBase64(pdfGPE)])
      try { sessionStorage.setItem(PDFS_KEY(materiaId), JSON.stringify({ pe: b64PE, gpe: b64GPE })) } catch {}

      // ── Rama Modelo 2023: extraer estructura 2023 (sin actividades, sin cobro) ──
      if (modelo === MODELO_2023) {
        setGenProgress({ phase: 'structure', message: 'Extrayendo estructura del módulo…', current: 0, total: 0 })
        const datosDocente = {
          nombre:      perfilDocente?.nombre      || '',
          numEmpleado: perfilDocente?.numEmpleado || '',
          plantel:     perfilDocente?.plantel     || '',
        }
        const calendario = {
          fechaInicioSemestre: sem?.fechaInicio || '',
          fechaFinSemestre:    sem?.fechaFin    || '',
          diasNoLaborables:    expandirPeriodosVacacionales(vac),
        }
        const estructura2023 = await extraerEstructura2023(pdfPE, pdfGPE, datosDocente, calendario)
        if (estructura2023?.cabecera) estructura2023.cabecera.calendario = calendario

        const unidades2023 = extraerUnidadesDesde2023(estructura2023)
        const hTotales = unidades2023.flatMap(u => u.subunidades || []).reduce((s, su) => s + (Number(su.horas) || 0), 0)
        const nombreCorto = nombreMateriaDesdeSiglema(estructura2023)

        // Persistir la estructura como planeacion2023 (RAs sin actividades aún)
        await actualizarMateriaConPlaneacion2023(user.uid, materiaId, estructura2023, { pagada: false })
        if (nombreCorto && debeAutonombrarMateria(estado.nombre)) {
          await updateMateria(user.uid, materiaId, { nombre: nombreCorto })
        }

        setEstado(prev => {
          const next = {
            ...prev,
            ...(nombreCorto && debeAutonombrarMateria(prev.nombre) ? { nombre: nombreCorto } : {}),
            planeacion2023: estructura2023,
            unidades: unidades2023,
            horasTotalesPrograma: hTotales,
            pagada: false,
            planGeneradaGratis: true,
          }
          if (hTotales > 0 && sem?.fechaInicio && sem?.fechaFin) {
            const semanas = calcularSemanasHabiles(sem, vac)
            const auto = calcularHorasSemanaAuto(hTotales, semanas.length)
            if (auto) next.horasSemana = auto.requiereManual ? '' : String(auto.rounded)
          }
          return next
        })

        sessionStorage.setItem('planea_pro_splash', '1')
        setOnboardingFase('app')
        setMainTab('planificador')
        return
      }

      // ── Rama Modelo 2018 ──
      const estructura = await extraerEstructuraGratis(pdfPE, pdfGPE, p => setGenProgress(p))
      const newUnidades   = buildUnidadesFromAI(estructura.unidades)
      const horasDesdeRAs = newUnidades.flatMap(u => u.subunidades || []).reduce((s, su) => s + (Number(su.horas) || 0), 0)
      const horasTotales  = horasDesdeRAs || estructura.modulo?.horasTotales || 0

      setEstado(prev => {
        const next = {
          ...prev,
          unidades: newUnidades,
          horasTotalesPrograma: horasTotales,
          pagada: false,
          planGeneradaGratis: true,
          estructuraIA: estructura,   // guardada para generar al pagar (sin re-subir PDFs)
        }
        if (horasTotales > 0 && sem?.fechaInicio && sem?.fechaFin) {
          const hPE = estructura.modulo?.horasSemana
          if (hPE > 0) {
            next.horasSemana = String(hPE)
          } else {
            const semanas = calcularSemanasHabiles(sem, vac)
            const auto = calcularHorasSemanaAuto(horasTotales, semanas.length)
            if (auto) next.horasSemana = auto.requiereManual ? '' : String(auto.rounded)
          }
        }
        return next
      })
      await updateMateria(user.uid, materiaId, {
        unidades: newUnidades,
        horasTotalesPrograma: horasTotales,
        pagada: false,
        planGeneradaGratis: true,
        estructuraIA: estructura,
      })

      sessionStorage.setItem('planea_pro_splash', '1')
      setOnboardingFase('app')
      setMainTab('planificador')   // mostrar el Planificador ya lleno
    } catch (err) {
      setGenError(err.message)
      setOnboardingFase('upload')
    }
  }

  // ── Generación on-pay: desbloquea la planeación completa ──
  async function handleGenerarDesdeEstructura() {
    // Sin créditos → mandar a comprar
    if (!esAdmin && creditos <= 0) {
      navigate('/comprar-creditos')
      return
    }

    // ── Modelo 2023: regenerar con los PDFs guardados (re-usa el flujo de pago) ──
    if (estado.modelo === MODELO_2023) {
      const stored = sessionStorage.getItem(PDFS_KEY(materiaId))
      if (!stored) {
        // PDFs no disponibles (otra sesión/dispositivo) → re-subir
        setOnboardingFase('upload')
        return
      }
      try {
        const { pe, gpe } = JSON.parse(stored)
        const pdfPE  = base64ToFile(pe,  'PE.pdf')
        const pdfGPE = base64ToFile(gpe, 'GPE.pdf')
        // handleOnboardingGenerate hace: validar, descontar crédito, generar y guardar
        await handleOnboardingGenerate(pdfPE, pdfGPE, estado.semestre)
      } catch (err) {
        setGenError(err.message || 'Error al generar la planeación.')
        setOnboardingFase('upload')
      }
      return
    }

    // ── Modelo 2018: generar desde la estructura ya extraída ──
    if (!estado.estructuraIA) return

    // Abrir sesión (descuenta 1 crédito en el servidor, atómico).
    let sessionId
    try {
      sessionId = await iniciarSesionGeneracion()
    } catch (err) {
      if (err.code === 'functions/failed-precondition') { navigate('/comprar-creditos'); return }
      setGenError(err.message || 'Error al iniciar la generación.')
      return
    }

    setGenerandoPagada(true)
    setOnboardingFase('loading')
    setGenProgress({ phase: 'structure', message: 'Generando tu planeación didáctica…', current: 0, total: 0 })
    try {
      const { rasData, errors } = await generarRAsDesdeEstructura(estado.estructuraIA, p => setGenProgress(p), sessionId)
      await finalizarSesionGeneracion(sessionId, true)
      await updateMateria(user.uid, materiaId, { pagada: true, planGeneradaGratis: false })
      setGenResult({ estructura: estado.estructuraIA, rasData, errors })
      setEstado(prev => ({ ...prev, pagada: true, planGeneradaGratis: false }))
      setOnboardingFase('success')
    } catch (err) {
      await finalizarSesionGeneracion(sessionId, false)
      setGenError(err.message || 'Error al generar la planeación.')
      setOnboardingFase('app')
      setMainTab('planeacion')
    } finally {
      setGenerandoPagada(false)
    }
  }

  useEffect(() => {
    if (loading || continuacionPerfilProcesadaRef.current || !location.state?.continuarTrasPerfil) return

    const pendienteRaw = sessionStorage.getItem('planea_perfil_continuar')
    if (!pendienteRaw) return

    let pendiente
    try {
      pendiente = JSON.parse(pendienteRaw)
    } catch {
      sessionStorage.removeItem('planea_perfil_continuar')
      return
    }

    if (pendiente.source !== 'planificador' || pendiente.materiaId !== materiaId) return

    const stored = sessionStorage.getItem(PDFS_KEY(materiaId))
    if (!stored) {
      sessionStorage.removeItem('planea_perfil_continuar')
      setOnboardingFase('upload')
      return
    }

    continuacionPerfilProcesadaRef.current = true
    sessionStorage.removeItem('planea_perfil_continuar')

    try {
      const { pe, gpe } = JSON.parse(stored)
      const pdfPE = base64ToFile(pe, 'PE.pdf')
      const pdfGPE = base64ToFile(gpe, 'GPE.pdf')
      if (pendiente.modo === 'gratis') {
        handleFreeExtract(pdfPE, pdfGPE, pendiente.semestre || estado.semestre)
      } else {
        handleOnboardingGenerate(pdfPE, pdfGPE, pendiente.semestre || estado.semestre)
      }
    } catch (err) {
      console.error('Error al continuar tras completar perfil:', err)
      setGenError(err.message || 'No se pudo continuar la generacion.')
      setOnboardingFase('upload')
    }
  }, [loading, location.state, materiaId])

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
    const skipToManual = () => { setOnboardingFase('app'); setMainTab('planeacion') }
    const sinCreditos  = !esAdmin && creditos !== null && creditos <= 0
    return (
      <>
        <UploadScreen
          onGenerate={handleOnboardingGenerate}
          onFreeGenerate={handleFreeExtract}
          onSkip={skipToManual}
          error={genError}
          bloqueado={sinCreditos}
          modelo={estado.modelo || '2018'}
        />
        {mostrarModalSinCreditos && (
          <ModalSinCreditos
            onComprar={() => navigate('/comprar-creditos')}
            onModoGratuito={() => setMostrarModalSinCreditos(false)}
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
              name="nombre-materia"
              autoComplete="off"
              className="bg-transparent font-bold text-lg text-slate-800 dark:text-white border-b border-transparent focus-visible:border-primary-500 focus-visible:outline-none transition-colors max-w-[200px] sm:max-w-[300px]"
              placeholder="Nombre de la materia"
            />
          </div>

          {/* Stepper */}
          <Stepper step1Done={step1Done} step2Done={step2Done} step3Done={step3Done} />

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {guardando && <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline mr-2 animate-pulse" aria-live="polite">Guardando…</span>}

            <SaldoCreditos className="hidden sm:flex" />

            {esAdmin && (
              <Link
                to="/admin"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
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
                        ? 'bg-gradient-to-br from-primary-500 to-violet-600 text-white shadow-sm shadow-primary-200 dark:shadow-primary-900/40'
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
                  className="btn-primary gap-2"
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
              /* ── Generador bloqueado: contenido borroso + paywall (2018 o 2023) ── */
              <div className="relative min-h-[600px]">
                <div className="blur-[6px] pointer-events-none select-none opacity-80 max-h-[640px] overflow-hidden" aria-hidden="true">
                  {estado.modelo === MODELO_2023 && estado.planeacion2023
                    ? <PreviewModelo2023 planeacion={estado.planeacion2023} pagada={false} esAdmin={false} />
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
                        modoManualInicial={true}
                        pagada={false}
                        modelo={estado.modelo || '2018'}
                      />
                    )
                  }
                </div>

                <div className="absolute inset-0 flex items-start justify-center pt-8 sm:pt-20 z-10">
                  <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 max-w-md mx-4 text-center space-y-5 animate-scale-in">
                    <div className="relative inline-flex">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full animate-pulse" />
                    </div>

                    <div>
                      <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mb-1.5">
                        Contenido bloqueado
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        {(!esAdmin && creditos <= 0)
                          ? <>Compra créditos para <strong className="text-primary-600 dark:text-primary-400">desbloquear el contenido</strong> y generar tu planeación didáctica completa con IA.</>
                          : <>Genera tu planeación didáctica completa con IA. Se descontará <strong className="text-primary-600 dark:text-primary-400">1 crédito</strong>.</>
                        }
                      </p>
                    </div>

                    {(!esAdmin && creditos <= 0)
                      ? (
                        <button
                          onClick={() => navigate('/comprar-creditos')}
                          className="btn-primary w-full justify-center py-3 text-base gap-2"
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
                          className="btn-primary w-full justify-center py-3 text-base gap-2 disabled:opacity-60"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          {generandoPagada ? 'Generando…' : 'Generar mi planeación (1 crédito)'}
                        </button>
                      )
                    }

                    <p className="text-xs text-slate-400 dark:text-slate-500">
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
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
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
            : (
              /* Generador Modelo 2018 (o 2023 sin planeación todavía) */
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
                modoManualInicial={modoManualInicial}
                pagada={estado.pagada !== false}
                modelo={estado.modelo || '2018'}
              />
            )
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="text-center py-8 text-xs text-slate-400 dark:text-slate-600 no-print">
        Planificador Docente · datos guardados de forma segura en la nube
      </footer>

      {/* Modal sin créditos — onboarding */}
      {mostrarModalSinCreditos && (
        <ModalSinCreditos
          onComprar={() => navigate('/comprar-creditos')}
          onModoGratuito={() => {
            setMostrarModalSinCreditos(false)
            // Saltar el onboarding de IA y entrar directo en modo manual
            setOnboardingFase('app')
            setMainTab('planificador')
          }}
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
